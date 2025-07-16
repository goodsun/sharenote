# ドメイン設定ガイド

## 概要

松蔭（showIN）を独自ドメインで運用するための設定手順です。
実際のドメイン情報は環境変数で管理し、Gitリポジトリには含めません。

## 設定手順

### 1. 環境変数の設定

`.env.prod`ファイルに以下を設定：

```bash
# 本番環境のドメイン
PRODUCTION_DOMAIN=your-actual-domain.com
```

### 2. Google OAuth設定

Google Cloud Consoleで承認済みのJavaScript生成元に追加：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 認証情報 → OAuth 2.0 クライアント IDを選択
3. 「承認済みのJavaScript生成元」に追加：
   - `https://your-actual-domain.com`

### 3. Alexaスキル設定

Alexa Developer Consoleでプライバシーポリシーと利用規約のURLを更新：

1. スキルの設定画面を開く
2. 「プライバシーとコンプライアンス」セクション
3. 各URLを環境変数の値に更新

### 4. CORS設定（必要に応じて）

API Gatewayで独自ドメインからのアクセスを許可：

```typescript
// lib/showin-stack.ts
defaultCorsPreflightOptions: {
  allowOrigins: [
    'http://localhost:8080',
    `https://${process.env.PRODUCTION_DOMAIN}`,
  ],
  // ...
}
```

### 5. CloudFront設定（推奨）

独自ドメインでS3ホスティングを公開する場合：

1. Route 53でドメインを管理
2. ACM（AWS Certificate Manager）でSSL証明書を取得
3. CloudFrontディストリビューションを作成
4. Route 53でAレコードを設定

## セキュリティの注意事項

- **環境変数ファイル（.env.*）は絶対にGitにコミットしない**
- 本番環境の設定は必要最小限の人だけがアクセス可能にする
- CI/CDパイプラインではGitHub Secretsなどを使用する

## トラブルシューティング

### Google認証でエラーが出る場合

- 承認済みのJavaScript生成元の設定を確認
- HTTPSで正しくアクセスしているか確認
- ドメインの末尾にスラッシュがないか確認

### CORSエラーが出る場合

- API GatewayのCORS設定を確認
- CloudFrontのOriginヘッダー転送設定を確認

---

**重要**: このドキュメントの`your-actual-domain.com`は実際のドメインに置き換えてください。ただし、その情報は`.env.prod`などGit管理外のファイルに記載し、公開リポジトリには含めないでください。