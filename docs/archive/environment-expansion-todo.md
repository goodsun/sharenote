# Environment Expansion TODO List

_Ready-to-execute checklist for scaling 共有手帳（shareNOTE） environments_

## 🎯 Phase Planning Overview

```
Current: Dev Only Environment ✅
Next: Add Staging Environment ⏳
Future: Add Production Environment 🎯
```

## 📋 Phase 2: Add Staging Environment

### Prerequisites Checklist

- [ ] Multiple developers confirmed OR
- [ ] Complex features requiring UAT OR
- [ ] Monthly active users > 50 OR
- [ ] Business stakeholder review needed

### Configuration Tasks

- [ ] **Create staging configuration**

  ```bash
  cp .env.dev .env.stg
  # Edit .env.stg with staging-specific values
  export CDK_ENV=stg
  ```

- [ ] **Setup staging secrets**
  - [ ] Add staging AWS credentials to GitHub Secrets
  - [ ] Configure `AWS_ACCOUNT_ID_STG` (if different account)
  - [ ] Setup `CDK_ENV=stg` environment variables

### Infrastructure Deployment

- [ ] **Deploy staging stack**

  ```bash
  export CDK_ENV=stg
  cdk bootstrap --profile staging-profile  # if different account
  cdk deploy sharenote-stg
  ```

- [ ] **Verify infrastructure**
  - [ ] DynamoDB table: `sharenote-stg-memos` created
  - [ ] Lambda function: `sharenote-stg-handler` deployed
  - [ ] CloudWatch logs: `/aws/lambda/sharenote-stg-handler` active
  - [ ] IAM roles and permissions working

### Alexa Integration

- [ ] **Rename existing dev skill for clarity**

  - [ ] Rename current skill to "共有手帳（shareNOTE） Dev"
  - [ ] Update invocation name to "ボイスメモ開発版"
  - [ ] Keep existing endpoint unchanged

- [ ] **Create staging Alexa skill**

  - [ ] New skill in Amazon Developer Console
  - [ ] Name: "共有手帳（shareNOTE） Staging" (internal only)
  - [ ] Invocation name: "ボイスメモ検証版"
  - [ ] Configure staging Lambda endpoint
  - [ ] Enable skill for testing devices only

- [ ] **Test staging Alexa functionality**
  - [ ] Basic voice commands working
  - [ ] Add memo functionality
  - [ ] Read memos functionality
  - [ ] Delete memo functionality
  - [ ] Verify data isolation from dev environment

### CI/CD Integration

- [ ] **Enable staging deployment**

  - [ ] Uncomment staging workflow in `.github/workflows/deploy.yml`
  - [ ] Test `staging` branch auto-deployment
  - [ ] Verify integration tests run successfully

- [ ] **Document staging workflow**
  - [ ] Update deployment guide
  - [ ] Document staging-specific procedures
  - [ ] Create staging testing checklist

### Monitoring & Alerting

- [ ] **Setup staging monitoring**
  - [ ] CloudWatch dashboards for staging
  - [ ] Error rate alerts
  - [ ] Performance monitoring
  - [ ] Cost tracking for staging environment

## 📋 Phase 3: Add Production Environment

### Prerequisites Checklist

- [ ] Alexa Skills Store submission planned OR
- [ ] SLA requirements defined OR
- [ ] Monthly active users > 500 OR
- [ ] Revenue generation planned OR
- [ ] Compliance requirements identified

### Security & Compliance

- [ ] **Security audit**

  - [ ] IAM permissions review
  - [ ] Data encryption verification
  - [ ] Access logging implementation
  - [ ] Vulnerability scanning

- [ ] **Compliance preparation**
  - [ ] Privacy policy finalized
  - [ ] Terms of service reviewed
  - [ ] Data retention policies defined
  - [ ] GDPR compliance (if applicable)

### Production Configuration

- [ ] **Production account setup**

  - [ ] Separate AWS account recommended
  - [ ] Production IAM roles and policies
  - [ ] Cross-account access (if needed)
  - [ ] Production secrets management

- [ ] **Production configuration**
  ```bash
  # Create production environment file
  cp .env.dev .env.prod
  # Configure production-specific settings
  # - Separate AWS account ID
  # - Production region selection
  # - Enhanced security settings
  ```

### Infrastructure & Deployment

- [ ] **Production infrastructure**

  ```bash
  export CDK_ENV=prod
  cdk bootstrap --profile production
  cdk deploy sharenote-prod
  ```

- [ ] **Backup & Recovery**
  - [ ] DynamoDB continuous backups enabled
  - [ ] Point-in-time recovery configured
  - [ ] Cross-region backup strategy
  - [ ] Disaster recovery procedures documented

### Alexa Store Preparation

- [ ] **Store submission assets**

  - [ ] Production skill icons (completed ✅)
  - [ ] Privacy policy URL (completed ✅)
  - [ ] Terms of use URL (completed ✅)
  - [ ] Skill description and keywords
  - [ ] Testing instructions for certification

- [ ] **Production Alexa skill**

  - [ ] Create production skill in Amazon Developer Console
  - [ ] Name: "共有手帳（shareNOTE）" (public name)
  - [ ] Invocation name: "ボイスメモ" (simple/memorable)
  - [ ] Configure production Lambda endpoint
  - [ ] Submit for Alexa Skills Store review
  - [ ] Complete certification process

- [ ] **Multi-skill device management**
  - [ ] Document skill switching commands for development
  - [ ] Test multiple skills on single Echo device
  - [ ] Ensure no conflicts between dev/staging/prod skills

### Monitoring & Operations

- [ ] **Production monitoring**

  - [ ] Comprehensive CloudWatch dashboards
  - [ ] Multi-level alerting (warn/critical)
  - [ ] Performance SLA monitoring
  - [ ] Cost monitoring and optimization

- [ ] **Operational procedures**
  - [ ] Incident response runbook
  - [ ] On-call procedures (if needed)
  - [ ] Change management process
  - [ ] Release procedures documentation

### Performance & Scaling

- [ ] **Performance optimization**

  - [ ] Lambda memory optimization
  - [ ] DynamoDB performance tuning
  - [ ] Cold start mitigation
  - [ ] Response time optimization

- [ ] **Scaling preparation**
  - [ ] DynamoDB auto-scaling configuration
  - [ ] Lambda concurrency limits
  - [ ] Cost optimization strategies
  - [ ] Multi-region consideration

## 🚀 Quick Start Commands

### Staging Environment Setup

```bash
# 1. Environment setup
export CDK_ENV=stg
cp .env.dev .env.stg

# 2. Deploy infrastructure
cdk deploy sharenote-stg

# 3. Test deployment
npm test -- --testNamePattern="smoke"

# 4. Enable CI/CD
git checkout staging
git push origin staging  # Triggers auto-deployment
```

### Production Environment Setup

```bash
# 1. Security review
npm run security:audit

# 2. Environment setup
export CDK_ENV=prod
cp .env.dev .env.prod
# Edit .env.prod with production settings

# 3. Deploy infrastructure
cdk deploy sharenote-prod

# 4. Verify deployment
npm run test:smoke -- --env prod

# 5. Enable monitoring
aws cloudwatch put-dashboard --dashboard-name sharenote-prod
```

## ⚠️ Important Considerations

### Cost Impact

- **Staging**: +$0.05/month (minimal testing usage)
- **Production**: +$0.20/month (includes monitoring/alerting)
- **Total with all environments**: ~$0.28/month

### Alexa Device Testing

- **Current**: Use dev environment on personal Alexa device
- **Staging**: Can use same device (different skill name)
- **Production**: Available to all users after store approval

### Data Isolation

- Each environment has completely separate:
  - DynamoDB tables
  - Lambda functions
  - CloudWatch logs
  - User data (no cross-contamination)

### Rollback Strategy

- Each environment can be independently rolled back
- Production rollback should be tested in staging first
- Emergency procedures documented for each environment

---

## 📞 Support & Documentation

### When You Need Staging

1. Review prerequisites checklist
2. Execute staging tasks in order
3. Test thoroughly before marking complete
4. Update main documentation

### When You Need Production

1. Complete staging environment first
2. Conduct security review
3. Plan Alexa Skills Store submission
4. Execute production checklist systematically

**Remember**: Each environment addition should be driven by actual business needs, not just technical possibility! 🎯
