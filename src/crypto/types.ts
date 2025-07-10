export interface UserKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedMessage {
  encryptedContent: string;
  nonce: string;
  sequenceNumber: number;
  conversationId: string;
  timestamp: number;
  sender: string;
}

export interface EncryptedData {
  ciphertext: string;
  nonce: string;
  sequenceNumber: number;
}

export interface ConversationCryptoState {
  sharedSecret: CryptoKey | null;
  publicKey: string | null;
  sequenceNumber: number;
  isInitialized: boolean;
  lastRotation: number;
}

export interface KeyExchangeData {
  conversationId: string;
  publicKey: string;
  sender: string;
  timestamp: number;
}

export enum EncryptionStatus {
  NOT_INITIALIZED = 'not_initialized',
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  ERROR = 'error',
  KEY_EXCHANGE_PENDING = 'key_exchange_pending'
}

export interface CryptoError {
  code: string;
  message: string;
  conversationId?: string;
}

export interface StoredKey {
  keyData: string;
  conversationId: string;
  createdAt: number;
  lastUsed: number;
}

export interface CryptoContextValue {
  isInitialized: boolean;
  userKeys: UserKeyPair | null;
  conversationKeys: Map<string, ConversationCryptoState>;
  encryptionStatus: Map<string, EncryptionStatus>;
  isLoading: boolean;
  error: CryptoError | null;
  
  initializeCrypto(): Promise<void>;
  startKeyExchange(conversationId: string): Promise<KeyExchangeData>;
  completeKeyExchange(conversationId: string, publicKey: string): Promise<void>;
  encryptMessage(message: string, conversationId: string, sender?: string): Promise<EncryptedMessage>;
  decryptMessage(encryptedMessage: EncryptedMessage): Promise<string>;
  getEncryptionStatus(conversationId: string): EncryptionStatus;
  clearConversationKeys(conversationId: string): void;
  isConversationSecure(conversationId: string): boolean;
  getUserPublicKey(): Promise<string>;
  clearAllData(): Promise<void>;
  performHealthCheck(): Promise<{
    isHealthy: boolean;
    issues: string[];
    conversationCount: number;
  }>;
}

export interface CryptoManagerConfig {
  storageKey?: string;
  keyRotationInterval?: number;
  maxSequenceNumber?: number;
}