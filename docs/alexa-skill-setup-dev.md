# 開発用Alexaスキルのセットアップ手順

## 前提条件
- AWS CDKで`sharenote-dev`スタックがデプロイ済み
- Alexa Developer Console アカウント
- ASK CLI (オプション)

## 手動セットアップ手順

### 1. Lambda関数のARN確認
```bash
# CDKデプロイ後、Lambda関数のARNを確認
aws lambda get-function --function-name sharenote-dev-handler --query 'Configuration.FunctionArn' --output text
```

### 2. skill-manifest-dev.jsonの更新
`alexa-skills/skill-manifest-dev.json`内の`YOUR_AWS_ACCOUNT_ID`を実際のAWSアカウントIDに置き換えてください。

### 3. Alexa Developer Consoleでの設定

1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)にログイン
2. 「スキルの作成」をクリック
3. 以下の情報を入力：
   - スキル名: `開発手帳`
   - デフォルトの言語: 日本語
   - モデル: カスタム
   - ホスティング方法: ユーザー定義のプロビジョニング

### 4. 対話モデルの設定
1. 「ビルド」タブに移動
2. 「JSONエディター」を選択
3. `interaction-model-dev.json`の内容をコピー＆ペースト
4. 「モデルを保存」→「モデルをビルド」

### 5. エンドポイントの設定
1. 「エンドポイント」を選択
2. 「AWS LambdaのARN」を選択
3. デフォルトのリージョンに、手順1で確認したLambda ARNを入力
4. 「エンドポイントを保存」

### 6. テスト
1. 「テスト」タブに移動
2. 「開発」を有効化
3. テスト入力例：
   - 「アレクサ、開発手帳を開いて」
   - 「牛乳を追加」
   - 「一覧」
   - 「1番を削除」

## ASK CLIを使用した自動セットアップ（オプション）

### ASK CLIのインストール
```bash
npm install -g ask-cli
ask configure
```

### スキルの作成とデプロイ
```bash
# プロジェクトディレクトリに移動
cd /path/to/sharenote/alexa-skills

# スキルを作成
ask new --skill-name "開発手帳" --locale ja-JP

# マニフェストとモデルを更新
cp skill-manifest-dev.json .ask/skill-package/skill.json
cp interaction-model-dev.json .ask/skill-package/interactionModels/custom/ja-JP.json

# デプロイ
ask deploy
```

## 注意事項
- 開発用スキルは「開発手帳」という名前で、呼び出し名は「開発手帳」です
- 本番用スキルと区別するため、異なる呼び出し名を使用しています
- Lambda関数は環境変数`CDK_ENV=dev`でデプロイされたものを使用してください

## トラブルシューティング
- **Lambda関数が見つからない**: CDKスタックが正しくデプロイされているか確認
- **スキルが応答しない**: CloudWatch Logsでエラーを確認
- **呼び出し名が認識されない**: 対話モデルが正しくビルドされているか確認