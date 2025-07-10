import { WebCryptoUtils } from './WebCryptoUtils';
import { UserKeyPair, StoredKey } from './types';

export class KeyManager {
  private static readonly STORAGE_KEY = 'chat-app-crypto-keys';
  private static readonly INDEXEDDB_NAME = 'ChatAppCrypto';
  private static readonly INDEXEDDB_VERSION = 1;
  private static readonly STORE_NAME = 'keys';

  private userKeys: UserKeyPair | null = null;
  private db: IDBDatabase | null = null;

  async initializeStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(KeyManager.INDEXEDDB_NAME, KeyManager.INDEXEDDB_VERSION);
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(KeyManager.STORE_NAME)) {
          const store = db.createObjectStore(KeyManager.STORE_NAME, { keyPath: 'conversationId' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('lastUsed', 'lastUsed', { unique: false });
        }
      };
    });
  }

  async generateUserKeys(): Promise<UserKeyPair> {
    if (!WebCryptoUtils.isWebCryptoSupported()) {
      throw new Error('Web Crypto API is not supported in this browser');
    }

    const keyPair = await WebCryptoUtils.generateKeyPair();
    
    this.userKeys = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };

    return this.userKeys;
  }

  async getUserKeys(): Promise<UserKeyPair> {
    if (!this.userKeys) {
      await this.generateUserKeys();
    }
    return this.userKeys!;
  }

  async exportPublicKey(key?: CryptoKey): Promise<string> {
    const publicKey = key || (await this.getUserKeys()).publicKey;
    return await WebCryptoUtils.exportPublicKey(publicKey);
  }

  async importPublicKey(keyData: string): Promise<CryptoKey> {
    return await WebCryptoUtils.importPublicKey(keyData);
  }

  async deriveSharedSecret(publicKey: CryptoKey): Promise<CryptoKey> {
    const userKeys = await this.getUserKeys();
    return await WebCryptoUtils.deriveSharedSecret(userKeys.privateKey, publicKey);
  }

  async storeConversationKey(conversationId: string, sharedSecret: CryptoKey): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    const keyData = await WebCryptoUtils.exportKeyAsBase64(sharedSecret);
    const storedKey: StoredKey = {
      conversationId,
      keyData,
      createdAt: Date.now(),
      lastUsed: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([KeyManager.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(KeyManager.STORE_NAME);
      
      const request = store.put(storedKey);
      
      request.onerror = () => reject(new Error('Failed to store conversation key'));
      request.onsuccess = () => resolve();
    });
  }

  async getConversationKey(conversationId: string): Promise<CryptoKey | null> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([KeyManager.STORE_NAME], 'readonly');
      const store = transaction.objectStore(KeyManager.STORE_NAME);
      
      const request = store.get(conversationId);
      
      request.onerror = () => reject(new Error('Failed to retrieve conversation key'));
      
      request.onsuccess = async () => {
        const result = request.result as StoredKey;
        if (!result) {
          resolve(null);
          return;
        }

        try {
          const sharedSecret = await WebCryptoUtils.importKeyFromBase64(
            result.keyData,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
          );
          
          await this.updateLastUsed(conversationId);
          resolve(sharedSecret);
        } catch {
          reject(new Error('Failed to import stored key'));
        }
      };
    });
  }

  async removeConversationKey(conversationId: string): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([KeyManager.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(KeyManager.STORE_NAME);
      
      const request = store.delete(conversationId);
      
      request.onerror = () => reject(new Error('Failed to remove conversation key'));
      request.onsuccess = () => resolve();
    });
  }

  async clearAllKeys(): Promise<void> {
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([KeyManager.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(KeyManager.STORE_NAME);
      
      const request = store.clear();
      
      request.onerror = () => reject(new Error('Failed to clear all keys'));
      request.onsuccess = () => {
        this.userKeys = null;
        resolve();
      };
    });
  }

  async rotateConversationKey(conversationId: string): Promise<CryptoKey> {
    const currentKey = await this.getConversationKey(conversationId);
    if (!currentKey) {
      throw new Error('No existing key found for conversation');
    }

    const rotatedKey = await this.deriveRotatedKey(currentKey);
    await this.storeConversationKey(conversationId, rotatedKey);
    
    return rotatedKey;
  }

  private async deriveRotatedKey(currentKey: CryptoKey): Promise<CryptoKey> {
    const salt = WebCryptoUtils.generateSalt();
    const keyMaterial = await WebCryptoUtils.exportKeyAsBase64(currentKey);
    
    return await WebCryptoUtils.deriveKeyFromPassword(keyMaterial, salt);
  }

  private async updateLastUsed(conversationId: string): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([KeyManager.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(KeyManager.STORE_NAME);
    
    const getRequest = store.get(conversationId);
    
    getRequest.onsuccess = () => {
      const storedKey = getRequest.result as StoredKey;
      if (storedKey) {
        storedKey.lastUsed = Date.now();
        store.put(storedKey);
      }
    };
  }

  async cleanupOldKeys(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cutoffTime = Date.now() - maxAge;
    const transaction = this.db.transaction([KeyManager.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(KeyManager.STORE_NAME);
    const index = store.index('lastUsed');
    
    const range = IDBKeyRange.upperBound(cutoffTime);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  isInitialized(): boolean {
    return this.db !== null;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.userKeys = null;
  }
}