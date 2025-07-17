#!/bin/bash

# 完全なCDKスタック削除スクリプト
# S3バケットの中身も含めて完全に削除する

set -e

# 環境変数の設定
CDK_ENV=${CDK_ENV:-dev}
STACK_NAME="sharenote-${CDK_ENV}"

echo "🗑️  Starting complete destruction of stack: $STACK_NAME"

# 1. S3バケットを空にする
echo "📦 Emptying S3 buckets..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ ! -z "$BUCKET_NAME" ]; then
  echo "   Emptying bucket: $BUCKET_NAME"
  aws s3 rm s3://$BUCKET_NAME --recursive 2>/dev/null || true
fi

# 2. CloudWatch Logsを削除
echo "📋 Deleting CloudWatch Log Groups..."
aws logs delete-log-group --log-group-name /aws/lambda/${STACK_NAME}-handler 2>/dev/null || true
aws logs delete-log-group --log-group-name /aws/lambda/${STACK_NAME}-web-api 2>/dev/null || true

# 3. CDK destroyを実行
echo "☁️  Destroying CDK stack..."
cdk destroy $STACK_NAME --force

# 4. スタックが削除されるまで待機
echo "⏳ Waiting for stack deletion..."
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME 2>/dev/null || true

# 5. 残っているリソースの確認
REMAINING=$(aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE DELETE_FAILED \
  --query "StackSummaries[?StackName=='$STACK_NAME'].StackName" \
  --output text)

if [ -z "$REMAINING" ]; then
  echo "✅ Stack $STACK_NAME has been completely destroyed!"
else
  echo "⚠️  Stack $STACK_NAME still exists. Manual intervention may be required."
  echo "   Check AWS Console for details."
fi

# 6. ローカルのビルド成果物とキャッシュを削除
echo "🗑️  Cleaning local build artifacts and caches..."
rm -rf cdk.out
rm -rf build/
rm -rf dist/
rm -rf .cache
rm -rf .parcel-cache
rm -rf node_modules/.cache
rm -rf *.tsbuildinfo
rm -f .eslintcache
rm -f .stylelintcache

# TypeScriptコンパイル済みファイルを削除（srcとlibディレクトリのみ）
echo "🧹 Cleaning compiled TypeScript files..."
find src lib -name "*.js" -type f -delete 2>/dev/null || true
find src lib -name "*.d.ts" -type f -delete 2>/dev/null || true

echo "✨ Cleanup complete!"