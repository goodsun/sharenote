# 共有手帳（shareNOTE） - Skills Kit 設定ガイド

_作成日: 2025-07-12_

## 🎯 概要

このガイドでは、デプロイ済みの Lambda 関数を Alexa Skills Kit と連携させる手順を説明します。

## 📋 前提条件

### 完了済み項目 ✅

- AWS Lambda 関数: `showin-dev-handler`
- DynamoDB テーブル: `showin-dev-memos`
- Lambda ARN: 取得済み（CloudFormation アウトプット）
- 全機能テスト完了（Launch, Add, Read, Delete）

### 必要なアカウント

- Amazon Developer アカウント（無料）
- Alexa アプリ（スマートフォン）

## 🚀 設定手順

### ステップ 1: Amazon Developer Console にアクセス

1. [Amazon Developer Console](https://developer.amazon.com/alexa/console/ask) にログイン
2. 「スキルの作成」をクリック

### ステップ 2: スキルの基本情報設定

```yaml
スキル名: ボイスメモ
デフォルトの言語: 日本語 (JP)
スキルモデル: カスタム
ホスティング方法: ユーザー定義のプロビジョニング
```

### ステップ 3: テンプレート選択

- 「Start from Scratch」を選択
- 「Create Skill」をクリック

### ステップ 4: 呼び出し名の設定

1. 左メニューから「呼び出し名」を選択
2. 呼び出し名: `ボイスメモ`
3. 「Save Model」をクリック

### ステップ 5: インテント設定

#### 5.1 AddMemoIntent

1. 「Interaction Model」→「Intents」→「Add Intent」
2. インテント名: `AddMemoIntent`
3. サンプル発話を追加:
   ```
   {memoText} をメモして
   {memoText} をメモに追加
   {memoText} を覚えておいて
   メモ {memoText}
   {memoText} メモ
   ```
4. Intent Slots:
   - Slot Name: `memoText`
   - Slot Type: `AMAZON.SearchQuery`

#### 5.2 ReadMemosIntent

1. 「Add Intent」→ インテント名: `ReadMemosIntent`
2. サンプル発話:
   ```
   メモを読んで
   メモを教えて
   メモを確認
   メモの内容は
   メモ一覧
   ```

#### 5.3 DeleteMemoIntent

1. 「Add Intent」→ インテント名: `DeleteMemoIntent`
2. サンプル発話:
   ```
   {memoNumber} 番目のメモを削除
   {memoNumber} 番のメモを消して
   メモ {memoNumber} を削除
   {memoNumber} 番目を消して
   ```
3. Intent Slots:
   - Slot Name: `memoNumber`
   - Slot Type: `AMAZON.NUMBER`

### ステップ 6: ビルトインインテント確認

以下のインテントが自動的に含まれていることを確認:

- AMAZON.HelpIntent
- AMAZON.CancelIntent
- AMAZON.StopIntent

### ステップ 7: モデルの保存とビルド

1. 「Save Model」をクリック
2. 「Build Model」をクリック
3. ビルド完了まで待機（約 1-2 分）

### ステップ 8: エンドポイント設定

1. 左メニューから「エンドポイント」を選択
2. 「AWS Lambda ARN」を選択
3. デフォルトリージョンに Lambda ARN を入力:
   ```
   arn:aws:lambda:ap-northeast-1:498997347996:function:showin-dev-handler
   ```
4. 「Save Endpoints」をクリック

### ステップ 9: Lambda トリガー設定

**重要**: AWS Lambda コンソールで以下を設定:

1. AWS Lambda コンソールを開く
2. `showin-dev-handler` 関数を選択
3. 「設定」→「トリガー」→「トリガーを追加」
4. トリガーの設定:
   - トリガー: Alexa Skills Kit
   - スキル ID: Amazon Developer Console で確認
5. 「追加」をクリック

### ステップ 10: テスト

#### Developer Console でのテスト

1. 「テスト」タブに移動
2. テストを「開発中」に設定
3. マイクボタンまたはテキスト入力でテスト:

   ```
   アレクサ、ボイスメモを開いて
   → "ボイスメモへようこそ..."

   牛乳を買うをメモして
   → "牛乳を買うをメモに追加しました"

   メモを読んで
   → "メモが1件あります。1番目、牛乳を買う"
   ```

#### Alexa アプリでのテスト

1. スマートフォンの Alexa アプリを開く
2. 「その他」→「スキル・ゲーム」→「開発」
3. 「ボイスメモ」が表示されることを確認
4. 実際に音声でテスト

## 📊 スキル情報（公開用）

### スキルの説明（短い）

```
音声でメモを簡単に管理。追加、確認、削除が可能。
```

### スキルの説明（詳細）

```
ボイスメモは、音声でメモを管理できるシンプルなスキルです。

主な機能：
• メモの追加：「○○をメモして」
• メモの確認：「メモを読んで」
• メモの削除：「1番目のメモを削除」

買い物リスト、ToDo、アイデアなど、思いついたことをすぐにメモできます。
```

### プライバシーポリシー URL

```
https://your-domain.com/privacy-policy
```

### 利用規約 URL

```
https://your-domain.com/terms-of-use
```

## 🔧 トラブルシューティング

### エラー: "The requested skill took too long to respond"

- Lambda タイムアウトを確認（30 秒に設定済み）
- CloudWatch Logs でエラーを確認

### エラー: "There was a problem with the requested skill's response"

- Lambda 関数のレスポンス形式を確認
- Alexa Response JSON の構造を検証

### エラー: "The trigger setting for the Lambda function is invalid"

- Lambda トリガーに Alexa Skills Kit が追加されているか確認
- スキル ID が正しく設定されているか確認

## 🎯 次のステップ

1. **スキルの認定申請**

   - アイコン画像の準備（108x108, 512x512）
   - カテゴリ選択：「生産性」
   - 審査提出

2. **機能拡張案**

   - メモのカテゴリ分け
   - リマインダー機能
   - 複数ユーザー対応

3. **分析とモニタリング**
   - CloudWatch メトリクス設定
   - 利用状況ダッシュボード作成

## 📚 参考リンク

- [Alexa Skills Kit Documentation](https://developer.amazon.com/en-US/docs/alexa/ask-overviews/what-is-the-alexa-skills-kit.html)
- [スキル開発を始める](https://developer.amazon.com/ja-JP/alexa/alexa-skills-kit/start)
- [音声インターフェースのデザインガイド](https://developer.amazon.com/ja-JP/alexa/alexa-skills-kit/design)

---

_このガイドは、Lambda 関数デプロイ完了後の Alexa Skills Kit 設定に特化しています。_
