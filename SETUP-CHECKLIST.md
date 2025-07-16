# 松蔭（showIN）セットアップチェックリスト

このチェックリストは、松蔭（showIN）プロジェクトを新規環境でセットアップする際の手順をまとめています。

## 📋 事前準備

### AWS環境
- [ ] AWSアカウントの作成・準備
- [ ] IAMユーザーの作成（AdministratorAccess推奨）
- [ ] AWS CLIのインストール
- [ ] AWS認証情報の設定（`aws configure`）
- [ ] CDKのブートストラップ実行

### 開発環境
- [ ] Node.js 20.x のインストール
- [ ] npm または yarn のインストール
- [ ] AWS CDK CLI のインストール（`npm install -g aws-cdk`）
- [ ] Git のインストール

### Alexa開発環境
- [ ] Amazon開発者アカウントの作成
- [ ] Alexa Developer Console へのアクセス確認

### Google OAuth（Web UI用）
- [ ] Google Cloud Console アカウント
- [ ] OAuth 2.0 クライアントIDの準備

## 🚀 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/showin.git
cd showin
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定

#### 3.1 CDK環境変数（export形式）
```bash
export CDK_ACCOUNT=your-aws-account-id
export CDK_REGION=ap-northeast-1
export CDK_ENV=dev  # dev/stg/prod
```

#### 3.2 アプリケーション環境変数（.env形式）
```bash
# 開発環境用
cp .env.example .env.dev
# 本番環境用（必要に応じて）
cp .env.example .env.prod
```

`.env.dev`を編集:
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_API_ENDPOINT=https://your-api-gateway-url
VITE_ENVIRONMENT=dev
```

### 4. ビルド確認
```bash
# TypeScriptのビルド
npm run build

# Web APIのビルド
npm run build:web-api

# フロントエンドのビルド（開発環境）
npm run build:frontend:dev
```

### 5. CDKデプロイ
```bash
# CDKブートストラップ（初回のみ）
cdk bootstrap aws://${CDK_ACCOUNT}/${CDK_REGION}

# スタック確認
cdk diff

# デプロイ実行
cdk deploy showin-${CDK_ENV}
```

### 6. デプロイ後の設定

#### 6.1 Lambda関数ARNの取得
デプロイ出力から以下をメモ:
- [ ] Lambda関数ARN: `arn:aws:lambda:region:account:function:showin-dev-handler`
- [ ] API Gateway URL
- [ ] S3バケット名

#### 6.2 Alexaスキルの設定
1. [ ] Alexa Developer Console でスキル作成
2. [ ] エンドポイントにLambda ARNを設定
3. [ ] Lambda関数にAlexaトリガーを追加
4. [ ] スキルのテスト実施

#### 6.3 Google OAuth設定の更新
1. [ ] Google Cloud Console で承認済みのJavaScript生成元を追加
   - S3 URL: `http://showin-dev-frontend.s3-website-ap-northeast-1.amazonaws.com`
   - カスタムドメイン（設定する場合）

### 7. 動作確認

#### 7.1 Alexaスキル
- [ ] 「アレクサ、松蔭を開いて」で起動確認
- [ ] メモの追加テスト
- [ ] メモの読み上げテスト
- [ ] メモの削除テスト

#### 7.2 Web UI
- [ ] S3ホスティングURLでアクセス
- [ ] Googleログイン確認
- [ ] メモのCRUD操作確認
- [ ] 音声入力機能の確認

#### 7.3 家族共有機能
- [ ] 招待コード生成
- [ ] 家族への参加
- [ ] メンバー一覧表示
- [ ] 家督譲渡機能

## 🔧 トラブルシューティング

### よくある問題

1. **CDKデプロイエラー**
   - [ ] AWS認証情報の確認
   - [ ] CDK_ACCOUNT/CDK_REGIONの設定確認
   - [ ] CDKブートストラップの実行確認

2. **Alexaスキルが応答しない**
   - [ ] Lambda関数のトリガー設定確認
   - [ ] CloudWatch Logsでエラー確認
   - [ ] スキルのテストモードが「開発中」になっているか確認

3. **Web UIでログインできない**
   - [ ] Google Client IDの設定確認
   - [ ] 承認済みのJavaScript生成元の確認
   - [ ] ブラウザのコンソールでエラー確認

4. **音声入力が機能しない**
   - [ ] HTTPSでアクセスしているか確認
   - [ ] ブラウザの音声入力許可確認

## 📝 追加設定（オプション）

### カスタムドメイン設定
- [ ] Route 53でドメイン取得/設定
- [ ] CloudFrontディストリビューション作成
- [ ] SSL証明書の設定

### 監視・アラート設定
- [ ] CloudWatch アラームの設定
- [ ] X-Rayトレーシングの有効化
- [ ] ログの長期保存設定

### バックアップ設定
- [ ] DynamoDBのポイントインタイムリカバリ有効化
- [ ] S3バケットのバージョニング有効化

## ✅ 最終確認

- [ ] すべての機能が正常に動作している
- [ ] ドキュメントが最新の状態になっている
- [ ] 環境変数が適切に設定されている
- [ ] セキュリティ設定が適切である

---

**完了！** 🎉

松蔭（showIN）のセットアップが完了しました。
問題が発生した場合は、`docs/troubleshooting.md`を参照してください。