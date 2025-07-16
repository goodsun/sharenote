#!/bin/bash
# 環境に応じたCDK_ACCOUNT設定ヘルパー
# 使い方: source scripts/set-env.sh

# .envファイルを読み込み（GitHub Actions環境では不要）
if [ -n "$GITHUB_ACTIONS" ]; then
    echo "Running in GitHub Actions, skipping .env file"
elif [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# CDK_ENVが設定されていない場合はdevをデフォルトに
if [ -z "$CDK_ENV" ]; then
    export CDK_ENV=dev
    echo "CDK_ENV not set, using default: dev"
fi

# CDK_ENVに基づいてCDK_ACCOUNTを設定
# GitHub Actionsでは既にCDK_ACCOUNTが設定されている場合はスキップ
if [ -n "$GITHUB_ACTIONS" ] && [ -n "$CDK_ACCOUNT" ]; then
    echo "Using CDK_ACCOUNT=$CDK_ACCOUNT from GitHub Actions"
else
    case "$CDK_ENV" in
        dev)
            export CDK_ACCOUNT=$CDK_ACCOUNT_DEV
            echo "Setting CDK_ACCOUNT=$CDK_ACCOUNT (dev)"
            ;;
        stg)
            export CDK_ACCOUNT=$CDK_ACCOUNT_STG
            echo "Setting CDK_ACCOUNT=$CDK_ACCOUNT (stg)"
            ;;
        prod)
            export CDK_ACCOUNT=$CDK_ACCOUNT_PROD
            echo "Setting CDK_ACCOUNT=$CDK_ACCOUNT (prod)"
            ;;
        *)
            echo "Error: Unknown environment: $CDK_ENV"
            echo "Valid environments: dev, stg, prod"
            exit 1
            ;;
    esac
fi

echo "Environment variables set for $CDK_ENV environment"