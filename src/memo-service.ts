import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, BatchWriteCommand, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { MemoItem } from './common/types';
import { createHash } from 'crypto';
import { UserService } from './common/services/user-service';
import { AWS_REGION, TABLE_NAMES, GSI_NAMES, INVITE_CODE_TTL } from './common/config/constants';
import { EncryptionUtil } from './common/utils/encryption';

export class MemoService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  private inviteCodeTableName: string;
  private userService: UserService;

  constructor() {
    const client = new DynamoDBClient({ region: AWS_REGION });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = TABLE_NAMES.MEMO;
    this.inviteCodeTableName = TABLE_NAMES.INVITE_CODE;
    this.userService = new UserService();
  }

  // memoId生成関数
  private generateMemoId(userId: string): string {
    const timestamp = Date.now();
    const hash = createHash('sha256')
      .update(userId)
      .digest('hex')
      .substring(0, 4);
    return `${timestamp}${hash}`;
  }

  // ユーザーのfamilyIdを取得
  private async getFamilyId(userId: string): Promise<string> {
    try {
      const user = await this.userService.getUser(userId);
      if (user) {
        console.log(`User found for ${userId}: familyId=${user.familyId}`);
        return user.familyId;
      }
      
      // ユーザーが存在しない場合はuserIdをfamilyIdとして使用
      console.log(`User not found for ${userId}, using userId as familyId`);
      return userId;
    } catch (error) {
      console.error('Error getting familyId:', error);
      return userId; // エラー時はuserIdをfamilyIdとして使用
    }
  }

  async addMemo(userId: string, text: string, userName: string = 'Alexa'): Promise<MemoItem> {
    if (!text || text.trim().length === 0) {
      throw new Error('Memo text cannot be empty');
    }
    
    if (text.length > 500) {
      throw new Error('Memo text too long');
    }

    // ユーザー情報を取得または作成
    const user = await this.userService.getOrCreateUser(userId, userName);
    const familyId = user.familyId;
    
    const now = new Date().toISOString();
    const memoId = this.generateMemoId(userId);
    
    const memo: MemoItem = {
      userId,
      memoId,
      text: text.trim(),
      timestamp: now,
      deleted: 'false',
      updatedAt: now,
      familyId
    };

    // メモテキストを暗号化して保存
    const encryptedMemo = EncryptionUtil.encryptFields(memo, ['text']);
    
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: encryptedMemo
    }));

    return memo; // 暗号化前のデータを返す
  }

  async getActiveMemos(userId: string): Promise<MemoItem[]> {
    console.log(`🔍 getActiveMemos called for userId: ${userId}`);
    
    const familyId = await this.getFamilyId(userId);
    console.log(`📋 Getting memos for userId: ${userId}, familyId: ${familyId}`);
    
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: GSI_NAMES.FAMILY_UPDATED_AT,
      KeyConditionExpression: 'familyId = :familyId',
      FilterExpression: 'deleted = :deleted',
      ExpressionAttributeValues: {
        ':familyId': familyId,
        ':deleted': 'false'
      },
      ScanIndexForward: false, // Latest first
    });

    console.log(`🔍 Query command:`, JSON.stringify(command, null, 2));
    
    const result = await this.docClient.send(command);
    console.log(`📊 Query result: ${result.Items?.length || 0} items found`);
    console.log(`📝 First few memos:`, JSON.stringify(result.Items?.slice(0, 3), null, 2));
    
    const memos = (result.Items as MemoItem[]) || [];
    
    // 暗号化されたテキストを復号化
    const decryptedMemos = memos.map(memo => 
      EncryptionUtil.decryptFields(memo, ['text'])
    );
    
    console.log(`✅ Returning ${decryptedMemos.length} memos for userId: ${userId}`);
    return decryptedMemos;
  }

  async deleteMemo(userId: string, memoId: string): Promise<void> {
    // まず、familyId内でmemoIdに一致するメモを探す
    const familyId = await this.getFamilyId(userId);
    
    // familyIdでメモを検索
    const scanCommand = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: 'familyId = :familyId AND memoId = :memoId',
      ExpressionAttributeValues: {
        ':familyId': familyId,
        ':memoId': memoId
      }
    });
    
    const result = await this.docClient.send(scanCommand);
    
    if (!result.Items || result.Items.length === 0) {
      console.log(`Memo not found: memoId=${memoId}, familyId=${familyId}`);
      throw new Error('Memo not found');
    }
    
    const memo = result.Items[0];
    
    // メモを削除（論理削除）
    await this.docClient.send(new UpdateCommand({
      TableName: this.tableName,
      Key: { userId: memo.userId, memoId: memo.memoId },
      UpdateExpression: 'SET deleted = :deleted, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':deleted': 'true',
        ':updatedAt': new Date().toISOString()
      }
    }));
  }

  async deleteAllMemos(userId: string): Promise<void> {
    const memos = await this.getActiveMemos(userId);
    
    if (memos.length === 0) {
      return;
    }

    const updatedAt = new Date().toISOString();
    
    // BatchWriteCommandはUpdateRequestをサポートしないため、
    // 個別のUpdateCommandを並列実行する
    const updatePromises = memos.map(memo => 
      this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { userId: memo.userId, memoId: memo.memoId },
        UpdateExpression: 'SET deleted = :deleted, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':deleted': 'true',
          ':updatedAt': updatedAt
        }
      }))
    );

    // 並列実行して全ての更新を待つ
    await Promise.all(updatePromises);
  }

  async joinFamilyByInviteCode(
    userId: string,
    inviteCode: string,
    userName: string = 'Alexa'
  ): Promise<{ success: boolean; familyId?: string }> {
    try {
      console.log(`Join family attempt - userId: ${userId}, inviteCode: ${inviteCode}`);
      
      // 招待コードを検証
      const codeResult = await this.docClient.send(new GetCommand({
        TableName: this.inviteCodeTableName,
        Key: { code: inviteCode.toUpperCase() }
      }));

      console.log('Invite code result:', JSON.stringify(codeResult.Item, null, 2));

      if (!codeResult.Item) {
        console.log('Invite code not found');
        return { success: false };
      }

      const { familyId, ttl } = codeResult.Item;

      // 有効期限チェック
      if (ttl && ttl < Math.floor(Date.now() / 1000)) {
        console.log('Invite code expired');
        return { success: false };
      }

      // ユーザー情報を更新（familyIdを設定）
      const user = await this.userService.getOrCreateUser(userId, userName);
      await this.userService.updateUserFamily(userId, familyId);

      // 既存のメモのfamilyIdを更新（結婚時のメモ移行）
      const oldFamilyId = userId; // 参加前は自分のuserIdがfamilyId
      const scanCommand = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'familyId = :oldFamilyId AND userId = :userId',
        ExpressionAttributeValues: {
          ':oldFamilyId': oldFamilyId,
          ':userId': userId
        }
      });
      
      const memosResult = await this.docClient.send(scanCommand);
      const updatePromises = (memosResult.Items || []).map(item => {
        const updateCmd = new UpdateCommand({
          TableName: this.tableName,
          Key: {
            userId: item.userId,
            memoId: item.memoId
          },
          UpdateExpression: 'SET familyId = :newFamilyId, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':newFamilyId': familyId,
            ':updatedAt': new Date().toISOString()
          }
        });
        return this.docClient.send(updateCmd);
      });
      
      await Promise.all(updatePromises);
      console.log(`Migrated ${updatePromises.length} memos to new family`);

      console.log(`Successfully joined family - userId: ${userId}, familyId: ${familyId}`);
      return { success: true, familyId };
    } catch (error) {
      console.error('Join family error:', error);
      return { success: false };
    }
  }
}