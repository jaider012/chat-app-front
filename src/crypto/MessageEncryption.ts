import { WebCryptoUtils } from './WebCryptoUtils';
import { EncryptedData, EncryptedMessage } from './types';

export class MessageEncryption {
  private static readonly MAX_SEQUENCE_NUMBER = 2147483647; // 2^31 - 1
  private static readonly SEQUENCE_WINDOW_SIZE = 1000;
  
  private sequenceNumbers: Map<string, number> = new Map();
  private receivedSequences: Map<string, Set<number>> = new Map();

  async encryptMessage(
    plaintext: string,
    sharedSecret: CryptoKey,
    conversationId: string,
    sender: string
  ): Promise<EncryptedMessage> {
    const sequenceNumber = this.getNextSequenceNumber(conversationId);
    const nonce = WebCryptoUtils.generateNonce();
    
    const encryptedData = await WebCryptoUtils.encrypt(plaintext, sharedSecret, nonce);
    
    return {
      encryptedContent: WebCryptoUtils.arrayBufferToBase64(encryptedData.buffer),
      nonce: WebCryptoUtils.arrayBufferToBase64(nonce.buffer),
      sequenceNumber,
      conversationId,
      timestamp: Date.now(),
      sender,
    };
  }

  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    sharedSecret: CryptoKey
  ): Promise<string> {
    if (!this.verifySequenceNumber(encryptedMessage.sequenceNumber, encryptedMessage.conversationId)) {
      throw new Error('Invalid sequence number - possible replay attack');
    }

    const encryptedData = new Uint8Array(WebCryptoUtils.base64ToArrayBuffer(encryptedMessage.encryptedContent));
    const nonce = new Uint8Array(WebCryptoUtils.base64ToArrayBuffer(encryptedMessage.nonce));
    
    try {
      const decryptedText = await WebCryptoUtils.decrypt(encryptedData, sharedSecret, nonce);
      this.recordSequenceNumber(encryptedMessage.sequenceNumber, encryptedMessage.conversationId);
      return decryptedText;
    } catch (error) {
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }
  }

  async encryptData(
    data: string,
    sharedSecret: CryptoKey,
    sequenceNumber: number
  ): Promise<EncryptedData> {
    const nonce = WebCryptoUtils.generateNonce();
    const encryptedData = await WebCryptoUtils.encrypt(data, sharedSecret, nonce);
    
    return {
      ciphertext: WebCryptoUtils.arrayBufferToBase64(encryptedData.buffer),
      nonce: WebCryptoUtils.arrayBufferToBase64(nonce.buffer),
      sequenceNumber,
    };
  }

  async decryptData(
    encryptedData: EncryptedData,
    sharedSecret: CryptoKey
  ): Promise<string> {
    const ciphertext = new Uint8Array(WebCryptoUtils.base64ToArrayBuffer(encryptedData.ciphertext));
    const nonce = new Uint8Array(WebCryptoUtils.base64ToArrayBuffer(encryptedData.nonce));
    
    return await WebCryptoUtils.decrypt(ciphertext, sharedSecret, nonce);
  }

  async rotateKey(currentKey: CryptoKey): Promise<CryptoKey> {
    const salt = WebCryptoUtils.generateSalt();
    const keyMaterial = await WebCryptoUtils.exportKeyAsBase64(currentKey);
    
    return await WebCryptoUtils.deriveKeyFromPassword(keyMaterial, salt);
  }

  private getNextSequenceNumber(conversationId: string): number {
    const current = this.sequenceNumbers.get(conversationId) || 0;
    const next = current + 1;
    
    if (next > MessageEncryption.MAX_SEQUENCE_NUMBER) {
      this.sequenceNumbers.set(conversationId, 1);
      return 1;
    }
    
    this.sequenceNumbers.set(conversationId, next);
    return next;
  }

  private verifySequenceNumber(sequenceNumber: number, conversationId: string): boolean {
    const received = this.receivedSequences.get(conversationId) || new Set();
    
    if (received.has(sequenceNumber)) {
      return false;
    }
    
    if (received.size >= MessageEncryption.SEQUENCE_WINDOW_SIZE) {
      const sortedNumbers = Array.from(received).sort((a, b) => a - b);
      const toRemove = sortedNumbers.slice(0, sortedNumbers.length - MessageEncryption.SEQUENCE_WINDOW_SIZE + 1);
      toRemove.forEach(num => received.delete(num));
    }
    
    return true;
  }

  private recordSequenceNumber(sequenceNumber: number, conversationId: string): void {
    const received = this.receivedSequences.get(conversationId) || new Set();
    received.add(sequenceNumber);
    this.receivedSequences.set(conversationId, received);
  }

  getCurrentSequenceNumber(conversationId: string): number {
    return this.sequenceNumbers.get(conversationId) || 0;
  }

  resetSequenceNumber(conversationId: string): void {
    this.sequenceNumbers.set(conversationId, 0);
    this.receivedSequences.delete(conversationId);
  }

  clearConversationData(conversationId: string): void {
    this.sequenceNumbers.delete(conversationId);
    this.receivedSequences.delete(conversationId);
  }

  async deriveSubkey(
    masterKey: CryptoKey,
    purpose: string,
    conversationId: string
  ): Promise<CryptoKey> {
    const info = `${purpose}:${conversationId}`;
    const salt = WebCryptoUtils.generateSalt();
    
    return await WebCryptoUtils.deriveKeyFromPassword(info, salt);
  }

  async createAuthenticatedMessage(
    plaintext: string,
    sharedSecret: CryptoKey,
    conversationId: string,
    sender: string
  ): Promise<EncryptedMessage> {
    const timestamp = Date.now();
    const metadata = JSON.stringify({
      conversationId,
      sender,
      timestamp,
    });
    
    const combined = `${metadata}:${plaintext}`;
    return await this.encryptMessage(combined, sharedSecret, conversationId, sender);
  }

  async verifyAuthenticatedMessage(
    encryptedMessage: EncryptedMessage,
    sharedSecret: CryptoKey
  ): Promise<{ message: string; metadata: any }> {
    const decrypted = await this.decryptMessage(encryptedMessage, sharedSecret);
    const separatorIndex = decrypted.indexOf(':');
    
    if (separatorIndex === -1) {
      throw new Error('Invalid message format');
    }
    
    const metadataStr = decrypted.substring(0, separatorIndex);
    const message = decrypted.substring(separatorIndex + 1);
    
    try {
      const metadata = JSON.parse(metadataStr);
      
      if (metadata.conversationId !== encryptedMessage.conversationId) {
        throw new Error('Conversation ID mismatch');
      }
      
      if (metadata.sender !== encryptedMessage.sender) {
        throw new Error('Sender mismatch');
      }
      
      const timeDiff = Math.abs(metadata.timestamp - encryptedMessage.timestamp);
      if (timeDiff > 60000) { // 1 minute tolerance
        throw new Error('Timestamp mismatch - possible replay attack');
      }
      
      return { message, metadata };
    } catch (error) {
      throw new Error('Failed to verify message authenticity');
    }
  }

  shouldRotateKey(conversationId: string, rotationInterval: number = 24 * 60 * 60 * 1000): boolean {
    const lastRotation = this.getLastRotationTime(conversationId);
    return (Date.now() - lastRotation) > rotationInterval;
  }

  private getLastRotationTime(conversationId: string): number {
    const stored = localStorage.getItem(`crypto-rotation-${conversationId}`);
    return stored ? parseInt(stored, 10) : 0;
  }

  recordKeyRotation(conversationId: string): void {
    localStorage.setItem(`crypto-rotation-${conversationId}`, Date.now().toString());
  }

  clearRotationData(conversationId: string): void {
    localStorage.removeItem(`crypto-rotation-${conversationId}`);
  }
}