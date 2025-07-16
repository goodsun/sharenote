# Alexa Voice Memo - System Architecture

*Generated from ideanotes project - 2025-07-12*

## 🏗️ Overview

```
[User Voice] → [Alexa Device] → [Alexa Skills Kit] → [API Gateway] → [Lambda] → [DynamoDB]
                                                                         ↓
                                                               [CloudWatch Logs]
```

## 📊 Component Design

### 1. Alexa Skills Kit Interface
```yaml
Interaction Model:
  - Invocation Name: "ボイスメモ"
  - Intents: AddMemo, ReadMemos, DeleteMemo
  - Slots: memoText, memoNumber
  - Built-in Intents: Help, Stop, Cancel
```

### 2. AWS Lambda Function
```yaml
Configuration:
  Runtime: Node.js 20.x
  Memory: 256MB
  Timeout: 30秒
  Architecture: x86_64

Environment Variables:
  MEMO_TABLE_NAME: DynamoDBテーブル名
  ENVIRONMENT: dev/stg/prod
  LOG_LEVEL: INFO

IAM Role:
  DynamoDB: 読み書き権限
  CloudWatch: ログ出力権限
```

### 3. DynamoDB Table
```yaml
Table Design:
  Name: showin-{env}-memos
  Partition Key: userId (String)
  Sort Key: memoId (String)
  
Global Secondary Indexes:
  family-timestamp-index:
    Partition Key: familyId
    Sort Key: timestamp
    
  family-updatedAt-index:
    Partition Key: familyId  
    Sort Key: updatedAt
```

## 🔄 Data Flow

### Add Memo Flow
```
1. User: "メモに牛乳を買うを追加"
2. Alexa Skills Kit → Lambda invocation
3. Lambda → Extract slot value (memoText)
4. Lambda → Generate memoId
5. Lambda → DynamoDB PutItem
6. Lambda → Response "牛乳を買うをメモに追加しました"
7. Alexa → Audio response to user
```

### Read Memos Flow
```
1. User: "メモを読んで"
2. Alexa Skills Kit → Lambda invocation
3. Lambda → DynamoDB Query (active memos)
4. Lambda → Format memo list
5. Lambda → Response with numbered list
6. Alexa → Audio response "メモが2件あります。1番目、..."
```

### Delete Memo Flow
```
1. User: "1番目のメモを削除"
2. Alexa Skills Kit → Lambda invocation
3. Lambda → Extract slot value (memoNumber)
4. Lambda → DynamoDB Query (get active memos)
5. Lambda → DynamoDB UpdateItem (logical delete)
6. Lambda → Response "1番目のメモを削除しました"
7. Alexa → Audio response to user
```

## 🔧 Technical Architecture

### CDK Stack Structure
```typescript
AlexaVoiceMemoStack
├── DynamoDB Tables
│   ├── Main Table (memos)
│   │   ├── GSI: family-timestamp-index
│   │   └── GSI: family-updatedAt-index
│   ├── Users Table
│   └── InviteCodes Table
├── Lambda Functions
│   ├── Alexa Handler
│   │   ├── Handler Code
│   │   ├── Environment Variables
│   │   └── IAM Role
│   └── Web API Handler
│       ├── Handler Code
│       ├── CORS Configuration
│       └── IAM Role
└── CloudWatch Log Groups
```

### Lambda Handler Architecture
```typescript
src/
├── common/
│   ├── config/
│   │   └── constants.ts    // Configuration constants (GSI names, etc.)
│   ├── services/
│   │   └── user-service.ts // User management (consolidated)
│   └── types/
│       └── index.ts        // Common type definitions
├── handler.ts              // Main Alexa request handler
├── memo-service.ts         // DynamoDB memo operations
└── types.ts                // Alexa-specific types

lib/
├── showin-stack.ts              // CDK stack definition
└── showin-stack.WebApiHandler.ts // Web API Lambda handler
```

## 🔒 Security Architecture

### Authentication & Authorization
```yaml
User Authentication:
  - Alexa: userId (automatic from device)
  - Web: Google OAuth 2.0
  - User Identification: Unified user management via UserService

Lambda Permissions:
  - DynamoDB: Item-level access only
  - CloudWatch: Log creation and writing
  - No cross-account access

Data Privacy:
  - Data isolated by familyId (shared within families)
  - No PII storage beyond memo text and display names
  - Logical deletion (no hard delete)
  - Family invitation codes expire after 5 minutes
```

### Data Encryption
```yaml
At Rest:
  - DynamoDB: AWS managed encryption
  - Lambda: Environment variables encrypted
  - CloudWatch: Default encryption

In Transit:
  - Alexa → AWS: HTTPS/TLS
  - Lambda → DynamoDB: AWS SDK (encrypted)
  - All AWS internal: Encrypted by default
```

## 📈 Scalability Design

### Performance Characteristics
```yaml
Expected Load:
  - Users: 1-10 (personal use)
  - Requests/day: 10-100
  - Peak concurrent: 1-2

DynamoDB Scaling:
  - Mode: On-demand
  - Auto-scaling: Automatic
  - Read/Write: Burst capable

Lambda Scaling:
  - Concurrency: 100 (more than sufficient)
  - Cold starts: ~500ms (acceptable for voice)
  - Warm execution: ~50ms
```

### Growth Accommodation
```yaml
Scale to 1,000 users:
  - DynamoDB: No changes needed
  - Lambda: No changes needed
  - Cost impact: Minimal

Scale to 10,000 users:
  - DynamoDB: Consider provisioned capacity
  - Lambda: Monitor concurrent executions
  - Add caching layer if needed
```

## 🌍 Multi-Environment Design

### Environment Isolation
```yaml
Development (dev):
  - Stack: showin-dev
  - Table: showin-dev-memos
  - Function: showin-dev-handler

Staging (stg):
  - Stack: showin-stg
  - Table: showin-stg-memos
  - Function: showin-stg-handler

Production (prod):
  - Stack: showin-prod
  - Table: showin-prod-memos
  - Function: showin-prod-handler
```

### Configuration Management
```typescript
// Environment-specific settings
const config = {
  dev: {
    logLevel: 'DEBUG',
    retentionDays: 7,
    backupEnabled: false
  },
  stg: {
    logLevel: 'INFO', 
    retentionDays: 30,
    backupEnabled: true
  },
  prod: {
    logLevel: 'WARN',
    retentionDays: 90,
    backupEnabled: true
  }
};
```

## 🔍 Monitoring Architecture

### Observability Stack
```yaml
Metrics (CloudWatch):
  - Lambda: Duration, Errors, Invocations
  - DynamoDB: ConsumedReadCapacity, ConsumedWriteCapacity
  - Custom: Business metrics (memos created, deleted)

Logs (CloudWatch Logs):
  - Structured JSON logging
  - Request/response correlation
  - Error details with context

Alarms:
  - Lambda error rate > 5%
  - Lambda duration > 25s
  - DynamoDB throttling events
```

### Debugging Support
```typescript
// Structured logging example
logger.info('Memo operation', {
  userId: request.session.user.userId,
  operation: 'addMemo',
  memoText: sanitizedText,
  requestId: request.requestId,
  timestamp: new Date().toISOString()
});
```

---

## 🎯 Architecture Benefits

1. **Simplicity**: Minimal components, clear data flow
2. **Scalability**: Serverless auto-scaling
3. **Reliability**: AWS managed services
4. **Cost-Effective**: Pay-per-use model
5. **Maintainable**: Clear separation of concerns
6. **Secure**: AWS security best practices

This architecture supports the **ideanotes philosophy** of starting simple and evolving based on real usage patterns.