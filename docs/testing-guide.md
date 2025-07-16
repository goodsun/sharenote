# Alexa Voice Memo - Testing Guide

*Generated from ideanotes project - 2025-07-12*

## 🎯 Testing Strategy

Following **ideanotes スモールスタート原則**:
- **Start simple**: Basic functionality tests first
- **Iterate gradually**: Add comprehensive tests as code evolves
- **Focus on value**: Test what matters for user experience
- **Learn from failures**: Use test failures as learning opportunities

## 📋 Testing Pyramid

### 1. Unit Tests (60%)
```
Focus: Individual functions and components
Tools: Jest + TypeScript
Coverage: >80% of business logic
```

### 2. Integration Tests (30%)
```
Focus: AWS service interactions
Tools: AWS SDK + DynamoDB Local
Coverage: Database operations, Lambda integration
```

### 3. End-to-End Tests (10%)
```
Focus: Complete user workflows
Tools: Alexa Skills Kit Testing Framework
Coverage: Voice interactions, real Alexa responses
```

## 🧪 Unit Testing

### Test Setup
```typescript
// test/setup.ts
import { jest } from '@jest/globals';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock environment variables
process.env.MEMO_TABLE_NAME = 'test-memos-table';
process.env.ENVIRONMENT = 'test';
```

### MemoService Tests
```typescript
// test/services/memo-service.test.ts
import { MemoService } from '../../src/services/memo-service';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

describe('MemoService', () => {
  let memoService: MemoService;
  let mockDynamoDB: jest.Mocked<DynamoDBDocumentClient>;

  beforeEach(() => {
    mockDynamoDB = {
      send: jest.fn(),
    } as any;
    memoService = new MemoService(mockDynamoDB);
  });

  describe('addMemo', () => {
    it('should add memo successfully', async () => {
      const userId = 'test-user-123';
      const text = 'Buy milk';
      
      mockDynamoDB.send.mockResolvedValueOnce({});
      
      const result = await memoService.addMemo(userId, text);
      
      expect(result).toEqual({
        userId,
        memoId: expect.stringMatching(/^memo_\d{8}_\d{3}$/),
        text,
        timestamp: expect.any(String),
        deleted: false,
        updatedAt: expect.any(String)
      });
      
      expect(mockDynamoDB.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-memos-table',
            Item: expect.objectContaining({
              userId,
              text,
              deleted: false
            })
          })
        })
      );
    });

    it('should throw error for empty text', async () => {
      await expect(memoService.addMemo('user', '')).rejects.toThrow(
        'Memo text cannot be empty'
      );
    });

    it('should throw error for text too long', async () => {
      const longText = 'a'.repeat(501);
      await expect(memoService.addMemo('user', longText)).rejects.toThrow(
        'Memo text too long'
      );
    });
  });

  describe('getActiveMemos', () => {
    it('should return active memos only', async () => {
      const userId = 'test-user-123';
      const mockMemos = {
        Items: [
          { memoId: 'memo1', text: 'Active memo', deleted: false },
          { memoId: 'memo2', text: 'Deleted memo', deleted: true },
          { memoId: 'memo3', text: 'Another active', deleted: false }
        ]
      };
      
      mockDynamoDB.send.mockResolvedValueOnce(mockMemos);
      
      const result = await memoService.getActiveMemos(userId);
      
      expect(result).toHaveLength(2);
      expect(result.every(memo => !memo.deleted)).toBe(true);
    });

    it('should return empty array when no memos', async () => {
      mockDynamoDB.send.mockResolvedValueOnce({ Items: [] });
      
      const result = await memoService.getActiveMemos('user');
      
      expect(result).toEqual([]);
    });
  });
});
```

### Handler Tests
```typescript
// test/handlers/add-memo-handler.test.ts
import { AddMemoHandler } from '../../src/handlers/add-memo-handler';
import { MemoService } from '../../src/services/memo-service';

jest.mock('../../src/services/memo-service');

describe('AddMemoHandler', () => {
  let handler: AddMemoHandler;
  let mockMemoService: jest.Mocked<MemoService>;

  beforeEach(() => {
    mockMemoService = {
      addMemo: jest.fn(),
    } as any;
    handler = new AddMemoHandler(mockMemoService);
  });

  it('should handle add memo intent successfully', async () => {
    const mockEvent = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AddMemoIntent',
          slots: {
            memoText: {
              value: 'Buy groceries'
            }
          }
        }
      },
      session: {
        user: {
          userId: 'test-user-123'
        }
      }
    };

    const mockMemo = {
      memoId: 'memo_20250712_001',
      text: 'Buy groceries',
      userId: 'test-user-123'
    };

    mockMemoService.addMemo.mockResolvedValueOnce(mockMemo as any);

    const response = await handler.handle(mockEvent as any);

    expect(response.response.outputSpeech.text).toBe(
      'Buy groceriersをメモに追加しました。'
    );
    expect(response.response.shouldEndSession).toBe(false);
  });

  it('should handle missing slot value', async () => {
    const mockEvent = {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AddMemoIntent',
          slots: {}
        }
      }
    };

    const response = await handler.handle(mockEvent as any);

    expect(response.response.outputSpeech.text).toContain(
      '申し訳ありません'
    );
  });
});
```

## 🔗 Integration Testing

### DynamoDB Integration Tests
```typescript
// test/integration/dynamodb.test.ts
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MemoService } from '../../src/services/memo-service';

// Use DynamoDB Local for testing
const dynamoClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'fake',
    secretAccessKey: 'fake'
  }
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

describe('DynamoDB Integration', () => {
  let memoService: MemoService;
  const testTableName = 'test-showin-memos';

  beforeAll(async () => {
    // Create test table
    process.env.MEMO_TABLE_NAME = testTableName;
    memoService = new MemoService(docClient);
    
    // Wait for table to be ready
    await waitForTable(testTableName);
  });

  beforeEach(async () => {
    // Clear test data
    await clearTestData(testTableName);
  });

  afterAll(async () => {
    // Cleanup test table
    await deleteTestTable(testTableName);
  });

  it('should perform full memo lifecycle', async () => {
    const userId = 'integration-test-user';
    
    // Add memo
    const memo1 = await memoService.addMemo(userId, 'First memo');
    expect(memo1.text).toBe('First memo');
    
    // Add another memo
    const memo2 = await memoService.addMemo(userId, 'Second memo');
    expect(memo2.text).toBe('Second memo');
    
    // Get all memos
    const allMemos = await memoService.getActiveMemos(userId);
    expect(allMemos).toHaveLength(2);
    
    // Delete first memo
    await memoService.deleteMemo(userId, memo1.memoId);
    
    // Verify deletion
    const remainingMemos = await memoService.getActiveMemos(userId);
    expect(remainingMemos).toHaveLength(1);
    expect(remainingMemos[0].memoId).toBe(memo2.memoId);
  });

  it('should handle concurrent operations', async () => {
    const userId = 'concurrent-test-user';
    
    // Add multiple memos concurrently
    const promises = Array.from({ length: 5 }, (_, i) =>
      memoService.addMemo(userId, `Memo ${i + 1}`)
    );
    
    const memos = await Promise.all(promises);
    expect(memos).toHaveLength(5);
    
    // Verify all memos exist
    const allMemos = await memoService.getActiveMemos(userId);
    expect(allMemos).toHaveLength(5);
  });
});
```

### Lambda Handler Integration Tests
```typescript
// test/integration/handler.test.ts
import { handler } from '../../src/handler';

describe('Lambda Handler Integration', () => {
  beforeEach(() => {
    // Setup test environment
    process.env.MEMO_TABLE_NAME = 'test-memos-table';
    process.env.ENVIRONMENT = 'test';
  });

  it('should handle complete add/read/delete flow', async () => {
    const userId = 'integration-test-user';
    
    // Launch request
    const launchResponse = await handler({
      request: { type: 'LaunchRequest' },
      session: { user: { userId } }
    } as any);
    
    expect(launchResponse.response.outputSpeech.text).toContain(
      'ボイスメモへようこそ'
    );
    
    // Add memo
    const addResponse = await handler({
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AddMemoIntent',
          slots: { memoText: { value: 'Integration test memo' } }
        }
      },
      session: { user: { userId } }
    } as any);
    
    expect(addResponse.response.outputSpeech.text).toContain(
      'Integration test memo'
    );
    
    // Read memos
    const readResponse = await handler({
      request: {
        type: 'IntentRequest',
        intent: { name: 'ReadMemosIntent' }
      },
      session: { user: { userId } }
    } as any);
    
    expect(readResponse.response.outputSpeech.text).toContain(
      'メモが1件あります'
    );
  });
});
```

## 🎤 End-to-End Testing

### Alexa Skills Kit Testing
```typescript
// test/e2e/alexa-skill.test.ts
import { AlexaTest } from 'ask-sdk-test';

describe('Alexa Skill E2E', () => {
  const skillHandler = require('../../src/handler').handler;
  const alexaTest = new AlexaTest(skillHandler);

  it('should handle complete conversation flow', async () => {
    // Launch skill
    const launchResponse = await alexaTest.launch();
    expect(launchResponse.spoke).toContain('ボイスメモへようこそ');
    
    // Add memo
    const addResponse = await alexaTest.utter('メモに牛乳を買うを追加');
    expect(addResponse.spoke).toContain('牛乳を買うをメモに追加しました');
    
    // Read memos
    const readResponse = await alexaTest.utter('メモを読んで');
    expect(readResponse.spoke).toContain('メモが1件あります');
    expect(readResponse.spoke).toContain('牛乳を買う');
    
    // Delete memo
    const deleteResponse = await alexaTest.utter('1番目のメモを削除');
    expect(deleteResponse.spoke).toContain('削除しました');
    
    // Verify empty
    const emptyResponse = await alexaTest.utter('メモを読んで');
    expect(emptyResponse.spoke).toContain('メモはありません');
  });

  it('should handle error scenarios gracefully', async () => {
    // Invalid memo number
    const invalidResponse = await alexaTest.utter('100番目のメモを削除');
    expect(invalidResponse.spoke).toContain('申し訳ありません');
    
    // Help request
    const helpResponse = await alexaTest.utter('ヘルプ');
    expect(helpResponse.spoke).toContain('ボイスメモでは');
    
    // Stop/Cancel
    const stopResponse = await alexaTest.utter('終了');
    expect(stopResponse.spoke).toContain('さようなら');
  });
});
```

## 📊 Performance Testing

### Load Testing
```typescript
// test/performance/load.test.ts
import { handler } from '../../src/handler';

describe('Performance Tests', () => {
  it('should handle response time requirements', async () => {
    const userId = 'perf-test-user';
    const startTime = Date.now();
    
    const response = await handler({
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AddMemoIntent',
          slots: { memoText: { value: 'Performance test memo' } }
        }
      },
      session: { user: { userId } }
    } as any);
    
    const responseTime = Date.now() - startTime;
    
    // Should respond within 3 seconds (Alexa requirement)
    expect(responseTime).toBeLessThan(3000);
    expect(response.response.outputSpeech).toBeDefined();
  });

  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      handler({
        request: {
          type: 'IntentRequest',
          intent: {
            name: 'AddMemoIntent',
            slots: { memoText: { value: `Concurrent memo ${i}` } }
          }
        },
        session: { user: { userId: `user-${i}` } }
      } as any)
    );

    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.response.outputSpeech).toBeDefined();
    });
  });
});
```

## 🔧 Test Infrastructure

### Test Scripts
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:e2e": "jest test/e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

### CI/CD Testing
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      dynamodb:
        image: amazon/dynamodb-local
        ports:
          - 8000:8000
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## ✅ Testing Checklist

### Unit Tests
- [ ] MemoService all methods
- [ ] Intent handlers all scenarios
- [ ] Validation functions
- [ ] Error handling paths
- [ ] Response builders
- [ ] Utility functions

### Integration Tests
- [ ] DynamoDB operations
- [ ] Lambda handler end-to-end
- [ ] Error scenarios
- [ ] Concurrent operations
- [ ] Data persistence

### End-to-End Tests
- [ ] Complete conversation flows
- [ ] All supported intents
- [ ] Error handling
- [ ] Edge cases
- [ ] Performance requirements

### Coverage Requirements
- [ ] Overall coverage > 80%
- [ ] Critical paths 100% covered
- [ ] Error paths tested
- [ ] All public APIs tested

---

## 💡 Testing Best Practices

1. **Test pyramid**: More unit tests, fewer E2E tests
2. **Fast feedback**: Unit tests should run in < 10 seconds
3. **Isolated tests**: Each test independent and repeatable
4. **Clear assertions**: Test one thing per test
5. **Realistic data**: Use production-like test data
6. **Continuous testing**: Run tests on every commit

Remember: Testing is learning - use test failures to understand and improve the system! 🎯