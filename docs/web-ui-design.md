# Web UI Design Document

## 🎯 目的と要件

### Issue #1 要件

- Alexa で登録したボイスメモをブラウザで確認
- MVP: 一覧表示、スワイプ削除、プルリフレッシュ
- 認証なし（Phase 1）

### 技術要件

- Express.js + API Gateway
- 既存 DynamoDB テーブル活用
- スマホファースト
- ミニマル・モダンデザイン

## 🏗️ アーキテクチャ

### 全体構成

```
[Browser] → [CloudFront] → [S3 (静的ファイル)]
    ↓
[API Gateway] → [Lambda (Express)] → [DynamoDB]
```

### URL 設計

- `https://showin.example.com/` - 静的 HTML（S3）
- `https://showin.example.com/api/memos` - API（API Gateway）
- `https://showin.example.com/api/memos/:id` - API（API Gateway）

## 📊 データモデル

### 既存 DynamoDB テーブル構造

```typescript
interface MemoItem {
  userId: string; // PK
  memoId: string; // SK
  text: string;
  timestamp: string;
  deleted: string; // "true" or "false"
  updatedAt: string;
}
```

### API レスポンス形式

```typescript
// GET /api/memos
interface MemoResponse {
  id: string; // memoId
  content: string; // text
  timestamp: string; // ISO 8601
  userId: string;
  deleted: boolean; // 削除フラグ
}

// DELETE /api/memos/:id
interface DeleteResponse {
  success: boolean;
  action: "logical_delete" | "physical_delete";
}

// PUT /api/memos/:id/restore
interface RestoreResponse {
  success: boolean;
}
```

## 🔐 セキュリティ設計（Phase 1）

### MVP 版

- **認証なし**（誰でもアクセス可能）
- **ハードコードされた userId**で全メモ取得
- **CORS**: すべて許可（`*`）
- **セキュリティは後回し**（まず動くものを）

## 🎨 フロントエンド設計

### 技術スタック

- **フレームワーク**: Vanilla JS（シンプル重視）
- **スタイル**: CSS（フレームワークなし）
- **ビルド**: なし（直接配信）

### UI 要素

1. **ヘッダー**

   - タイトル「松蔭（showIN）」
   - リフレッシュボタン

2. **メモリスト**

   - カード形式
   - タイムスタンプ表示
   - スワイプで削除アクション表示

3. **空状態**
   - 「メモがありません」メッセージ
   - Alexa 使用方法の簡単な説明

### インタラクション

- **プルリフレッシュ**: 下に引っ張って更新
- **左スワイプ**: 削除ボタン表示（通常メモ:赤、削除済み:黒）
- **右スワイプ**: 復元ボタン表示（削除済みメモのみ:緑）
- **削除動作**:
  - 通常メモ → 論理削除（打ち消し線表示）
  - 削除済みメモ → 物理削除（完全に削除）

## 🚀 実装フェーズ

### Phase 1: MVP（完了）

1. ✅ CDK でインフラ構築（API Gateway + Lambda + S3）
2. ✅ Express API 実装（GET/DELETE/PUT）
3. ✅ 静的サイト実装（タイル風デザイン）
4. ✅ GitHub Actions CI/CD
5. ✅ 論理削除・物理削除・復元機能

### Phase 2: 認証追加

- Cognito 統合
- ユーザーごとのメモ管理

### Phase 3: 機能拡張

- メモ編集
- ページネーション
- 検索機能

## ⚠️ 考慮事項

### パフォーマンス

- メモ取得は最新 100 件まで（削除済み含む）
- 削除は論理削除 → 物理削除の 2 段階
- 削除済みメモは通常メモの下に表示

### エラーハンドリング

- API 側：適切な HTTP ステータスコード
- UI 側：ユーザーフレンドリーなメッセージ

### 開発順序

1. **API 実装とテスト**（ローカルで動作確認）
2. **CDK 追加**（インフラ構築）
3. **フロントエンド実装**（ローカルでモック使用）
4. **統合テスト**
5. **デプロイ**

## 📝 質問・決定事項

### 要確認

1. ドメイン名はどうする？（サブドメイン？パス？）
2. 削除は物理削除？論理削除？
3. メモの表示順序は？（新しい順？）
4. 一度に表示する件数は？

### 決定事項

- [x] ドメイン構成 → **API Gateway の直 URL**で OK
- [x] 削除方式 → **論理削除**（deleted: "true"）
- [x] 表示順序 → **新しい順**（timestamp 降順）
- [x] 表示件数 → **最新 100 件**

---

**次のステップ**: 上記の設計をレビューし、決定事項を埋めてから実装開始
