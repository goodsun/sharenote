#!/bin/bash
# シンプルで一貫性のあるデプロイスクリプト
# ローカルでもGitHub Actionsでも同じ手順で実行可能

set -e  # エラーで即停止

# 環境変数を設定
source scripts/set-env.sh

# 環境変数チェック
if [ -z "$CDK_ENV" ] || [ -z "$CDK_ACCOUNT" ]; then
    echo "Error: Required environment variables are not set"
    exit 1
fi

# AWS認証情報の安全確認
echo "🔐 Verifying AWS credentials..."
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null)
if [ -z "$CURRENT_ACCOUNT" ]; then
    echo "❌ Error: Unable to retrieve AWS account information. Please check your AWS credentials."
    exit 1
fi

if [ "$CURRENT_ACCOUNT" != "$CDK_ACCOUNT" ]; then
    echo "❌ Error: AWS credential mismatch!"
    echo "   Current AWS account: $CURRENT_ACCOUNT"
    echo "   Target CDK account:  $CDK_ACCOUNT"
    echo "   Environment:         $CDK_ENV"
    echo ""
    echo "⚠️  This could lead to deploying to the wrong AWS account!"
    echo "Please verify your AWS credentials match the intended deployment target."
    exit 1
fi

echo "✅ AWS account verified: $CURRENT_ACCOUNT"
echo "🚀 Starting deployment for environment: $CDK_ENV"

# 1. TypeScriptビルド
echo "📦 Building TypeScript..."
npm run build

# 2. Web APIビルド
echo "🔧 Building Web API..."
npm run build:web-api

# 3. CDKデプロイ（バックエンドとインフラ）
echo "☁️  Deploying CDK stack..."
npx cdk deploy sharenote-${CDK_ENV} --require-approval never

# 4. API URLを取得してフロントエンドをビルド
echo "🎨 Building frontend with actual API URL..."
npm run build:frontend:${CDK_ENV}

# 5. フロントエンドをS3にデプロイ
echo "📤 Deploying frontend to S3..."
npm run deploy:frontend

echo "✅ Deployment complete!"