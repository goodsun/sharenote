# GitHub Secrets設定ガイド

## 必要なSecrets一覧

リポジトリの Settings > Secrets and variables > Actions で以下を設定してください。

### 共通設定（全環境で使用）
| Secret名 | 値 | 説明 |
|----------|-----|------|
| AWS_ACCESS_KEY_ID | （AWSアクセスキー） | GitHub Actions用のIAMユーザー |
| AWS_SECRET_ACCESS_KEY | （AWSシークレットキー） | GitHub Actions用のIAMユーザー |
| ALEXA_ACCESS_TOKEN | Atza\|... | .envからコピー |
| ALEXA_REFRESH_TOKEN | Atzr\|... | .envからコピー |
| ALEXA_VENDOR_ID | MWOKI6SCX66WY | .envからコピー |

### 開発環境（dev）
| Secret名 | 値 |
|----------|-----|
| CDK_ACCOUNT_DEV | 498997347996 |
| GOOGLE_CLIENT_ID_DEV | 620513722194-g05hmrshinm4ss4nq2c9r1v5cg01ucbg.apps.googleusercontent.com |
| ALEXA_SKILL_ID_DEV | amzn1.ask.skill.70242476-fc3a-4f80-a34b-6efc6707a2b3 |

### 本番環境（prod）
| Secret名 | 値 |
|----------|-----|
| CDK_ACCOUNT_PROD | 498997347996 |
| GOOGLE_CLIENT_ID_PROD | 1092697207269-ufaab5kas7bpaphu07i9d35h0japchi6.apps.googleusercontent.com |
| ALEXA_SKILL_ID_PROD | amzn1.ask.skill.406c6118-5279-489b-84e7-2d5a8b91b29d |

### ステージング環境（stg）※将来用
| Secret名 | 値 |
|----------|-----|
| CDK_ACCOUNT_STG | （未設定） |
| GOOGLE_CLIENT_ID_STG | （未設定） |
| ALEXA_SKILL_ID_STG | （未設定） |

## 設定手順

1. GitHubリポジトリの「Settings」タブを開く
2. 左メニューの「Secrets and variables」→「Actions」を選択
3. 「New repository secret」をクリック
4. Secret名と値を入力して「Add secret」

## 注意事項

- ALEXA_ACCESS_TOKEN と ALEXA_REFRESH_TOKEN は改行を含む長い文字列です
- 値をコピーする際は、引用符を**含めない**でください
- AWS認証情報は最小権限の原則に従って設定してください

## 動作確認

### 開発環境へのデプロイ
```bash
git push origin develop
```

### 本番環境へのデプロイ
```bash
git push origin main
```

### 手動デプロイ
1. GitHubの「Actions」タブを開く
2. 「Deploy」ワークフローを選択
3. 「Run workflow」をクリック
4. 環境を選択して実行