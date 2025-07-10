import { encode, decode } from 'tweetnacl-util';

export class WebCryptoUtils {
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'X25519',
      },
      true,
      ['deriveKey', 'deriveBits']
    );
  }

  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return encode(new Uint8Array(exported));
  }

  static async importPublicKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = decode(keyData);
    return await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: 'ECDH',
        namedCurve: 'X25519',
      },
      true,
      []
    );
  }

  static async deriveSharedSecret(
    privateKey: CryptoKey,
    publicKey: CryptoKey
  ): Promise<CryptoKey> {
    return await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: publicKey,
      },
      privateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(
    data: string,
    key: CryptoKey,
    nonce: Uint8Array
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
      },
      key,
      dataBuffer
    );
    
    return new Uint8Array(encrypted);
  }

  static async decrypt(
    encryptedData: Uint8Array,
    key: CryptoKey,
    nonce: Uint8Array
  ): Promise<string> {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
      },
      key,
      encryptedData
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  static generateNonce(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(12));
  }

  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    return encode(new Uint8Array(buffer));
  }

  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    return decode(base64).buffer;
  }

  static async exportKeyAsBase64(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  static async importKeyFromBase64(
    base64: string,
    algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(base64);
    return await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      algorithm,
      extractable,
      keyUsages
    );
  }

  static async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const passwordKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      passwordKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    return this.arrayBufferToBase64(hashBuffer);
  }

  static isWebCryptoSupported(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }
}