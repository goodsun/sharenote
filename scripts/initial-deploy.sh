#!/bin/bash

# 初回デプロイ用スクリプト
# 新しい環境やスタックが存在しない場合に使用

set -e

# 環境を取得（デフォルト: dev）
ENV=${CDK_ENV:-dev}

# 環境変数を設定
source scripts/set-env.sh

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
    echo "   Environment:         $ENV"
    echo ""
    echo "⚠️  This could lead to deploying to the wrong AWS account!"
    echo "Please verify your AWS credentials match the intended deployment target."
    exit 1
fi

echo "✅ AWS account verified: $CURRENT_ACCOUNT"
echo "🚀 Starting initial deployment for environment: $ENV"

# 1. TypeScriptをビルド
echo "📦 Building TypeScript..."
npm run build

# 2. Web APIをビルド
echo "🔧 Building Web API..."
npm run build:web-api

# 3. フロントエンドをビルド（プレースホルダーAPI URLを使用）
echo "🎨 Building Frontend with placeholder API URL..."
npm run build:frontend:${ENV}

# 4. CDKをデプロイ
echo "☁️  Deploying CDK stack..."
npx cdk deploy showin-${ENV} --require-approval never

# 5. 実際のAPI URLでフロントエンドを再ビルド
echo "🔄 Rebuilding frontend with actual API URL..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name showin-${ENV} \
  --query 'Stacks[0].Outputs[?OutputKey==`WebApiUrl`].OutputValue' \
  --output text)

if [ -n "$API_URL" ]; then
  export API_URL_${ENV^^}=$API_URL
  npm run build:frontend:${ENV}
  
  # S3にデプロイ
  BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name showin-${ENV} \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text)
  
  aws s3 sync ./build/frontend/ s3://${BUCKET_NAME} --delete
fi

echo "✅ Initial deployment complete!"
echo "🌐 Frontend URL: http://showin-${ENV}-frontend.s3-website-ap-northeast-1.amazonaws.com"