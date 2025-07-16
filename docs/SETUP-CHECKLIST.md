# セットアップチェックリスト

## 🏁 初回セットアップ - 実施順序

### Phase 1: ローカル環境準備（必須）
- [ ] AWS CLIインストール・設定 (`aws configure`)
- [ ] Node.js 20.x インストール
- [ ] プロジェクトをクローン
- [ ] `npm install`実行

### Phase 2: 外部サービス設定
- [ ] Google Cloud Console でOAuth クライアントID作成（dev/stg/prod）
- [ ] Alexa Developer Console でスキル作成（dev/stg/prod）
- [ ] ASK CLI設定 (`ask configure`)

### Phase 3: 環境変数設定（.env）
- [ ] `.env.example`を`.env`にコピー
- [ ] AWSアカウントID設定（dev/stg/prod）
- [ ] Google Client ID設定（dev/stg/prod）
- [ ] Alexaトークン設定（ask configureの出力から）
- [ ] AlexaスキルID設定（各環境）
- [ ] ドメイン設定（各環境）

### Phase 4: 初回デプロイ（ローカルから）
- [ ] CDKブートストラップ実行
- [ ] `export CDK_ENV=dev`
- [ ] `npm run deploy`実行
- [ ] デプロイ成功確認（CloudFormationコンソール）
- [ ] フロントエンド動作確認

### Phase 5: GitHub設定（CI/CD用）
- [ ] GitHub Secretsに`.env`の値をコピー
- [ ] AWS_ACCESS_KEY_ID設定（GitHub Actions用）
- [ ] AWS_SECRET_ACCESS_KEY設定（GitHub Actions用）
- [ ] 他のすべての環境変数を設定

### Phase 6: CI/CD動作確認
- [ ] developブランチにプッシュ
- [ ] GitHub Actionsの実行確認
- [ ] デプロイ成功確認

## ⚠️ よくある失敗

### ❌ やってはいけないこと
- GitHub Secretsだけ設定してGitHub Actionsを実行（CloudFormationスタックがないため失敗）
- CDKブートストラップを忘れる
- `.env`ファイルをGitにコミット

### ✅ 正しい順序
1. **必ずローカルで初回デプロイを成功させる**
2. **その後でGitHub Secretsを設定**
3. **最後にGitHub Actionsを実行**

## 🔍 確認コマンド

```bash
# AWS認証確認
aws sts get-caller-identity

# CDKスタック確認
cdk list

# CloudFormationスタック確認
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE

# 環境変数確認
echo $CDK_ENV

# .envファイル確認（機密情報に注意）
cat .env | grep -E "ACCOUNT|CLIENT_ID|SKILL_ID"
```