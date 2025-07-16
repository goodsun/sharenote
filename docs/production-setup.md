# 本番環境セットアップガイド

## 概要
本番環境（prod）のセットアップ手順を説明します。

## 1. Google OAuth Client IDの作成

### 手順
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「OAuth クライアント ID」
5. アプリケーションの種類：「ウェブアプリケーション」
6. 名前：「showIN Production」
7. 承認済みのJavaScriptオリジン：
   - https://showin.bon-soleil.com
   - http://showin-prod-frontend.s3-website-ap-northeast-1.amazonaws.com（初回デプロイ用）
8. 作成してClient IDをコピー

## 2. 本番用Alexaスキルの作成

### 手順
1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)にアクセス
2. 「スキルの作成」をクリック
3. スキル名：「共有手帳」（本番用）
4. モデル：「カスタム」、ホスティング：「ユーザー定義のプロビジョニング」
5. テンプレート：「スクラッチ」
6. interaction-model.jsonをインポート：
   ```bash
   # alexa-skills/interaction-model.json の内容をコピー
   ```
7. エンドポイントは後で設定

## 3. 環境変数の設定

### .envファイル
```bash
GOOGLE_CLIENT_ID_PROD=YOUR_PROD_CLIENT_ID
ALEXA_SKILL_ID_PROD=amzn1.ask.skill.xxxxx
```

### GitHub Secrets
以下をリポジトリのSecretsに追加：
- `CDK_ACCOUNT_PROD`: 498997347996（または別アカウント）
- `GOOGLE_CLIENT_ID_PROD`: 作成したClient ID
- `ALEXA_SKILL_ID_PROD`: 作成したスキルID

## 4. CDKデプロイ

### 初回デプロイ
```bash
# 環境変数設定
export CDK_ENV=prod
source scripts/set-env.sh

# デプロイ実行
npm run deploy:prod
```

### 確認
```bash
# スタック状態確認
aws cloudformation describe-stacks --stack-name showin-prod

# Lambda関数確認
aws lambda get-function --function-name showin-prod-handler

# S3バケット確認
aws s3 ls | grep showin-prod
```

## 5. Alexaスキル設定の完了

### エンドポイント設定
1. CDKデプロイ完了後、Lambda ARNを確認：
   ```bash
   aws cloudformation describe-stacks \
     --stack-name showin-prod \
     --query 'Stacks[0].Outputs[?OutputKey==`HandlerArn`].OutputValue' \
     --output text
   ```

2. Alexa Developer Consoleでエンドポイント設定：
   - サービスエンドポイントの種類：AWS LambdaのARN
   - デフォルトリージョン：上記で取得したARN

3. Lambdaにトリガー追加：
   ```bash
   aws lambda add-permission \
     --function-name showin-prod-handler \
     --statement-id alexa-skill-prod \
     --action lambda:InvokeFunction \
     --principal alexa-appkit.amazon.com \
     --event-source-token YOUR_SKILL_ID
   ```

## 6. ドメイン設定（オプション）

### CloudFrontディストリビューション
本番ドメイン（https://showin.bon-soleil.com）を使用する場合：

1. CloudFrontディストリビューションを作成
2. S3バケットをオリジンに設定
3. Route 53でドメインを設定

### 手動設定の場合
```bash
# CloudFront作成コマンドは長いので、
# AWSコンソールから作成することを推奨
```

## 7. 動作確認

### Web UI
1. https://showin.bon-soleil.com（設定済みの場合）
2. http://showin-prod-frontend.s3-website-ap-northeast-1.amazonaws.com

### Alexaスキル
1. Alexa Developer Consoleでテスト
2. 実機で「アレクサ、共有手帳を開いて」

## 8. GitHub Actions設定

mainブランチへのマージで自動デプロイ：
```yaml
on:
  push:
    branches:
      - main  # 本番デプロイ
```

## トラブルシューティング

### Google認証エラー
- Client IDが正しく設定されているか確認
- 承認済みのJavaScriptオリジンを確認

### Alexaスキルが応答しない
- Lambdaトリガーが設定されているか確認
- CloudWatch Logsでエラーを確認

### CDKデプロイエラー
- AWS認証情報を確認
- CDK_ACCOUNT_PRODが正しく設定されているか確認