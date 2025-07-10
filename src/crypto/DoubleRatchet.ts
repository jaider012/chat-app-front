import { WebCryptoUtils } from './WebCryptoUtils';
import { MessageEncryption } from './MessageEncryption';

interface RatchetState {
  rootKey: CryptoKey;
  sendingKey: CryptoKey;
  receivingKey: CryptoKey;
  sendingChainKey: CryptoKey;
  receivingChainKey: CryptoKey;
  sendingCounter: number;
  receivingCounter: number;
  previousSendingCounter: number;
  skippedKeys: Map<string, CryptoKey>;
  conversationId: string;
  isInitialized: boolean;
}

export class DoubleRatchet {
  private static readonly MAX_SKIP = 1000;
  private static readonly CHAIN_KEY_CONSTANT = new Uint8Array([0x02]);
  private static readonly MESSAGE_KEY_CONSTANT = new Uint8Array([0x01]);
  
  private states: Map<string, RatchetState> = new Map();
  private messageEncryption: MessageEncryption;

  constructor() {
    this.messageEncryption = new MessageEncryption();
  }

  async initializeRatchet(
    conversationId: string,
    sharedSecret: CryptoKey,
    isInitiator: boolean
  ): Promise<void> {
    const keyPair = await WebCryptoUtils.generateKeyPair();
    
    const state: RatchetState = {
      rootKey: sharedSecret,
      sendingKey: keyPair.privateKey,
      receivingKey: keyPair.publicKey,
      sendingChainKey: sharedSecret,
      receivingChainKey: sharedSecret,
      sendingCounter: 0,
      receivingCounter: 0,
      previousSendingCounter: 0,
      skippedKeys: new Map(),
      conversationId,
      isInitialized: true,
    };

    if (isInitiator) {
      await this.performDHRatchet(state);
    }

    this.states.set(conversationId, state);
  }

  async encryptMessage(
    plaintext: string,
    conversationId: string,
    sender: string
  ): Promise<any> {
    const state = this.states.get(conversationId);
    if (!state || !state.isInitialized) {
      throw new Error('Ratchet not initialized for conversation');
    }

    const messageKey = await this.deriveMessageKey(state.sendingChainKey, state.sendingCounter);
    const encryptedMessage = await this.messageEncryption.encryptMessage(
      plaintext,
      messageKey,
      conversationId,
      sender
    );

    state.sendingCounter++;
    state.sendingChainKey = await this.deriveChainKey(state.sendingChainKey);
    
    return {
      ...encryptedMessage,
      ratchetPublicKey: await WebCryptoUtils.exportPublicKey(state.sendingKey),
      previousCounter: state.previousSendingCounter,
    };
  }

  async decryptMessage(
    encryptedMessage: any,
    conversationId: string
  ): Promise<string> {
    const state = this.states.get(conversationId);
    if (!state || !state.isInitialized) {
      throw new Error('Ratchet not initialized for conversation');
    }

    if (encryptedMessage.ratchetPublicKey) {
      const remotePublicKey = await WebCryptoUtils.importPublicKey(encryptedMessage.ratchetPublicKey);
      await this.performDHRatchet(state, remotePublicKey);
    }

    const messageKey = await this.trySkippedMessageKeys(state, encryptedMessage);
    if (messageKey) {
      return await this.messageEncryption.decryptMessage(encryptedMessage, messageKey);
    }

    if (encryptedMessage.sequenceNumber < state.receivingCounter) {
      throw new Error('Message number too old');
    }

    await this.skipMessageKeys(state, encryptedMessage.sequenceNumber);
    
    const derivedMessageKey = await this.deriveMessageKey(state.receivingChainKey, state.receivingCounter);
    const decryptedMessage = await this.messageEncryption.decryptMessage(encryptedMessage, derivedMessageKey);
    
    state.receivingCounter++;
    state.receivingChainKey = await this.deriveChainKey(state.receivingChainKey);
    
    return decryptedMessage;
  }

  private async performDHRatchet(state: RatchetState, remotePublicKey?: CryptoKey): Promise<void> {
    if (remotePublicKey) {
      state.previousSendingCounter = state.sendingCounter;
      state.sendingCounter = 0;
      state.receivingCounter = 0;
      
      const dhOutput = await WebCryptoUtils.deriveSharedSecret(state.sendingKey, remotePublicKey);
      const newKeys = await this.kdfRootKey(state.rootKey, dhOutput);
      
      state.rootKey = newKeys.rootKey;
      state.receivingChainKey = newKeys.chainKey;
      state.receivingKey = remotePublicKey;
    }

    const newKeyPair = await WebCryptoUtils.generateKeyPair();
    const dhOutput = await WebCryptoUtils.deriveSharedSecret(newKeyPair.privateKey, state.receivingKey);
    const newKeys = await this.kdfRootKey(state.rootKey, dhOutput);
    
    state.rootKey = newKeys.rootKey;
    state.sendingChainKey = newKeys.chainKey;
    state.sendingKey = newKeyPair.privateKey;
  }

  private async kdfRootKey(rootKey: CryptoKey, dhOutput: CryptoKey): Promise<{
    rootKey: CryptoKey;
    chainKey: CryptoKey;
  }> {
    const rootKeyData = await WebCryptoUtils.exportKeyAsBase64(rootKey);
    const dhOutputData = await WebCryptoUtils.exportKeyAsBase64(dhOutput);
    
    const combinedData = `${rootKeyData}:${dhOutputData}`;
    const salt = WebCryptoUtils.generateSalt();
    
    const newRootKey = await WebCryptoUtils.deriveKeyFromPassword(combinedData, salt);
    const newChainKey = await WebCryptoUtils.deriveKeyFromPassword(combinedData + ':chain', salt);
    
    return {
      rootKey: newRootKey,
      chainKey: newChainKey,
    };
  }

  private async deriveChainKey(chainKey: CryptoKey): Promise<CryptoKey> {
    const chainKeyData = await WebCryptoUtils.exportKeyAsBase64(chainKey);
    const salt = DoubleRatchet.CHAIN_KEY_CONSTANT;
    
    return await WebCryptoUtils.deriveKeyFromPassword(chainKeyData, salt);
  }

  private async deriveMessageKey(chainKey: CryptoKey, counter: number): Promise<CryptoKey> {
    const chainKeyData = await WebCryptoUtils.exportKeyAsBase64(chainKey);
    const counterData = counter.toString();
    const combinedData = `${chainKeyData}:${counterData}`;
    const salt = DoubleRatchet.MESSAGE_KEY_CONSTANT;
    
    return await WebCryptoUtils.deriveKeyFromPassword(combinedData, salt);
  }

  private async trySkippedMessageKeys(
    state: RatchetState,
    encryptedMessage: any
  ): Promise<CryptoKey | null> {
    const keyId = `${encryptedMessage.ratchetPublicKey || 'current'}:${encryptedMessage.sequenceNumber}`;
    const messageKey = state.skippedKeys.get(keyId);
    
    if (messageKey) {
      state.skippedKeys.delete(keyId);
      return messageKey;
    }
    
    return null;
  }

  private async skipMessageKeys(state: RatchetState, untilCounter: number): Promise<void> {
    if (state.receivingCounter + DoubleRatchet.MAX_SKIP < untilCounter) {
      throw new Error('Too many skipped messages');
    }
    
    while (state.receivingCounter < untilCounter) {
      const messageKey = await this.deriveMessageKey(state.receivingChainKey, state.receivingCounter);
      const keyId = `current:${state.receivingCounter}`;
      state.skippedKeys.set(keyId, messageKey);
      
      state.receivingCounter++;
      state.receivingChainKey = await this.deriveChainKey(state.receivingChainKey);
    }
  }

  getState(conversationId: string): RatchetState | undefined {
    return this.states.get(conversationId);
  }

  isInitialized(conversationId: string): boolean {
    const state = this.states.get(conversationId);
    return state ? state.isInitialized : false;
  }

  async resetRatchet(conversationId: string): Promise<void> {
    const state = this.states.get(conversationId);
    if (state) {
      state.skippedKeys.clear();
      state.sendingCounter = 0;
      state.receivingCounter = 0;
      state.previousSendingCounter = 0;
      state.isInitialized = false;
    }
  }

  clearConversation(conversationId: string): void {
    this.states.delete(conversationId);
  }

  async performKeyRotation(conversationId: string): Promise<void> {
    const state = this.states.get(conversationId);
    if (!state || !state.isInitialized) {
      throw new Error('Cannot rotate keys - ratchet not initialized');
    }

    await this.performDHRatchet(state);
  }

  getSkippedKeysCount(conversationId: string): number {
    const state = this.states.get(conversationId);
    return state ? state.skippedKeys.size : 0;
  }

  cleanupSkippedKeys(conversationId: string, maxAge: number = 24 * 60 * 60 * 1000): void {
    const state = this.states.get(conversationId);
    if (!state) return;

    const cutoff = Date.now() - maxAge;
    const keysToRemove: string[] = [];
    
    for (const [keyId] of state.skippedKeys) {
      const [, counterStr] = keyId.split(':');
      const counter = parseInt(counterStr, 10);
      
      if (counter < state.receivingCounter - 100) {
        keysToRemove.push(keyId);
      }
    }
    
    keysToRemove.forEach(keyId => state.skippedKeys.delete(keyId));
  }

  async exportRatchetState(conversationId: string): Promise<string | null> {
    const state = this.states.get(conversationId);
    if (!state) return null;

    const exportableState = {
      conversationId: state.conversationId,
      sendingCounter: state.sendingCounter,
      receivingCounter: state.receivingCounter,
      previousSendingCounter: state.previousSendingCounter,
      isInitialized: state.isInitialized,
      skippedKeysCount: state.skippedKeys.size,
    };

    return JSON.stringify(exportableState);
  }
}