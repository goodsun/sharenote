import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AWS_REGION, TABLE_NAMES } from '../config/constants';
import { EncryptionUtil } from '../utils/encryption';

export interface User {
  userId: string;
  familyId: string;
  userName: string;
  email?: string;
  icon?: string;      // アバターURL
  lastLogin?: string; // 最終ログイン日時
  createdAt: string;
  updatedAt: string;
}

export class UserService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const client = new DynamoDBClient({ region: AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = TABLE_NAMES.USER;
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: { userId }
      });

      const result = await this.docClient.send(command);
      if (!result.Item) return null;
      
      // 暗号化されたフィールドを復号化
      return EncryptionUtil.decryptFields(result.Item as User, ['userName', 'email']);
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async createUser(user: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const now = new Date().toISOString();
      const newUser: User = {
        ...user,
        createdAt: now,
        updatedAt: now
      };

      // 暗号化が必要なフィールドを暗号化
      const encryptedUser = EncryptionUtil.encryptFields(newUser, ['userName', 'email']);
      
      const command = new PutCommand({
        TableName: this.tableName,
        Item: encryptedUser,
        ConditionExpression: 'attribute_not_exists(userId)' // 重複防止
      });

      await this.docClient.send(command);
      return newUser; // 暗号化前のデータを返す
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'userId' | 'createdAt'>>): Promise<void> {
    try {
      const updateExpression = [];
      const expressionAttributeNames: { [key: string]: string } = {};
      const expressionAttributeValues: { [key: string]: any } = {};

      // 更新可能なフィールドを動的に構築
      if (updates.familyId !== undefined) {
        updateExpression.push('#familyId = :familyId');
        expressionAttributeNames['#familyId'] = 'familyId';
        expressionAttributeValues[':familyId'] = updates.familyId;
      }

      if (updates.userName !== undefined) {
        updateExpression.push('#userName = :userName');
        expressionAttributeNames['#userName'] = 'userName';
        expressionAttributeValues[':userName'] = EncryptionUtil.encrypt(updates.userName);
      }

      if (updates.email !== undefined) {
        updateExpression.push('#email = :email');
        expressionAttributeNames['#email'] = 'email';
        expressionAttributeValues[':email'] = EncryptionUtil.encrypt(updates.email);
      }

      if (updates.icon !== undefined) {
        updateExpression.push('#icon = :icon');
        expressionAttributeNames['#icon'] = 'icon';
        expressionAttributeValues[':icon'] = updates.icon;
      }

      if (updates.lastLogin !== undefined) {
        updateExpression.push('#lastLogin = :lastLogin');
        expressionAttributeNames['#lastLogin'] = 'lastLogin';
        expressionAttributeValues[':lastLogin'] = updates.lastLogin;
      }

      // updatedAtは常に更新
      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      
      // 暗号化バージョンを追加
      updateExpression.push('#encryptionVersion = :encryptionVersion');
      expressionAttributeNames['#encryptionVersion'] = '_encryptionVersion';
      expressionAttributeValues[':encryptionVersion'] = 1;

      if (updateExpression.length === 1) {
        // updatedAtのみの場合は更新しない
        return;
      }

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: { userId },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(userId)' // 存在確認
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserName(userId: string, newName: string): Promise<void> {
    await this.updateUser(userId, { userName: newName });
  }

  async updateUserFamily(userId: string, familyId: string): Promise<void> {
    await this.updateUser(userId, { familyId });
  }

  async updateLoginInfo(userId: string, email: string, icon: string): Promise<void> {
    await this.updateUser(userId, {
      email,
      icon,
      lastLogin: new Date().toISOString()
    });
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { userId }
      });

      await this.docClient.send(command);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ユーザーが存在するか確認
  async userExists(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    return user !== null;
  }

  // ユーザーを取得、存在しない場合は作成
  async getOrCreateUser(userId: string, userName: string, email?: string): Promise<User> {
    const existingUser = await this.getUser(userId);
    if (existingUser) {
      // 既存ユーザーの場合は何も更新せずそのまま返す
      return existingUser;
    }

    // 新規ユーザーは自分自身がfamilyId
    return await this.createUser({
      userId,
      familyId: userId,
      userName,
      email
    });
  }

  // 同じfamilyIdのユーザーを取得
  async getFamilyMembers(familyId: string): Promise<User[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'familyId = :familyId',
        ExpressionAttributeValues: {
          ':familyId': familyId
        }
      });

      const result = await this.docClient.send(command);
      const items = result.Items || [];
      
      // 各アイテムの暗号化されたフィールドを復号化
      return items.map(item => 
        EncryptionUtil.decryptFields(item as User, ['userName', 'email'])
      );
    } catch (error) {
      console.error('Error getting family members:', error);
      throw error;
    }
  }
}