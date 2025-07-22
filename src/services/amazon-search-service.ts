import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AmazonSearchService {
  private static instance: AmazonSearchService;
  private searchCache: Map<string, any> = new Map();
  private cacheExpiry = 3600000; // 1時間

  static getInstance(): AmazonSearchService {
    if (!AmazonSearchService.instance) {
      AmazonSearchService.instance = new AmazonSearchService();
    }
    return AmazonSearchService.instance;
  }

  // キーワードから商品を検索
  async searchProduct(keyword: string): Promise<any> {
    // キャッシュチェック
    const cached = this.searchCache.get(keyword);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`Cache hit for: ${keyword}`);
      return cached.data;
    }

    try {
      console.log(`Searching Amazon for: ${keyword}`);
      
      // Node.jsスクリプトを実行して商品情報を取得
      const scriptPath = '/opt/nodejs/get-asin-auto.js';
      const { stdout, stderr } = await execAsync(`node ${scriptPath} "${keyword}"`);
      
      if (stderr) {
        console.error('Search error:', stderr);
        return null;
      }

      // 結果をパース
      const result = this.parseSearchResult(stdout);
      
      // キャッシュに保存
      if (result) {
        this.searchCache.set(keyword, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      console.error('Amazon search error:', error);
      return null;
    }
  }

  // 検索結果をパース
  private parseSearchResult(output: string): any {
    try {
      // ASINを抽出
      const asinMatch = output.match(/ASIN: ([A-Z0-9]{10})/);
      const titleMatch = output.match(/商品: (.+)/);
      const priceMatch = output.match(/価格: (.+)/);
      
      if (!asinMatch) return null;

      return {
        asin: asinMatch[1],
        title: titleMatch ? titleMatch[1].trim() : 'タイトル不明',
        price: priceMatch ? priceMatch[1].trim() : null,
        found: true
      };
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  // 静的な商品データベースから検索（フォールバック）
  searchFromStaticDatabase(keyword: string): any {
    const database: Record<string, any> = {
      'トイレットペーパー': {
        asin: 'B0DG1NMJTT',
        title: 'エリエール トイレットペーパー ダブル',
        price: '¥699'
      },
      '洗剤': {
        asin: 'B0CWLBNBQQ',
        title: 'アタックZERO 洗濯洗剤',
        price: '¥1,939'
      },
      'シャンプー': {
        asin: 'B0F9JRY6R7',
        title: 'BOTANIST ボタニスト シャンプー',
        price: '¥3,080'
      },
      'マスク': {
        asin: 'B0DH3J5B86',
        title: '日本製 不織布マスク',
        price: '¥1,628'
      }
    };

    // キーワードで部分一致検索
    for (const [key, value] of Object.entries(database)) {
      if (keyword.includes(key) || key.includes(keyword)) {
        return { ...value, found: true };
      }
    }

    return null;
  }
}