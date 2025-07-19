# スキルマニフェストの更新手順

## 手動更新（Alexa Developer Console）

### 本番スキルの更新

1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)にログイン
2. 「共有手帳（shareNOTE）」スキルを選択
3. 各タブで以下の情報を更新：

#### 「配布」タブ
- **スキル名**: 共有手帳（shareNOTE）
- **一行説明**: 声でつなぐ、家族の知恵。日々の気づきを音声で記録し、家族で共有。
- **詳細説明**: `skill-manifest.json`の`description`フィールドの内容をコピー
- **サンプルフレーズ**:
  - アレクサ、共有手帳を開いて
  - アレクサ、共有手帳で今日の気づきを記録
  - アレクサ、共有手帳で家族の知恵を読んで
- **キーワード**: メモ, 共有手帳, 音声メモ, リマインダー, 買い物リスト, ToDo, タスク管理, メモ帳, 備忘録, 記録

#### 「プライバシーとコンプライアンス」タブ
- **プライバシーポリシーURL**: https://flow-theory-x.github.io/sharenote/privacy-policy
- **利用規約URL**: https://flow-theory-x.github.io/sharenote/terms-of-use
- その他の設定は`skill-manifest.json`の`privacyAndCompliance`セクションに従う

### 開発スキルの更新

1. 「開発手帳」スキルを選択（または新規作成）
2. 同様に`skill-manifest-dev.json`の内容を反映

## ASK CLIを使用した自動更新

### 前提条件
```bash
# ASK CLIがインストールされていることを確認
ask --version

# インストールされていない場合
npm install -g ask-cli
ask configure
```

### 本番スキルの更新
```bash
cd /Users/goodsun/develop/claude/sharenote/alexa-skills

# スキルIDを確認（Alexa Developer Consoleで確認可能）
# または以下のコマンドで一覧表示
ask smapi list-skills-for-vendor

# マニフェストを更新
ask smapi update-skill-manifest \
  --skill-id YOUR_SKILL_ID \
  --manifest "$(cat skill-manifest.json | jq -c .manifest)"

# 対話モデルを更新
ask smapi update-interaction-model \
  --skill-id YOUR_SKILL_ID \
  --locale ja-JP \
  --interaction-model "$(cat interaction-model.json)"
```

### 開発スキルの更新
```bash
# 開発スキルのIDを使用
ask smapi update-skill-manifest \
  --skill-id YOUR_DEV_SKILL_ID \
  --manifest "$(cat skill-manifest-dev.json | jq -c .manifest)"

ask smapi update-interaction-model \
  --skill-id YOUR_DEV_SKILL_ID \
  --locale ja-JP \
  --interaction-model "$(cat interaction-model-dev.json)"
```

## Lambda ARNの更新

マニフェスト内のLambda ARNを更新する必要がある場合：

1. 現在のLambda ARNを確認
```bash
aws lambda get-function --function-name sharenote-dev-handler --query 'Configuration.FunctionArn' --output text
```

2. マニフェストファイルのARNを更新
3. Alexa Developer ConsoleまたはASK CLIで反映

## 更新後の確認

1. Alexa Developer Consoleで「ビルド」→「モデルをビルド」
2. 「テスト」タブでスキルをテスト
3. CloudWatch Logsでエラーがないか確認

## トラブルシューティング

- **ビルドエラー**: 対話モデルのJSON構文を確認
- **エンドポイントエラー**: Lambda ARNが正しいか、権限が設定されているか確認
- **スキルが応答しない**: Lambda関数のログを確認