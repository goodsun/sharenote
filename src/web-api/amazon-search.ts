import * as https from 'https';

// HTTPSリクエストを送信
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };
    
    https.get(url, { headers }, (res) => {
      let data = '';
      
      // gzip対応
      if (res.headers['content-encoding'] === 'gzip') {
        const zlib = require('zlib');
        res = res.pipe(zlib.createGunzip());
      }
      
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
export async function searchAndExtractASIN(keyword: string) {
  const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&rh=p_36%3A50000-&s=exact-aware-popularity-rank`;
  console.log(`🔍 検索中: ${keyword}`);
  console.log(`   URL: ${searchUrl}`);
  
  try {
    const html = await httpsGet(searchUrl);
    
    // 正規表現でASINを抽出（data-asin属性から）
    const asinMatches = html.match(/data-asin="([A-Z0-9]{10})"/g);
    
    if (asinMatches && asinMatches.length > 0) {
      // 最初のASINを取得
      const firstASIN = asinMatches[0].match(/data-asin="([A-Z0-9]{10})"/)?.[1];
      
      if (!firstASIN) return null;
      
      // 商品詳細ページから情報を取得
      const productUrl = `https://www.amazon.co.jp/dp/${firstASIN}`;
      console.log(`   商品ページ取得中: ${productUrl}`);
      
      const productHtml = await httpsGet(productUrl);
      
      // 商品タイトルを取得
      let title = '商品名取得失敗';
      const titleMatch = productHtml.match(/<span[^>]*id="productTitle"[^>]*>([^<]+)<\/span>/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        // 別のパターンを試す
        const altTitleMatch = productHtml.match(/<h1[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/h1>/);
        if (altTitleMatch) {
          title = altTitleMatch[1].trim();
        }
      }
      
      // 価格を取得
      let price = null;
      let priceText = '価格情報なし';
      
      // 価格パターン1: span.a-price-whole
      const priceMatch = productHtml.match(/<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([^<]+)<\/span>/);
      if (priceMatch) {
        priceText = priceMatch[1].trim();
        // 数値に変換（カンマと円記号を除去）
        price = parseInt(priceText.replace(/[,￥¥]/g, ''));
      }
      
      // 価格パターン2: span.a-price-range
      if (!price) {
        const priceRangeMatch = productHtml.match(/<span[^>]*class="[^"]*a-price-range[^"]*"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/s);
        if (priceRangeMatch) {
          priceText = priceRangeMatch[1].trim();
          price = parseInt(priceText.replace(/[,￥¥]/g, ''));
        }
      }
      
      // 価格パターン3: data-asin-price
      if (!price) {
        const dataPriceMatch = productHtml.match(/data-asin-price="([^"]+)"/);
        if (dataPriceMatch) {
          priceText = `¥${dataPriceMatch[1]}`;
          price = parseFloat(dataPriceMatch[1]);
        }
      }
      
      return {
        keyword,
        asin: firstASIN,
        title,
        price,
        priceText,
        productUrl,
        affiliateUrl: `${productUrl}?tag=bonsoleil2019-22`,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Amazon search error:', error);
    return null;
  }
}