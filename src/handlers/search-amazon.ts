import { APIGatewayProxyHandler } from 'aws-lambda';
import * as https from 'https';

// HTTPSリクエストを送信
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
    };
    
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 検索結果からASINと商品情報を抽出
async function searchAndExtractASIN(keyword: string) {
  // 価格フィルターと人気順ソートを追加
  const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&rh=p_36%3A50000-&s=exact-aware-popularity-rank`;
  console.log(`Searching: ${keyword}`);
  console.log(`URL: ${searchUrl}`);
  
  try {
    const html = await httpsGet(searchUrl);
    
    // ASINを抽出
    const asinMatches = html.match(/data-asin="([A-Z0-9]{10})"/g);
    
    if (asinMatches && asinMatches.length > 0) {
      // 最初のASINを取得
      const firstASIN = asinMatches[0].match(/data-asin="([A-Z0-9]{10})"/)?.[1];
      
      if (!firstASIN) {
        return null;
      }
      
      // 商品詳細ページから情報を取得
      const productUrl = `https://www.amazon.co.jp/dp/${firstASIN}`;
      console.log(`Fetching product: ${productUrl}`);
      
      const productHtml = await httpsGet(productUrl);
      
      // 商品タイトルを取得
      let title = '商品名取得失敗';
      const titleMatch = productHtml.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      // 価格を取得
      let price = null;
      let priceText = '価格情報なし';
      
      const priceMatch = productHtml.match(/<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/);
      if (priceMatch) {
        priceText = priceMatch[1].trim();
        price = parseInt(priceText.replace(/[,￥¥]/g, ''));
      }
      
      return {
        keyword,
        asin: firstASIN,
        title,
        price,
        priceText,
        productUrl,
        found: true
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Search error:', error);
    return null;
  }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };

  // OPTIONS リクエストの処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // クエリパラメータからキーワードを取得
    const keyword = event.queryStringParameters?.keyword;
    
    if (!keyword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'キーワードが指定されていません' })
      };
    }

    // 商品を検索
    const result = await searchAndExtractASIN(keyword);
    
    if (result) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          keyword,
          found: false,
          error: '商品が見つかりませんでした' 
        })
      };
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'サーバーエラーが発生しました' })
    };
  }
};