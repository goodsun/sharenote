# GitHub Actions Tips

## pathsフィルターの活用

特定のファイルやディレクトリが変更された時のみワークフローを実行できます。

### 基本的な使い方

```yaml
on:
  push:
    branches:
      - develop
      - production
    paths:
      - 'alexa-skills/**'  # alexa-skillsディレクトリ以下の変更
      - '.github/workflows/deploy-alexa-skill.yml'  # このワークフロー自体
```

### 便利な使用例

#### 1. フロントエンドのみビルド
```yaml
name: Build Frontend
on:
  push:
    paths:
      - 'public/**'
      - 'src/frontend/**'
      - 'package.json'
```

#### 2. ドキュメント更新時はデプロイしない
```yaml
on:
  push:
    paths-ignore:
      - 'docs/**'
      - '**.md'
      - 'LICENSE'
```

#### 3. 特定の拡張子のみ
```yaml
on:
  push:
    paths:
      - '**.ts'
      - '**.tsx'
      - '**.js'
```

### paths と paths-ignore

- **paths**: 指定したパスが変更された時のみ実行
- **paths-ignore**: 指定したパス以外が変更された時に実行

### 現在のshowINプロジェクトでの活用

1. **Deploy Alexa Skill**
   - `alexa-skills/`以下の変更時のみ実行
   - Alexaスキルに関係ない変更では実行されない

2. **将来的な分離案**
   - フロントエンドビルド専用ワークフロー
   - バックエンドのみのデプロイ
   - ドキュメント自動生成

### 注意点

- pathsフィルターはpushイベントとpull_requestイベントでのみ使用可能
- ワークフロー自体のファイルも含めないと、ワークフローの更新が反映されない
- マージコミットの場合は、マージされた全ての変更が対象

### デバッグ方法

どのファイルが変更されたか確認：
```yaml
- name: Show changed files
  run: |
    echo "Changed files:"
    git diff --name-only ${{ github.event.before }} ${{ github.sha }}
```