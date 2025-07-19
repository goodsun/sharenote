# 開発用Alexaスキルのトラブルシューティング

## 問題：「開発手帳を開いて」と言っても「ローンチリクエスト」と表示される

### 確認事項

1. **対話モデルのビルド状態**
   - ✅ ビルド成功（SUCCEEDED）
   - ✅ 呼び出し名: 「開発手帳」

2. **Alexa Developer Consoleでの確認**
   - 「テスト」タブでスキルが「開発」モードで有効になっているか
   - 正しいスキルを選択しているか（shareNOTE_開発手帳）

### 解決手順

1. **Alexa Developer Consoleで確認**
   ```
   1. https://developer.amazon.com/alexa/console/ask にアクセス
   2. 「shareNOTE_開発手帳」スキルを選択
   3. 「テスト」タブを開く
   4. ドロップダウンで「開発」を選択（有効化）
   ```

2. **実機/シミュレーターでのテスト**
   - 正確な発話: 「アレクサ、開発手帳を開いて」
   - 「かいはつてちょう」と正しく発音する

3. **スキルIDの確認**
   ```bash
   # 正しいスキルID
   amzn1.ask.skill.93fb2056-58a2-465e-add2-f8e0abae47df
   ```

4. **Lambda関数の確認**
   ```bash
   # Lambda関数のログを確認
   aws logs tail /aws/lambda/sharenote-dev-handler --follow
   ```

### よくある原因

1. **テストモードが無効**
   - Alexa Developer Consoleで「開発」モードを有効にする必要があります

2. **発音の問題**
   - 「開発手帳」が正しく認識されていない可能性
   - はっきりと「かいはつてちょう」と発音

3. **アカウントの問題**
   - 開発者アカウントとAlexaアプリのアカウントが同じか確認

4. **地域設定**
   - 日本のAlexaアカウントを使用しているか確認

### デバッグ方法

1. **シミュレーターでテスト**
   - Alexa Developer Consoleのテストシミュレーターで入力
   - テキスト入力: 「開発手帳を開いて」

2. **CloudWatch Logsの確認**
   ```bash
   # 最新のログを確認
   aws logs tail /aws/lambda/sharenote-dev-handler --since 10m
   ```

3. **別の呼び出し名を試す**
   対話モデルを更新して、より簡単な呼び出し名に変更することも可能