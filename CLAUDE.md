# 共有手帳（shareNOTE） - Claude Development Configuration

_Generated from ideanotes project using スモールスタート原則 - 2025-07-12_

## 🎯 Project Context

### Project Origin

このプロジェクトは**ideanotes**で設計・準備されたプロジェクトです：

- **開発判定スコア**: 79.2/100（開発 GO 判定済み）
- **設計完了度**: 100%（完全仕様書作成済み）
- **技術実現可能性**: 90/100（非常に高い）
- **開発リソース**: 85/100（十分確保）

### ideanotes Philosophy

- **スモールスタート原則**: 50%決まれば開発開始 OK
- **段階的改善**: MVP→ 機能拡張の段階的開発
- **学習重視**: 技術習得と検証を主目的
- **実用性優先**: 完璧より動くものを早く
- **仕様書を軽視しない**: ideanotes の仕様書は実行可能な設計書

## 📋 開発指針

### 最優先事項

1. **仕様書準拠**: `docs/cdk-specification.md`が完全な設計仕様
2. **段階的実装**: Phase 1-4 の順序で実装
3. **MVP 優先**: 基本 3 機能（追加・読み上げ・削除）をまず完成
4. **学習記録**: 開発プロセスも学習材料として記録

### 技術スタック

- **CDK**: TypeScript（AWS CDK v2）
- **Lambda**: Node.js 20.x + TypeScript
- **データベース**: DynamoDB（オンデマンド）
- **ログ**: CloudWatch Logs（構造化ログ）

## 🚀 Implementation Status

### ✅ Completed Phases

- **Phase 1-4**: All core development phases completed
- **Web UI**: Full-featured web interface with voice input
- **Production**: Deployed and operational on GitHub Pages

### 🎯 Current Focus

- **Maintenance**: Bug fixes and performance improvements
- **Feature Requests**: Responding to user feedback
- **Documentation**: Keeping guides up-to-date

## 📚 Key Documentation

### Required Reading (実装前必読)

1. **[docs/cdk-specification.md](docs/cdk-specification.md)** - Complete technical specification
2. **[docs/architecture.md](docs/architecture.md)** - System architecture design
3. **[docs/development-guide.md](docs/development-guide.md)** - Development methodology

### Reference Documentation

- **[docs/setup-guide.md](docs/setup-guide.md)** - Environment setup
- **[docs/testing-guide.md](docs/testing-guide.md)** - Testing strategy
- **[docs/deployment-guide.md](docs/deployment-guide.md)** - Deployment procedures

## 🛠️ Development Environment

### Required Environment Variables

```bash
# AWS Configuration (export方式)
export CDK_ACCOUNT=your-aws-account-id
export CDK_REGION=ap-northeast-1
export CDK_ENV=dev

# Google Client ID Configuration (.env方式)
# 環境別設定ファイル: .env.dev, .env.stg, .env.prod で管理
# 詳細は .env.example を参照
```

### Project Structure

```
sharenote/
├── bin/
│   └── sharenote.ts            # CDK app entry point
├── lib/
│   ├── sharenote-stack.ts      # CDK stack definition
│   └── sharenote-stack.WebApiHandler.ts # Web API Lambda
├── src/
│   ├── handler.ts              # Alexa skill handler
│   ├── services/
│   │   └── memo-service.ts     # DynamoDB operations
│   └── web-api/
│       └── amazon-search.ts    # Amazon product search
├── public/                     # Web UI files
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── amazon-smart-links.js  # Amazon ad display
├── test/
├── docs/                       # Complete documentation
├── cdk.json                    # CDK configuration
└── CLAUDE.md                   # This file
```

### Key Commands

```bash
# Development
npm run build                   # Compile TypeScript
npm run watch                   # Watch mode
npm test                        # Run tests

# Frontend build (environment-specific)
npm run build:frontend:dev      # Build for development
npm run build:frontend:stg      # Build for staging
npm run build:frontend:prod     # Build for production

# CDK operations
cdk diff                        # Show changes
cdk deploy sharenote-dev        # Deploy to dev
cdk destroy sharenote-dev       # Clean up
```

## 🎯 Success Metrics

### Technical Metrics

- [x] CDK deployment successful
- [x] All 3 core functions implemented
- [x] Response time < 3 seconds
- [x] Error rate < 5%
- [x] Test coverage > 80%

### Learning Metrics

- [x] Alexa Skills Kit understanding
- [x] CDK infrastructure patterns learned
- [x] DynamoDB design patterns applied
- [x] Serverless architecture implemented

### Business Metrics

- [x] Voice memo add/read/delete works
- [x] Error handling graceful
- [x] User experience smooth
- [x] Cost < $1/month

## ⚠️ Important Notes

### 🔍 デプロイ前の必須確認

**CRITICAL**: デプロイ前には必ず`docs/deployment-checklist.md`を確認すること。

- ローカルテストを実施したか？
- 環境変数/シークレットは設定済みか？
- エラーハンドリングは考慮されているか？
- 非同期処理の完了待ちは実装されているか？

### Start Simple Philosophy

- **Don't over-engineer**: Start with minimal working implementation
- **Hard-code first**: Use static responses to test flow
- **Add complexity gradually**: MVP → features → polish
- **Deploy frequently**: Catch issues early

### Common Pitfalls to Avoid

- **Perfect first iteration**: 50%决まれば开始 OK
- **Complex error handling**: Start basic, improve iteratively
- **Premature optimization**: Working > fast initially
- **Scope creep**: Focus on core 3 functions first

### 🚨 デプロイの鉄則：GitHub Actionsと同じビルドプロセスを厳守

**超重要**: ローカルでのデプロイは必ずGitHub Actionsと同じ手順で実行すること：

1. **正しいデプロイ手順（deploy-simple.shを使用）**:
   ```bash
   ./scripts/deploy-simple.sh  # これが唯一の正解
   ```
   
2. **間違ったデプロイ手順（使用禁止）**:
   ```bash
   # ❌ 以下は絶対に使わない
   npm run build && cdk deploy  # Web APIビルドが含まれていない！
   ```

3. **GitHub Actionsと同じビルドステップ**:
   - `npm run build` - TypeScriptをビルド
   - `npm run build:web-api` - **Web APIハンドラーをビルド（重要！）**
   - `cdk deploy sharenote-dev` - CDKでデプロイ
   - `npm run build:frontend:dev` - フロントエンドをビルド
   - `npm run deploy:frontend` - S3にデプロイ

4. **禁止事項**:
   - zipファイルを作成してLambdaを手動更新しない
   - aws lambda update-functionコマンドを使わない
   - CDK以外の方法でインフラを変更しない
   - **`npm run build`だけでCDKデプロイしない（Web APIが古いまま！）**

**デプロイ前チェック**:
```bash
# 必ずこれを使う
./scripts/deploy-simple.sh
```

### CDK Best Practices

- **Environment isolation**: Use CDK_ENV for dev/stg/prod
- **Minimal IAM permissions**: Only what's needed
- **Proper resource naming**: Include environment in names
- **Infrastructure as code**: Everything via CDK

## 🔧 Troubleshooting

### Common Issues

1. **CDK bootstrap not found**: Run `cdk bootstrap` in target account/region
2. **Permission denied**: Check AWS credentials and IAM permissions
3. **Lambda timeout**: Start with 30s timeout for development
4. **DynamoDB access**: Ensure Lambda has proper IAM role

### Debug Strategy

1. **CloudWatch Logs**: Check Lambda execution logs
2. **CDK diff**: Understand what will be deployed
3. **Unit tests**: Test components in isolation
4. **Console.log**: Liberal logging for debugging

## 📞 Support Resources

### Documentation References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Alexa Skills Kit SDK](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs)
- [DynamoDB Documentation](https://docs.aws.amazon.com/amazondynamodb/)

### Original Project Context

- **ideanotes repository**: Source of methodology and specifications
- **Development logs**: ideanotes/columns/daily-learning/
- **Design process**: ideanotes/services/sharenote/

---

## 🚀 Ready to Start!

1. **First action**: Read `docs/cdk-specification.md` completely
2. **Environment setup**: Configure AWS credentials and CDK\_\* variables
3. **CDK initialization**: `cdk init app --language typescript`
4. **Implementation start**: Follow Phase 1 in development-guide.md

**Remember**: This project embodies ideanotes **スモールスタート原則** - start simple, improve iteratively, focus on learning and working solutions over perfection.

Good luck! 🎯
