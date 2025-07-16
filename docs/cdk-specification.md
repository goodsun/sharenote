# 松蔭（showIN） - CDK 実装仕様書

_2025-07-13 - Updated to reflect current implementation_

## 🎯 実装方針

### アーキテクチャ戦略

- **アプリケーション**: 独立リポジトリ（`showin`）で開発
- **インフラ**: CDK で完全管理（Web UI + API + Alexa 統合）
- **管理方針**: 完全独立管理（bootstrap のみ共有）
- **デプロイ**: GitHub Actions CI/CD による S3 自動デプロイ

### 既存 CDK 環境活用

- **Bootstrap**: web3cdk の既存 bootstrap 活用（同一 AWS アカウント・リージョン）
- **スタック**: 完全独立管理
- **リポジトリ**: showin 独立リポジトリで管理

## 🏗️ インフラ仕様

### CDK スタック設計

#### showin-stack.ts

```typescript
export interface AlexaVoiceMemoStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
}

export class AlexaVoiceMemoStack extends cdk.Stack {
  public readonly alexaLambda: lambda.Function;
  public readonly webApiLambda: lambda.Function;
  public readonly memoTable: dynamodb.Table;
  public readonly alexaRole: iam.Role;
  public readonly webApiRole: iam.Role;
  public readonly s3Bucket: s3.Bucket;
  public readonly api: apigateway.RestApi;
  public readonly distribution: cloudfront.Distribution;
}
```

### AWS リソース構成

#### 1. DynamoDB テーブル

```yaml
テーブル名: showin-{env}-memos
パーティションキー: userId (String)
ソートキー: memoId (String)
グローバルセカンダリインデックス:
  - timestamp-index (timestamp用)
  - status-index (deleted用)
属性:
  - deletedAt: 論理削除日時（TTL用）
  - deleted: 論理削除フラグ
  - isPermanentDeleted: 完全削除フラグ
```

#### 2. Lambda 関数

##### Alexa Handler Lambda

```yaml
関数名: showin-{env}-handler
ランタイム: Node.js 20.x
メモリ: 256MB
タイムアウト: 30秒
環境変数:
  - MEMO_TABLE_NAME: DynamoDBテーブル名
  - ENVIRONMENT: dev/stg/prod
```

##### Web API Lambda

```yaml
関数名: showin-{env}-web-api
ランタイム: Node.js 20.x
メモリ: 512MB
タイムアウト: 30秒
環境変数:
  - MEMO_TABLE_NAME: DynamoDBテーブル名
  - ENVIRONMENT: dev/stg/prod
  - CORS_ORIGIN: https://showin.example.com
```

#### 3. API Gateway

```yaml
API名: showin-{env}-api
タイプ: REST API
エンドポイント:
  - GET /memos - メモ一覧取得
  - POST /memos - メモ追加
  - PUT /memos/{memoId} - メモ更新
  - DELETE /memos/{memoId} - メモ削除（論理）
  - DELETE /memos - 全メモ削除
  - POST /memos/{memoId}/restore - メモ復元
  - DELETE /memos/{memoId}/permanent - 完全削除
CORS: 有効（Web UIアクセス用）
```

#### 4. S3 バケット（Web UI）

```yaml
バケット名: showin-{env}-web
静的ウェブサイトホスティング: 有効
公開アクセス: CloudFront経由のみ
ファイル構成:
  - index.html
  - styles.css
  - script.js
  - manifest.json
  - アイコンファイル
```

#### 5. CloudFront Distribution

```yaml
ディストリビューション: Web UI配信用
オリジン: S3バケット
カスタムドメイン: showin.example.com（オプション）
SSL証明書: CloudFront デフォルト
キャッシュ動作: 静的コンテンツに最適化
```

#### 6. IAM ロール

##### Alexa Lambda ロール

```yaml
ロール名: showin-{env}-alexa-lambda-role
ポリシー:
  - DynamoDB: Table読み書き権限
  - CloudWatch: ログ出力権限
  - Alexa Skills Kit: 基本権限
```

##### Web API Lambda ロール

```yaml
ロール名: showin-{env}-web-api-lambda-role
ポリシー:
  - DynamoDB: Table読み書き権限（完全削除含む）
  - CloudWatch: ログ出力権限
  - API Gateway: 実行権限
```

## 📊 データ設計

### DynamoDB スキーマ

#### メインテーブル: memos

```json
{
  "userId": "amzn1.ask.account.xxx", // パーティションキー
  "memoId": "memo_20250712_001", // ソートキー
  "text": "牛乳を買う", // メモ内容
  "timestamp": "2025-07-12T10:30:00.000Z", // 作成日時
  "deleted": false, // 論理削除フラグ
  "deletedAt": 1736789400, // 削除日時（Unix timestamp、TTL用）
  "isPermanentDeleted": false, // 完全削除フラグ
  "updatedAt": "2025-07-12T10:30:00.000Z"
}
```

#### インデックス構成

```yaml
GSI1: family-timestamp-index
  - パーティションキー: familyId
  - ソートキー: timestamp
  - 用途: 家族単位で時系列順でのメモ取得

GSI2: family-updatedAt-index
  - パーティションキー: familyId
  - ソートキー: updatedAt
  - 用途: 家族単位で更新順でのメモ取得
```

#### TTL 設定

```yaml
属性名: deletedAt
動作: 削除後10日経過で自動削除
条件: deleted=true && isPermanentDeleted=false
```

## 🔧 Lambda 実装仕様

### Alexa Handler 構成

```typescript
// src/alexa-handler.ts
export interface AlexaRequest {
  version: string;
  session: AlexaSession;
  context: AlexaContext;
  request: AlexaRequestBody;
}

// Alexa Skills Kit ハンドラー
- LaunchRequestHandler: スキル起動
- AddMemoIntentHandler: メモ追加
- ReadMemosIntentHandler: メモ読み上げ
- DeleteMemoIntentHandler: メモ削除
- HelpIntentHandler: ヘルプ
- CancelAndStopIntentHandler: 終了
- ErrorHandler: エラー処理
```

### Web API Handler 構成

```typescript
// src/web-api-handler.ts
import express from "express";
import serverless from "serverless-http";

const app = express();

// REST APIエンドポイント
app.get("/memos", getMemos); // メモ一覧取得
app.post("/memos", createMemo); // メモ追加
app.put("/memos/:memoId", updateMemo); // メモ更新
app.delete("/memos/:memoId", deleteMemo); // 論理削除
app.delete("/memos", deleteAllMemos); // 全削除
app.post("/memos/:memoId/restore", restoreMemo); // 復元
app.delete("/memos/:memoId/permanent", permanentDelete); // 完全削除

export const handler = serverless(app);
```

### 共通サービス層

```typescript
// src/services/memo-service.ts
export class MemoService {
  // 基本操作
  async addMemo(userId: string, text: string): Promise<MemoItem>;
  async getActiveMemos(userId: string): Promise<MemoItem[]>;
  async getAllMemos(
    userId: string,
    includeDeleted: boolean
  ): Promise<MemoItem[]>;
  async updateMemo(
    userId: string,
    memoId: string,
    text: string
  ): Promise<MemoItem>;

  // 削除操作
  async deleteMemo(userId: string, memoId: string): Promise<void>;
  async deleteAllMemos(userId: string): Promise<void>;
  async permanentDeleteMemo(userId: string, memoId: string): Promise<void>;
  async restoreMemo(userId: string, memoId: string): Promise<void>;

  // ユーティリティ
  async getMemoById(userId: string, memoId: string): Promise<MemoItem | null>;
  async cleanupExpiredMemos(): Promise<void>; // 10日経過した削除済みメモの自動削除
}
```

## 🌐 Web UI 仕様

### ファイル構成

```
web/
├── index.html          # メインHTML
├── styles.css          # スタイルシート
├── script.js           # JavaScriptロジック
├── manifest.json       # PWA設定
├── favicon.ico         # ファビコン
└── icons/              # PWAアイコン
    ├── icon-192.png
    └── icon-512.png
```

### UI 機能

```yaml
ハンバーガーメニュー:
  - Add memo: メモ追加モーダル表示
  - Delete all: 全メモ削除（確認付き）
  - Permanent delete: 完全削除モード切り替え
  - Help: ヘルプモーダル表示

タッチジェスチャー:
  - 左スワイプ: メモ削除（論理削除）
  - 右スワイプ: 編集（通常時）/復元（削除済み時）
  - プルトゥリフレッシュ: メモ一覧更新

表示モード:
  - 通常モード: アクティブなメモのみ表示
  - 削除済み表示: 削除済みメモをグレーアウト表示
  - タイムスタンプ表示: 各メモの作成/更新時刻
```

## 🚀 デプロイ仕様

### CDK デプロイ

#### bin/showin.ts

```typescript
#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AlexaVoiceMemoStack } from "../lib/showin-stack";

const app = new cdk.App();

const environment = process.env.CDK_ENV || "dev";
const account = process.env.CDK_ACCOUNT;
const region = process.env.CDK_REGION || "ap-northeast-1";

new AlexaVoiceMemoStack(app, `showin-${environment}`, {
  env: { account, region },
  environment: environment,
  projectName: "showin",
});
```

### GitHub Actions CI/CD

#### .github/workflows/deploy-web.yml

```yaml
name: Deploy Web UI to S3
on:
  push:
    branches: [main]
    paths:
      - "web/**"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
      - name: Deploy to S3
        run: |
          aws s3 sync web/ s3://${{ secrets.S3_BUCKET_NAME }} \
            --delete \
            --exclude ".git/*" \
            --exclude ".gitignore"
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

### 環境変数

```bash
# .env
CDK_ACCOUNT=your-aws-account-id
CDK_REGION=ap-northeast-1
CDK_ENV=dev

# GitHub Secrets
S3_BUCKET_NAME=showin-dev-web
CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXXXXXXXX
```

### デプロイ手順

```bash
# 1. 環境変数設定
export CDK_ACCOUNT=your-aws-account-id
export CDK_REGION=ap-northeast-1
export CDK_ENV=dev

# 2. 依存関係インストール
npm install

# 3. CDK差分確認
cdk diff

# 4. インフラデプロイ
cdk deploy showin-dev

# 5. Web UIデプロイ（GitHub Actions経由）
git push origin main

# 6. 削除（必要時）
cdk destroy showin-dev
```

## 🧪 テスト仕様

### インフラテスト

```typescript
// test/showin-stack.test.ts
describe("AlexaVoiceMemoStack", () => {
  test("DynamoDB table created with TTL configuration");
  test("Both Lambda functions have proper IAM permissions");
  test("API Gateway configured with CORS");
  test("S3 bucket configured for static hosting");
  test("CloudFront distribution points to S3");
});
```

### 統合テスト

```bash
# Lambda関数テスト
npm run test:lambda

# API Gateway統合テスト
npm run test:api

# Web UI E2Eテスト
npm run test:e2e

# Alexa Skills Kit統合テスト
npm run test:alexa
```

## 🔐 セキュリティ仕様

### IAM 最小権限

#### Alexa Lambda 権限

```yaml
DynamoDB権限:
  - dynamodb:GetItem
  - dynamodb:PutItem
  - dynamodb:UpdateItem
  - dynamodb:Query

CloudWatch権限:
  - logs:CreateLogGroup
  - logs:CreateLogStream
  - logs:PutLogEvents
```

#### Web API Lambda 権限

```yaml
DynamoDB権限:
  - dynamodb:GetItem
  - dynamodb:PutItem
  - dynamodb:UpdateItem
  - dynamodb:DeleteItem # 完全削除用
  - dynamodb:Query
  - dynamodb:BatchWriteItem # 一括削除用

CloudWatch権限:
  - logs:CreateLogGroup
  - logs:CreateLogStream
  - logs:PutLogEvents
```

### データ保護

```yaml
DynamoDB:
  - 暗号化: AWS管理キー
  - バックアップ: ポイントインタイムリカバリ有効
  - TTL: 10日後の自動削除設定

Lambda:
  - VPC: パブリックサブネット（Alexa/API Gateway要件）
  - 環境変数: 機密情報なし

S3:
  - バケットポリシー: CloudFrontからのみアクセス許可
  - 暗号化: AES-256
  - バージョニング: 有効

API Gateway:
  - 認証: API Key（オプション）
  - スロットリング: 1000リクエスト/秒
  - CORS: 特定オリジンのみ許可
```

## 📋 運用仕様

### モニタリング

```yaml
CloudWatch Metrics:
  - Lambda実行時間
  - Lambda エラー率
  - API Gateway 4xx/5xx エラー
  - DynamoDB 読み書きユニット
  - DynamoDB スロットリング
  - S3 リクエスト数

CloudWatch Alarms:
  - Lambda エラー率 > 5%
  - API Gateway エラー率 > 10%
  - DynamoDB スロットリング発生
  - 実行時間 > 25秒
```

### ログ管理

```yaml
Lambda Logs:
  - 保持期間: 30日（dev）/ 90日（prod）
  - ログレベル: INFO以上
  - 構造化ログ: JSON形式

API Gateway Logs:
  - アクセスログ: 有効
  - 実行ログ: エラー時のみ

DynamoDB Logs:
  - アクセスログ: CloudTrail
  - パフォーマンス: CloudWatch Insights
```

### バックアップ・災害復旧

```yaml
DynamoDB:
  - ポイントインタイムリカバリ: 35日間
  - オンデマンドバックアップ: 週次
  - 復旧時間目標: 4時間

Lambda:
  - コード: Git管理
  - 設定: CDKコード管理
  - 復旧時間目標: 30分

S3:
  - バージョニング: 有効
  - レプリケーション: 別リージョン（オプション）
  - 復旧時間目標: 1時間
```

## 🎯 パフォーマンス仕様

### レスポンス要件

```yaml
Alexa応答時間:
  - 目標: 3秒以内
  - 最大: 8秒（Alexa制限）

Web API応答時間:
  - 一覧取得: 500ms以内
  - 個別操作: 200ms以内
  - 一括削除: 1秒以内

DynamoDB性能:
  - 読み込み: 10ms以内
  - 書き込み: 20ms以内
  - TTL削除: 48時間以内（AWS仕様）
```

### スケーラビリティ

```yaml
同時実行:
  - Alexa Lambda: 100同時実行まで
  - Web API Lambda: 500同時実行まで
  - DynamoDB: オンデマンドで自動調整

ユーザー数:
  - 想定: 1-100ユーザー
  - 最大: 10,000ユーザーまで対応可能
```

## 💰 コスト仕様

### 想定コスト（月額・100 ユーザー想定）

```yaml
DynamoDB:
  - オンデマンド: ~$1.00
  - ストレージ: ~$0.25
  - TTL削除: 無料

Lambda:
  - Alexa Handler: ~$0.50
  - Web API: ~$1.00
  - リクエスト: ~$0.20

API Gateway:
  - REST API: ~$3.50/million requests

S3 + CloudFront:
  - ストレージ: ~$0.02
  - 転送量: ~$0.50

CloudWatch:
  - ログ: ~$0.50
  - メトリクス: ~$0.30

合計: ~$8.00/月（100ユーザー）
```

### コスト最適化

```yaml
開発環境:
  - DynamoDB: オンデマンド
  - Lambda: 最小メモリ
  - ログ保持: 短期間
  - CloudFront: 開発用設定

本番環境:
  - DynamoDB: 使用量に応じてプロビジョンド検討
  - Lambda: 適切なメモリサイジング
  - ログ: 必要最小限
  - CloudFront: キャッシュ最適化
```

## 📁 ディレクトリ構成

### showin リポジトリ

```
showin/
├── bin/
│   └── showin.ts           # CDKアプリエントリーポイント
├── lib/
│   └── showin-stack.ts     # CDKスタック定義
├── src/
│   ├── alexa-handler.ts              # Alexa Lambda ハンドラー
│   ├── web-api-handler.ts            # Web API Lambda ハンドラー
│   ├── services/
│   │   └── memo-service.ts           # DynamoDB操作
│   └── types/
│       ├── alexa-types.ts            # Alexa型定義
│       └── api-types.ts              # API型定義
├── web/
│   ├── index.html                    # Web UI
│   ├── styles.css
│   ├── script.js
│   └── manifest.json
├── test/
│   ├── alexa-handler.test.ts
│   ├── web-api-handler.test.ts
│   └── showin-stack.test.ts
├── .github/
│   └── workflows/
│       └── deploy-web.yml            # CI/CD設定
├── cdk.json                          # CDK設定
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 開発フロー

### 1. インフラ開発

```bash
# 1. CDKスタック実装（2つのLambda、API Gateway、S3、CloudFront）
# 2. DynamoDB TTL設定
# 3. IAMロール設定
# 4. インフラデプロイ
```

### 2. バックエンド開発

```bash
# 1. 共通MemoService実装
# 2. Alexa Handler実装
# 3. Web API Handler実装（Express.js）
# 4. 論理削除・自動削除機能実装
```

### 3. フロントエンド開発

```bash
# 1. Web UI実装（HTML/CSS/JS）
# 2. タッチジェスチャー実装
# 3. PWA対応
# 4. GitHub Actions CI/CD設定
```

### 4. 統合・テスト

```bash
# 1. エンドツーエンドテスト
# 2. Alexa実機テスト
# 3. パフォーマンス調整
# 4. 本番環境デプロイ
```

---

## ✅ 実装済み機能

1. **インフラ**: 全リソース CDK で管理
2. **2 つの Lambda**: Alexa 用と Web API 用を分離
3. **Web UI**: S3 ホスティング + CloudFront 配信
4. **API Gateway**: REST API with CORS
5. **論理削除**: 10 日後の自動削除機能
6. **タッチ操作**: スワイプジェスチャー対応
7. **CI/CD**: GitHub Actions による自動デプロイ

---

_この仕様書は現在の実装を反映しています - 2025-07-13 更新_
