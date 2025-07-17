# ドメイン設定ガイド

## 概要

共有手帳（shareNOTE）を独自ドメインで運用するための設定手順です。
実際のドメイン情報は環境変数で管理し、Git リポジトリには含めません。

## 設定手順

### 1. 環境変数の設定

`.env.prod`ファイルに以下を設定：

```bash
# 本番環境のドメイン
PRODUCTION_DOMAIN=your-actual-domain.com
```

### 2. Google OAuth 設定

Google Cloud Console で承認済みの JavaScript 生成元に追加：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 認証情報 → OAuth 2.0 クライアント ID を選択
3. 「承認済みの JavaScript 生成元」に追加：
   - `https://your-actual-domain.com`

### 3. Alexa スキル設定

Alexa Developer Console でプライバシーポリシーと利用規約の URL を更新：

1. スキルの設定画面を開く
2. 「プライバシーとコンプライアンス」セクション
3. 各 URL を環境変数の値に更新

### 4. CORS 設定（必要に応じて）

API Gateway で独自ドメインからのアクセスを許可：

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

### 5. CloudFront 設定（推奨）

独自ドメインで S3 ホスティングを公開する場合：

1. Route 53 でドメインを管理
2. ACM（AWS Certificate Manager）で SSL 証明書を取得
3. CloudFront ディストリビューションを作成
4. Route 53 で A レコードを設定

## セキュリティの注意事項

- **環境変数ファイル（.env.\*）は絶対に Git にコミットしない**
- 本番環境の設定は必要最小限の人だけがアクセス可能にする
- CI/CD パイプラインでは GitHub Secrets などを使用する

## トラブルシューティング

### Google 認証でエラーが出る場合

- 承認済みの JavaScript 生成元の設定を確認
- HTTPS で正しくアクセスしているか確認
- ドメインの末尾にスラッシュがないか確認

### CORS エラーが出る場合

- API Gateway の CORS 設定を確認
- CloudFront の Origin ヘッダー転送設定を確認

---

**重要**: このドキュメントの`your-actual-domain.com`は実際のドメインに置き換えてください。ただし、その情報は`.env.prod`など Git 管理外のファイルに記載し、公開リポジトリには含めないでください。
