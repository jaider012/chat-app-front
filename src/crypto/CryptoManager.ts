import { KeyManager } from './KeyManager';
import { MessageEncryption } from './MessageEncryption';
import { DoubleRatchet } from './DoubleRatchet';
import { WebCryptoUtils } from './WebCryptoUtils';
import {
  UserKeyPair,
  EncryptedMessage,
  ConversationCryptoState,
  EncryptionStatus,
  CryptoError,
  CryptoManagerConfig,
  KeyExchangeData,
} from './types';

export class CryptoManager {
  private keyManager: KeyManager;
  private messageEncryption: MessageEncryption;
  private doubleRatchet: DoubleRatchet;
  private config: CryptoManagerConfig;
  private conversationStates: Map<string, ConversationCryptoState> = new Map();
  private encryptionStatus: Map<string, EncryptionStatus> = new Map();
  private eventHandlers: Map<string, ((data?: any) => void)[]> = new Map();

  constructor(config: CryptoManagerConfig = {}) {
    this.keyManager = new KeyManager();
    this.messageEncryption = new MessageEncryption();
    this.doubleRatchet = new DoubleRatchet();
    this.config = {
      storageKey: 'chat-app-crypto',
      keyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      maxSequenceNumber: 2147483647,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    if (!WebCryptoUtils.isWebCryptoSupported()) {
      throw new Error('Web Crypto API is not supported in this browser');
    }

    try {
      await this.keyManager.initializeStorage();
      await this.keyManager.generateUserKeys();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', { 
        code: 'INIT_ERROR', 
        message: 'Failed to initialize crypto manager'
      });
      throw error;
    }
  }

  async generateUserKeys(): Promise<UserKeyPair> {
    try {
      const userKeys = await this.keyManager.generateUserKeys();
      this.emit('keysGenerated', userKeys);
      return userKeys;
    } catch (error) {
      const cryptoError: CryptoError = {
        code: 'KEY_GENERATION_ERROR',
        message: 'Failed to generate user keys',
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  async getUserPublicKey(): Promise<string> {
    try {
      const userKeys = await this.keyManager.getUserKeys();
      return await this.keyManager.exportPublicKey(userKeys.publicKey);
    } catch (error) {
      throw new Error('Failed to get user public key');
    }
  }

  async startKeyExchange(conversationId: string): Promise<KeyExchangeData> {
    try {
      this.setEncryptionStatus(conversationId, EncryptionStatus.INITIALIZING);
      
      const publicKey = await this.getUserPublicKey();
      const keyExchangeData: KeyExchangeData = {
        conversationId,
        publicKey,
        sender: 'current-user', // Should be replaced with actual user ID
        timestamp: Date.now(),
      };

      this.emit('keyExchangeStarted', keyExchangeData);
      return keyExchangeData;
    } catch (error) {
      this.setEncryptionStatus(conversationId, EncryptionStatus.ERROR);
      throw error;
    }
  }

  async completeKeyExchange(
    conversationId: string,
    remotePublicKey: string,
    isInitiator: boolean = false
  ): Promise<void> {
    try {
      this.setEncryptionStatus(conversationId, EncryptionStatus.INITIALIZING);
      
      const publicKey = await this.keyManager.importPublicKey(remotePublicKey);
      const sharedSecret = await this.keyManager.deriveSharedSecret(publicKey);
      
      await this.keyManager.storeConversationKey(conversationId, sharedSecret);
      
      const conversationState: ConversationCryptoState = {
        sharedSecret,
        publicKey: remotePublicKey,
        sequenceNumber: 0,
        isInitialized: true,
        lastRotation: Date.now(),
      };
      
      this.conversationStates.set(conversationId, conversationState);
      
      await this.doubleRatchet.initializeRatchet(conversationId, sharedSecret, isInitiator);
      
      this.setEncryptionStatus(conversationId, EncryptionStatus.ACTIVE);
      this.emit('keyExchangeCompleted', { conversationId, isInitiator });
    } catch (error) {
      this.setEncryptionStatus(conversationId, EncryptionStatus.ERROR);
      const cryptoError: CryptoError = {
        code: 'KEY_EXCHANGE_ERROR',
        message: 'Failed to complete key exchange',
        conversationId,
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  async encryptMessage(
    message: string,
    conversationId: string,
    sender: string
  ): Promise<EncryptedMessage> {
    const state = this.conversationStates.get(conversationId);
    if (!state || !state.isInitialized) {
      throw new Error('Conversation not initialized for encryption');
    }

    try {
      if (this.shouldRotateKey(conversationId)) {
        await this.rotateConversationKey(conversationId);
      }

      const encryptedMessage = await this.doubleRatchet.encryptMessage(
        message,
        conversationId,
        sender
      );

      this.emit('messageEncrypted', { conversationId, messageId: encryptedMessage.timestamp });
      return encryptedMessage;
    } catch (error) {
      const cryptoError: CryptoError = {
        code: 'ENCRYPTION_ERROR',
        message: 'Failed to encrypt message',
        conversationId,
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  async decryptMessage(encryptedMessage: EncryptedMessage): Promise<string> {
    const { conversationId } = encryptedMessage;
    const state = this.conversationStates.get(conversationId);
    
    if (!state || !state.isInitialized) {
      throw new Error('Conversation not initialized for decryption');
    }

    try {
      const decryptedMessage = await this.doubleRatchet.decryptMessage(
        encryptedMessage,
        conversationId
      );

      this.emit('messageDecrypted', { conversationId, messageId: encryptedMessage.timestamp });
      return decryptedMessage;
    } catch (error) {
      const cryptoError: CryptoError = {
        code: 'DECRYPTION_ERROR',
        message: 'Failed to decrypt message',
        conversationId,
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  async rotateConversationKey(conversationId: string): Promise<void> {
    const state = this.conversationStates.get(conversationId);
    if (!state || !state.isInitialized) {
      throw new Error('Cannot rotate key - conversation not initialized');
    }

    try {
      await this.doubleRatchet.performKeyRotation(conversationId);
      state.lastRotation = Date.now();
      this.messageEncryption.recordKeyRotation(conversationId);
      
      this.emit('keyRotated', { conversationId });
    } catch (error) {
      const cryptoError: CryptoError = {
        code: 'KEY_ROTATION_ERROR',
        message: 'Failed to rotate conversation key',
        conversationId,
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  private shouldRotateKey(conversationId: string): boolean {
    const state = this.conversationStates.get(conversationId);
    if (!state) return false;

    const timeSinceRotation = Date.now() - state.lastRotation;
    return timeSinceRotation > this.config.keyRotationInterval!;
  }

  getEncryptionStatus(conversationId: string): EncryptionStatus {
    return this.encryptionStatus.get(conversationId) || EncryptionStatus.NOT_INITIALIZED;
  }

  private setEncryptionStatus(conversationId: string, status: EncryptionStatus): void {
    this.encryptionStatus.set(conversationId, status);
    this.emit('statusChanged', { conversationId, status });
  }

  getConversationState(conversationId: string): ConversationCryptoState | null {
    return this.conversationStates.get(conversationId) || null;
  }

  isConversationSecure(conversationId: string): boolean {
    const status = this.getEncryptionStatus(conversationId);
    return status === EncryptionStatus.ACTIVE;
  }

  async clearConversationKeys(conversationId: string): Promise<void> {
    try {
      await this.keyManager.removeConversationKey(conversationId);
      this.conversationStates.delete(conversationId);
      this.encryptionStatus.delete(conversationId);
      this.doubleRatchet.clearConversation(conversationId);
      this.messageEncryption.clearConversationData(conversationId);
      
      this.emit('conversationCleared', { conversationId });
    } catch (error) {
      const cryptoError: CryptoError = {
        code: 'CLEANUP_ERROR',
        message: 'Failed to clear conversation keys',
        conversationId,
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.keyManager.clearAllKeys();
      this.conversationStates.clear();
      this.encryptionStatus.clear();
      
      this.emit('allDataCleared');
    } catch (error) {
      const cryptoError: CryptoError = {
        code: 'CLEAR_ALL_ERROR',
        message: 'Failed to clear all crypto data',
      };
      this.emit('error', cryptoError);
      throw error;
    }
  }

  async exportConversationState(conversationId: string): Promise<string | null> {
    const state = this.conversationStates.get(conversationId);
    if (!state) return null;

    const ratchetState = await this.doubleRatchet.exportRatchetState(conversationId);
    const status = this.getEncryptionStatus(conversationId);

    return JSON.stringify({
      conversationId,
      encryptionStatus: status,
      lastRotation: state.lastRotation,
      sequenceNumber: state.sequenceNumber,
      ratchetState,
      timestamp: Date.now(),
    });
  }

  async performHealthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    conversationCount: number;
  }> {
    const issues: string[] = [];
    
    if (!WebCryptoUtils.isWebCryptoSupported()) {
      issues.push('Web Crypto API not supported');
    }

    if (!this.keyManager.isInitialized()) {
      issues.push('Key manager not initialized');
    }

    const conversationCount = this.conversationStates.size;
    
    for (const [conversationId, state] of this.conversationStates) {
      if (!state.isInitialized) {
        issues.push(`Conversation ${conversationId} not properly initialized`);
      }
      
      if (!this.doubleRatchet.isInitialized(conversationId)) {
        issues.push(`Double ratchet not initialized for conversation ${conversationId}`);
      }
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      conversationCount,
    };
  }

  // Event system for crypto operations
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in crypto event handler:', error);
        }
      });
    }
  }

  destroy(): void {
    this.keyManager.close();
    this.conversationStates.clear();
    this.encryptionStatus.clear();
    this.eventHandlers.clear();
  }
}