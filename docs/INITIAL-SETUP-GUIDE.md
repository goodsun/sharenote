# 初回セットアップガイド

このガイドは、共有手帳（shareNOTE）を新規環境にゼロから構築する手順を説明します。
ローカル環境と GitHub Actions の両方で動作するように設定します。

## 📋 前提条件

- AWS アカウント
- GitHub リポジトリ
- Google Cloud Console アカウント
- Alexa Developer アカウント
- Node.js 20.x インストール済み
- AWS CLI インストール済み

## 🚀 セットアップ手順

### Step 1: AWS 環境の準備

#### 1.1 AWS 認証情報の設定

```bash
# AWS CLIの設定（ローカル開発用）
aws configure
# Access Key ID、Secret Access Key、リージョン（ap-northeast-1）を入力
```

#### 1.2 CDK ブートストラップ

```bash
# 各環境でCDKを初期化（初回のみ）
# 開発環境
cdk bootstrap aws://498997347996/ap-northeast-1

# ステージング環境（アカウントIDを置き換え）
# cdk bootstrap aws://YOUR_STG_ACCOUNT_ID/ap-northeast-1

# 本番環境（アカウントIDを置き換え）
# cdk bootstrap aws://YOUR_PROD_ACCOUNT_ID/ap-northeast-1
```

### Step 2: Google OAuth 設定（重要：デプロイ前に必須）

#### 2.1 開発環境用 Google Client ID（GOOGLE_CLIENT_ID_DEV）の作成

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新規プロジェクトを作成または既存プロジェクトを選択
3. **API とサービス** → **認証情報** → **認証情報を作成** → **OAuth クライアント ID**
4. アプリケーションの種類：**ウェブアプリケーション**を選択
5. 以下の設定で作成：

   - **名前**: `shareNOTE Dev`
   - **承認済みの JavaScript 生成元**:
     ```
     http://localhost:8080
     ```
   - ⚠️ **注意**: S3 の URL は初回デプロイ後に追加するため、ここでは設定しない

6. 作成後、表示されるクライアント ID をコピー
7. `.env`ファイルの`GOOGLE_CLIENT_ID_DEV`に設定：
   ```bash
   GOOGLE_CLIENT_ID_DEV=940084652550-xxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```

#### 2.2 ステージング・本番環境用の設定（必要に応じて）

##### ステージング環境用（GOOGLE_CLIENT_ID_STG）

- 名前: `shareNOTE Staging`
- 承認済みの JavaScript 生成元は環境構築後に設定

##### 本番環境用（GOOGLE_CLIENT_ID_PROD）

- 名前: `shareNOTE Production`
- 承認済みの JavaScript 生成元：本番ドメイン（HTTPS）

### Step 3: Alexa Skills 設定

#### 3.1 Alexa Developer Console での設定

1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)にアクセス
2. 各環境用のスキルを作成（dev/stg/prod）
3. スキル ID を記録

#### 3.2 ASK CLI 認証

```bash
# ASK CLIのインストール（未インストールの場合）
npm install -g ask-cli

# 認証情報の設定
ask configure
# ブラウザが開き、Amazonアカウントでログイン
# アクセストークン、リフレッシュトークン、ベンダーIDが自動設定される
```

### Step 4: ローカル環境設定（.env ファイル）

#### 4.1 .env ファイルの作成

```bash
# テンプレートをコピー
cp .env.example .env

# .envファイルを編集
vi .env
```

#### 4.2 .env ファイルに実際の値を設定

```bash
# AWS Configuration
CDK_REGION=ap-northeast-1
CDK_ACCOUNT_DEV=498997347996
CDK_ACCOUNT_STG=YOUR_STG_ACCOUNT_ID  # 実際の値に置き換え
CDK_ACCOUNT_PROD=YOUR_PROD_ACCOUNT_ID  # 実際の値に置き換え

# Google OAuth
GOOGLE_CLIENT_ID_DEV=your-dev-client-id  # 実際の値に置き換え
GOOGLE_CLIENT_ID_STG=your-stg-client-id  # 実際の値に置き換え
GOOGLE_CLIENT_ID_PROD=your-prod-client-id  # 実際の値に置き換え

# ドメイン
DOMAIN_DEV=localhost:8080
DOMAIN_STG=showin-stg.your-domain.com  # 実際の値に置き換え
DOMAIN_PROD=showin.your-domain.com  # 実際の値に置き換え

# Alexa Skills（ask configureで取得した値）
ALEXA_ACCESS_TOKEN=your-access-token  # 実際の値に置き換え
ALEXA_REFRESH_TOKEN=your-refresh-token  # 実際の値に置き換え
ALEXA_VENDOR_ID=your-vendor-id  # 実際の値に置き換え

# 各環境のスキルID
ALEXA_SKILL_ID_DEV=your-dev-skill-id  # 実際の値に置き換え
ALEXA_SKILL_ID_STG=your-stg-skill-id  # 実際の値に置き換え
ALEXA_SKILL_ID_PROD=your-prod-skill-id  # 実際の値に置き換え
```

### Step 5: 初回デプロイ（ローカルから）

#### 5.1 デプロイ前の最終確認

```bash
# AWS認証情報の確認
aws sts get-caller-identity
# アカウントIDが正しいことを確認

# 環境変数の確認
grep GOOGLE_CLIENT_ID_DEV .env
# Google Client IDが設定されていることを確認
```

#### 5.2 デプロイ実行

```bash
# 開発環境へのデプロイ
export CDK_ENV=dev
npm install
npm run deploy:dev

# デプロイ成功後、以下が作成される：
# - DynamoDBテーブル (3つ)
# - Lambda関数 (2つ)
# - API Gateway
# - S3バケット
# - CloudFormationスタック
```

#### 5.3 Google OAuth 承認済み URL の追加（デプロイ後必須）

1. デプロイ完了後、S3 の URL を確認:

   ```bash
   aws cloudformation describe-stacks --stack-name showin-dev \
     --query 'Stacks[0].Outputs[?OutputKey==`FrontendUrl`].OutputValue' \
     --output text
   ```

2. Google Cloud Console に戻り、該当の OAuth クライアント ID を編集
3. 「承認済みの JavaScript 生成元」に上記 URL を追加
4. 保存（反映まで数分かかる場合あり）

### Step 6: GitHub Secrets 設定

#### 6.1 GitHub リポジトリの設定

1. GitHub リポジトリの **Settings** → **Secrets and variables** → **Actions**
2. 以下の Secret を追加（.env ファイルの値をコピー）：

```yaml
# AWS認証（GitHub Actions専用）
AWS_ACCESS_KEY_ID: AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# CDK設定（.envからコピー）
CDK_REGION: ap-northeast-1
CDK_ACCOUNT_DEV: 498997347996
CDK_ACCOUNT_STG: YOUR_STG_ACCOUNT_ID
CDK_ACCOUNT_PROD: YOUR_PROD_ACCOUNT_ID

# Google OAuth（.envからコピー）
GOOGLE_CLIENT_ID_DEV: your-dev-client-id
GOOGLE_CLIENT_ID_STG: your-stg-client-id
GOOGLE_CLIENT_ID_PROD: your-prod-client-id

# 暗号化キー（.envからコピー）
ENCRYPTION_KEY_DEV: your-dev-encryption-key
ENCRYPTION_KEY_STG: your-stg-encryption-key
ENCRYPTION_KEY_PROD: your-prod-encryption-key

# Alexa Skills（.envからコピー）
ALEXA_ACCESS_TOKEN: your-access-token
ALEXA_REFRESH_TOKEN: your-refresh-token
ALEXA_VENDOR_ID: your-vendor-id
ALEXA_SKILL_ID_DEV: your-dev-skill-id
ALEXA_SKILL_ID_STG: your-stg-skill-id
ALEXA_SKILL_ID_PROD: your-prod-skill-id

# ドメイン（.envからコピー）
DOMAIN_DEV: localhost:8080
DOMAIN_STG: showin-stg.your-domain.com
DOMAIN_PROD: showin.your-domain.com
```

### Step 7: 動作確認

#### 7.1 ローカルでの確認

```bash
# フロントエンドの動作確認
cd build/frontend
python3 -m http.server 8080
# ブラウザで http://localhost:8080 にアクセス
```

#### 7.2 GitHub Actions での確認

```bash
# developブランチにプッシュ
git checkout develop
git push origin develop

# GitHub ActionsのActionsタブで実行状況を確認
```

## 🔍 トラブルシューティング

### CDK デプロイエラー

- AWS 認証情報を確認: `aws sts get-caller-identity`
- CDK ブートストラップを確認: `cdk bootstrap`

### フロントエンドビルドエラー

- CloudFormation スタックの存在確認: `aws cloudformation list-stacks`
- 環境変数の設定確認: `echo $CDK_ENV`

### GitHub Actions エラー

- Secrets が正しく設定されているか確認
- AWS 認証情報の権限を確認

## 📝 重要な注意点

1. **順序の重要性**

   - 必ずローカルで初回デプロイを完了してから GitHub Actions を設定
   - CloudFormation スタックが存在しないとフロントエンドビルドが失敗する

2. **セキュリティ**

   - `.env`ファイルは絶対に Git にコミットしない
   - AWS 認証情報は GitHub Secrets にのみ保存

3. **環境の分離**
   - 各環境（dev/stg/prod）は異なる AWS アカウントを推奨
   - 本番環境への直接アクセスは制限する

これで、ゼロから環境を構築し、ローカルと GitHub Actions の両方で動作する環境が整います。
