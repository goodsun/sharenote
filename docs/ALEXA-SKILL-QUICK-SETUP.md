# Alexa Skill クイックセットアップガイド（JSONインポート版）

このガイドでは、既存の`interaction-model.json`を使って素早くAlexaスキルをセットアップする方法を説明します。

## 前提条件
- Lambda関数がデプロイ済み
- Lambda ARN: `arn:aws:lambda:ap-northeast-1:498997347996:function:showin-dev-handler`

## セットアップ手順

### 1. Alexa Developer Consoleでスキル作成
1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)にアクセス
2. 「スキルの作成」をクリック
3. 以下を設定:
   - **スキル名**: 松蔭（showIN）
   - **デフォルト言語**: 日本語
   - **モデル**: カスタム
   - **ホスティング方法**: ユーザー定義のプロビジョニング

### 2. JSONファイルでインタラクションモデルをインポート
1. 左メニュー「ビルド」タブ
2. 「対話モデル」→「JSONエディター」
3. `alexa-skills/interaction-model.json`の内容をコピー＆ペースト
4. 「モデルを保存」をクリック
5. 「モデルをビルド」をクリック（1-2分待機）

### 3. エンドポイント設定
1. 左メニュー「エンドポイント」
2. 「AWS Lambda ARN」を選択
3. デフォルトリージョンにLambda ARNを入力:
   ```
   arn:aws:lambda:ap-northeast-1:498997347996:function:showin-dev-handler
   ```
4. 「エンドポイントを保存」

### 4. スキルIDとVendor IDの取得

#### 4.1 スキルIDの確認
- Alexa Developer ConsoleのURLまたはスキル詳細画面でスキルIDを確認
- 形式: `amzn1.ask.skill.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### 4.2 Vendor IDの確認（将来のCI/CD用）
- 直接アクセス: https://developer.amazon.com/alexa/console/ask/settings
- 「Vendor ID」の値を確認（例: M1234567890）
- ※Alexa Developer Consoleの設定タブからもアクセス可能

#### 4.3 ASK CLIトークンの取得（オプション：CI/CD用）

**方法1: ASK CLIを使う場合**
```bash
# ASK CLIをインストール
npm install -g ask-cli

# 認証設定（ブラウザが開く）
ask configure

# トークンを確認
cat ~/.ask/cli_config
# "accessToken": "Atza|..." と "refreshToken": "Atzr|..." をコピー
```

**方法2: 既存の認証情報から取得**
```bash
# アクセストークン
cat ~/.ask/cli_config | jq -r '.profiles.default.token.access_token'

# リフレッシュトークン  
cat ~/.ask/cli_config | jq -r '.profiles.default.token.refresh_token'
```

#### 4.4 .envファイルに設定
```bash
# 必須
ALEXA_SKILL_ID_DEV=amzn1.ask.skill.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 将来のCI/CD用（今取得しておくと効率的）
ALEXA_VENDOR_ID=M1234567890
ALEXA_ACCESS_TOKEN=Atza|xxxx...  # ASK CLIから取得
ALEXA_REFRESH_TOKEN=Atzr|xxxx... # ASK CLIから取得
```

#### 4.5 Lambda関数にAlexaトリガーを追加
```bash
aws lambda add-permission \
  --function-name showin-dev-handler \
  --statement-id alexa-skill-trigger \
  --action lambda:InvokeFunction \
  --principal alexa-appkit.amazon.com \
  --event-source-token ${ALEXA_SKILL_ID_DEV}
```

### 5. テスト
1. Alexa Developer Consoleの「テスト」タブ
2. テストを「開発中」に有効化
3. テキストまたは音声で以下をテスト:
   ```
   アレクサ、松蔭を開いて
   → "松蔭へようこそ。声でつなぐ、家族の知恵..."
   
   買い物リストをメモして
   → "買い物リストをメモに追加しました"
   
   メモを読んで
   → "メモが1件あります..."
   ```

## トラブルシューティング

### エラー: スキルがリクエストに応答しませんでした
- Lambda関数のトリガー設定を確認
- CloudWatch Logsでエラーを確認

### エラー: 認証エラー
- スキルIDが正しく設定されているか確認
- Lambda関数のトリガーにスキルIDが設定されているか確認

## 補足: interaction-model.jsonの内容
- **呼び出し名**: 松蔭（しょういん）
- **インテント**:
  - AddMemoIntent（メモ追加）
  - ReadMemosIntent（メモ読み上げ）
  - DeleteMemoIntent（メモ削除）
  - DeleteAllMemosIntent（全メモ削除）
  - HelpIntent（ヘルプ）
  - ビルトインインテント（Help, Cancel, Stop, NavigateHome）

これで5分程度でAlexaスキルのセットアップが完了します！