# 本番用Alexaスキル作成手順

## 1. Alexa Developer Consoleでスキル作成

1. [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)にアクセス
2. 「スキルを作成」をクリック
3. 以下の設定で作成：
   - **スキル名**: 共有手帳
   - **デフォルトの言語**: 日本語（日本）
   - **モデルを選択**: カスタム
   - **ホスティングサービス**: ユーザー定義のプロビジョニング
   - **テンプレート**: スクラッチ

## 2. 対話モデルの設定

### インポート方法
1. 「ビルド」タブを開く
2. 左メニューの「対話モデル」→「JSON エディター」
3. 以下のコマンドで取得したJSONを貼り付け：

```bash
cat alexa-skills/interaction-model.json
```

4. 「モデルを保存」→「モデルをビルド」

## 3. スキルIDの取得と保存

1. スキルIDを確認（スキルの概要ページに表示）
2. .envファイルに追加：
```bash
ALEXA_SKILL_ID_PROD=amzn1.ask.skill.xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

3. GitHub Secretsにも追加：
   - Name: `ALEXA_SKILL_ID_PROD`
   - Value: 取得したスキルID

## 4. エンドポイント設定（CDKデプロイ後）

CDKデプロイ完了後、以下の手順でエンドポイントを設定：

1. Lambda ARNを取得：
```bash
aws cloudformation describe-stacks \
  --stack-name showin-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`HandlerArn`].OutputValue' \
  --output text
```

2. Alexa Developer Consoleで設定：
   - 「ビルド」→「エンドポイント」
   - サービスエンドポイントの種類：AWS LambdaのARN
   - デフォルトリージョン：取得したARN
   - 「エンドポイントを保存」

3. Lambdaにトリガー追加：
```bash
aws lambda add-permission \
  --function-name showin-prod-handler \
  --statement-id alexa-skill-prod \
  --action lambda:InvokeFunction \
  --principal alexa-appkit.amazon.com \
  --event-source-token [SKILL_ID]
```

## 5. 配布設定

1. 「配布」タブを開く
2. 必要な情報を入力：
   - **公開名**: 共有手帳
   - **簡単な説明**: 声で追加できる共有メモアプリ
   - **詳細な説明**: 家族で共有できるメモアプリです。Alexaに話しかけるだけでメモを追加でき、Webからも確認できます。
   - **サンプルフレーズ**:
     - 「アレクサ、共有手帳で牛乳を追加」
     - 「アレクサ、共有手帳で一覧」
     - 「アレクサ、共有手帳で1番を削除」
   - **カテゴリー**: 生産性
   - **プライバシーポリシーURL**: https://showin.bon-soleil.com/privacy-policy.html
   - **利用規約URL**: https://showin.bon-soleil.com/terms-of-use.html

## 6. テスト

1. 「テスト」タブで「開発」を有効化
2. テストシミュレーターで動作確認：
   - 「共有手帳を開いて」
   - 「共有手帳で買い物リストを追加」
   - 「共有手帳で一覧」

## 7. 本番リリース前のチェックリスト

- [ ] 対話モデルが正しくビルドされている
- [ ] エンドポイントが設定されている
- [ ] Lambdaトリガーが追加されている
- [ ] テストシミュレーターで動作確認済み
- [ ] 実機（Echo等）で動作確認済み
- [ ] プライバシーポリシー・利用規約のページが存在する