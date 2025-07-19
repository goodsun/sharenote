# Alexa Developer Consoleでのマニフェスト設定場所

## マニフェストJSON → Developer Consoleのマッピング

### 1. スキル情報（Publishing Information）
**場所**: 「配布」タブ → 「スキルの詳細」

マニフェストのフィールド | Developer Consoleの設定場所
---|---
`name` | スキル名
`summary` | 一行説明
`description` | 詳細説明
`examplePhrases` | サンプルフレーズ（3つ）
`keywords` | スキルのキーワード
`smallIconUri` | 小アイコン（108x108）
`largeIconUri` | 大アイコン（512x512）
`category` | カテゴリー
`testingInstructions` | テスト手順（認定タブ）

### 2. プライバシー設定（Privacy & Compliance）
**場所**: 「配布」タブ → 「プライバシーとコンプライアンス」

マニフェストのフィールド | Developer Consoleの設定場所
---|---
`allowsPurchases` | スキル内課金を許可
`usesPersonalInfo` | 個人情報を収集
`isChildDirected` | 子供向けスキル
`isExportCompliant` | 輸出規制に準拠
`containsAds` | 広告を含む
`privacyPolicyUrl` | プライバシーポリシーURL
`termsOfUseUrl` | 利用規約URL

### 3. エンドポイント設定（Endpoint）
**場所**: 「ビルド」タブ → 「エンドポイント」

マニフェストのフィールド | Developer Consoleの設定場所
---|---
`apis.custom.endpoint.uri` | デフォルトのリージョン
`apis.custom.regions.*.endpoint.uri` | 各リージョンのエンドポイント

### 4. 配布設定（Distribution）
**場所**: 「配布」タブ → 「利用可能性」

マニフェストのフィールド | Developer Consoleの設定場所
---|---
`isAvailableWorldwide` | すべての国と地域
`distributionCountries` | 特定の国と地域を選択

### 5. 権限（Permissions）
**場所**: 「ビルド」タブ → 「権限」

マニフェストのフィールド | Developer Consoleの設定場所
---|---
`permissions` | 必要な権限をチェック

## マニフェスト全体を確認する方法

### ASK CLIを使用（推奨）
```bash
# 現在のマニフェストを取得
ask smapi get-skill-manifest --skill-id YOUR_SKILL_ID --stage development

# JSON形式で保存
ask smapi get-skill-manifest --skill-id YOUR_SKILL_ID --stage development > current-manifest.json
```

### Developer Consoleで確認
残念ながら、Developer ConsoleにはマニフェストJSON全体を表示・編集する画面はありません。各設定は上記の個別ページで行う必要があります。

## マニフェストを一括更新する方法

### ASK CLIを使用
```bash
# マニフェストを更新
ask smapi update-skill-manifest \
  --skill-id YOUR_SKILL_ID \
  --manifest "$(cat skill-manifest.json | jq -c .manifest)"
```

### SMAPI（Skill Management API）を直接使用
```bash
# REST APIで更新
curl -X PUT \
  https://api.amazonalexa.com/v1/skills/{skillId}/stages/development/manifest \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @skill-manifest.json
```

## ヒント
- Developer Consoleは手動設定向き
- 複雑な更新や自動化にはASK CLIが便利
- マニフェストJSONの一括管理にはSMAPIを使用