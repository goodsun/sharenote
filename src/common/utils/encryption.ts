import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const KEY_LENGTH = 32;

export class EncryptionUtil {
  private static key: Buffer | null = null;

  private static getKey(): Buffer {
    if (!this.key) {
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY environment variable is not set');
      }
      
      // 環境変数のキーから固定の暗号化キーを生成
      const salt = crypto.createHash('sha256').update('showin-salt').digest();
      this.key = crypto.pbkdf2Sync(encryptionKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
    }
    return this.key;
  }

  static encrypt(text: string | null | undefined): string | null {
    if (!text) return null;

    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();
      
      // IV + Tag + Encrypted Data を結合してBase64エンコード
      const combined = Buffer.concat([iv, tag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  static decrypt(encryptedData: string | null | undefined): string | null {
    if (!encryptedData) return null;

    try {
      const key = this.getKey();
      const combined = Buffer.from(encryptedData, 'base64');
      
      // IV, Tag, Encrypted Data を分離
      const iv = combined.slice(0, IV_LENGTH);
      const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // バッチ処理用のメソッド
  static encryptFields<T extends Record<string, any>>(
    item: T,
    fields: (keyof T)[]
  ): T {
    const encrypted = { ...item };
    for (const field of fields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field] as string) as any;
      }
    }
    // 暗号化バージョンを追加
    (encrypted as any)._encryptionVersion = 1;
    return encrypted;
  }

  static decryptFields<T extends Record<string, any>>(
    item: T,
    fields: (keyof T)[]
  ): T {
    const decrypted = { ...item };
    
    // 暗号化バージョンがない場合はエラー
    if (!(item as any)._encryptionVersion) {
      throw new Error('Data is not encrypted');
    }
    
    for (const field of fields) {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(decrypted[field] as string) as any;
      }
    }
    return decrypted;
  }
}