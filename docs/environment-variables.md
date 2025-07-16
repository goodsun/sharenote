# 環境変数設定ガイド

## 概要

showINプロジェクトでは、ローカル開発とGitHub Actionsの両方で同じ環境変数名を使用します。
環境別（dev/stg/prod）の設定は、変数名にサフィックスを付けることで管理します。

## 命名規則

### 環境別変数
```
VARIABLE_NAME_DEV    # 開発環境用
VARIABLE_NAME_STG    # ステージング環境用  
VARIABLE_NAME_PROD   # 本番環境用
```

### 共通変数
```
CDK_REGION          # 全環境で共通（ap-northeast-1）
ALEXA_VENDOR_ID     # Alexaベンダー（全環境共通）
```

## 必要な環境変数一覧

### 1. AWS関連

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| CDK_ACCOUNT_DEV | 開発環境のAWSアカウントID | .env, GitHub Secrets |
| CDK_ACCOUNT_STG | ステージング環境のAWSアカウントID | .env, GitHub Secrets |
| CDK_ACCOUNT_PROD | 本番環境のAWSアカウントID | .env, GitHub Secrets |
| CDK_REGION | リージョン（ap-northeast-1） | .env |
| AWS_ACCESS_KEY_ID | AWSアクセスキー | GitHub Secrets のみ |
| AWS_SECRET_ACCESS_KEY | AWSシークレットキー | GitHub Secrets のみ |

### 2. Google OAuth関連

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| GOOGLE_CLIENT_ID_DEV | 開発環境のClient ID | .env, GitHub Secrets |
| GOOGLE_CLIENT_ID_STG | ステージング環境のClient ID | .env, GitHub Secrets |
| GOOGLE_CLIENT_ID_PROD | 本番環境のClient ID | .env, GitHub Secrets |

### 3. Alexa Skills関連

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| ALEXA_ACCESS_TOKEN | Alexaアクセストークン | .env, GitHub Secrets |
| ALEXA_REFRESH_TOKEN | Alexaリフレッシュトークン | .env, GitHub Secrets |
| ALEXA_VENDOR_ID | AlexaベンダーID | .env, GitHub Secrets |
| ALEXA_SKILL_ID_DEV | 開発環境のスキルID | .env, GitHub Secrets |
| ALEXA_SKILL_ID_STG | ステージング環境のスキルID | .env, GitHub Secrets |
| ALEXA_SKILL_ID_PROD | 本番環境のスキルID | .env, GitHub Secrets |

### 4. API URL（オプション）

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| API_URL_DEV | 開発環境のAPI URL（CI/CD用） | GitHub Secrets |
| API_URL_STG | ステージング環境のAPI URL（CI/CD用） | GitHub Secrets |
| API_URL_PROD | 本番環境のAPI URL（CI/CD用） | GitHub Secrets |

※通常はCloudFormationから自動取得されますが、GitHub Actionsで事前ビルドする場合に使用

## ローカル開発での設定

### 1. .envファイルの作成

```bash
cp .env.example .env
```

### 2. 必要な値の設定

```bash
# AWS アカウント
CDK_ACCOUNT_DEV=123456789012
CDK_ACCOUNT_STG=123456789012  
CDK_ACCOUNT_PROD=987654321098
CDK_REGION=ap-northeast-1

# Google OAuth
GOOGLE_CLIENT_ID_DEV=your-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID_STG=your-stg-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID_PROD=your-prod-client-id.apps.googleusercontent.com

# Alexa Skills
ALEXA_ACCESS_TOKEN="Atza|..."
ALEXA_REFRESH_TOKEN="Atzr|..."
ALEXA_VENDOR_ID=M1A2B3C4D5E6F7
ALEXA_SKILL_ID_DEV=amzn1.ask.skill.12345678-1234-1234-1234-123456789012
```

## GitHub Actionsでの設定

### 必要なSecrets

リポジトリの Settings > Secrets and variables > Actions で以下を設定：

```
# AWS認証
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# 環境別AWSアカウント
CDK_ACCOUNT_DEV
CDK_ACCOUNT_STG
CDK_ACCOUNT_PROD

# Google OAuth
GOOGLE_CLIENT_ID_DEV
GOOGLE_CLIENT_ID_STG
GOOGLE_CLIENT_ID_PROD

# Alexa Skills
ALEXA_ACCESS_TOKEN
ALEXA_REFRESH_TOKEN
ALEXA_VENDOR_ID
ALEXA_SKILL_ID_DEV
ALEXA_SKILL_ID_STG
ALEXA_SKILL_ID_PROD

# API URL（オプション）
API_URL_DEV
API_URL_STG
API_URL_PROD
```

## スクリプトでの使用方法

### set-env.sh
環境に応じて適切な環境変数を設定：

```bash
source scripts/set-env.sh
# CDK_ENVに基づいて、CDK_ACCOUNT_DEV → CDK_ACCOUNT に設定
```

### build-frontend.js
環境別のGoogle Client IDを使用：

```javascript
const googleClientId = process.env[`GOOGLE_CLIENT_ID_${env.toUpperCase()}`];
```

## トラブルシューティング

### エラー: CDK_ACCOUNTが空
GitHub Secretsに`CDK_ACCOUNT_DEV`が設定されているか確認

### エラー: GOOGLE_CLIENT_IDが見つからない
- .envに`GOOGLE_CLIENT_ID_DEV`が設定されているか確認
- GitHub Secretsに環境別のClient IDが設定されているか確認

### エラー: Alexa Skills APIの認証失敗
- トークンが正しく引用符で囲まれているか確認
- トークンの有効期限を確認