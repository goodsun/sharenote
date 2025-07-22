#!/usr/bin/env node

/**
 * Amazon ASIN自動取得ツール
 * 検索キーワードから自動的に最初の商品のASINを取得
 * 
 * 使用方法:
 * node scripts/get-asin-auto.js "トイレットペーパー"
 * node scripts/get-asin-auto.js --batch keywords.txt
 */

const https = require('https');

// HTTPSリクエストを送信
function httpsGet(url) {
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

// 検索結果からASINを抽出
async function searchAndExtractASIN(keyword) {
  const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  console.log(`🔍 検索中: ${keyword}`);
  console.log(`   URL: ${searchUrl}`);
  
  try {
    const html = await httpsGet(searchUrl);
    
    // 正規表現でASINを抽出（data-asin属性から）
    const asinMatches = html.match(/data-asin="([A-Z0-9]{10})"/g);
    
    if (asinMatches && asinMatches.length > 0) {
      // 最初のASINを取得
      const firstASIN = asinMatches[0].match(/data-asin="([A-Z0-9]{10})"/)[1];
      
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
    } else {
      // HTMLファイルに保存してデバッグ
      const fs = require('fs');
      fs.writeFileSync('debug-search-result.html', html);
      
      return {
        keyword,
        error: '商品が見つかりませんでした',
        debug: 'debug-search-result.htmlを確認してください'
      };
    }
    
  } catch (error) {
    return {
      keyword,
      error: error.message
    };
  }
}

// Puppeteerを使用した高度なスクレイピング（オプション）
async function searchWithPuppeteer(keyword) {
  console.log('⚠️  Puppeteerを使用するには、先にインストールが必要です:');
  console.log('   npm install puppeteer');
  console.log('\nPuppeteerを使用したサンプルコード:');
  
  const code = `
const puppeteer = require('puppeteer');

async function searchAmazon(keyword) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Amazonの検索ページにアクセス
  await page.goto(\`https://www.amazon.co.jp/s?k=\${encodeURIComponent(keyword)}\`);
  
  // 最初の商品のASINを取得
  const asin = await page.evaluate(() => {
    const firstProduct = document.querySelector('[data-asin]');
    return firstProduct ? firstProduct.getAttribute('data-asin') : null;
  });
  
  await browser.close();
  return asin;
}
`;
  
  console.log(code);
}

// curlコマンドを使用したシンプルな方法
function getCurlCommand(keyword) {
  const url = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  return `curl -s -H "User-Agent: Mozilla/5.0" "${url}" | grep -o 'data-asin="[A-Z0-9]*"' | head -1 | cut -d'"' -f2`;
}

// バッチ処理
async function processBatch(filename) {
  const fs = require('fs');
  const readline = require('readline');
  
  const results = [];
  const fileStream = fs.createReadStream(filename);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const keywords = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      keywords.push(trimmed);
    }
  }
  
  console.log(`\n📦 ${keywords.length}個のキーワードを処理します...\n`);
  
  for (const keyword of keywords) {
    const result = await searchAndExtractASIN(keyword);
    results.push(result);
    
    // レート制限対策（1秒待機）
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📚 Amazon ASIN自動取得ツール

使用方法:
  node scripts/get-asin-auto.js <キーワード>
  node scripts/get-asin-auto.js --batch <ファイル>
  node scripts/get-asin-auto.js --curl <キーワード>

例:
  node scripts/get-asin-auto.js "トイレットペーパー"
  node scripts/get-asin-auto.js --batch keywords.txt
  node scripts/get-asin-auto.js --curl "洗剤"

注意:
  - スクレイピングは利用規約を確認してください
  - 大量のリクエストは避けてください
  - レート制限に注意してください
    `);
    return;
  }
  
  try {
    if (args[0] === '--batch' && args[1]) {
      // バッチ処理
      const results = await processBatch(args[1]);
      
      console.log('\n📊 結果:\n');
      results.forEach(result => {
        if (result.asin) {
          console.log(`✅ ${result.keyword}`);
          console.log(`   ASIN: ${result.asin}`);
          console.log(`   商品: ${result.title}`);
          console.log(`   価格: ${result.priceText}`);
          console.log(`   URL: ${result.productUrl}\n`);
        } else {
          console.log(`❌ ${result.keyword}`);
          console.log(`   エラー: ${result.error}\n`);
        }
      });
      
      // JSON形式で保存
      const fs = require('fs');
      fs.writeFileSync('search-results.json', JSON.stringify(results, null, 2));
      console.log('💾 結果をsearch-results.jsonに保存しました');
      
    } else if (args[0] === '--curl' && args[1]) {
      // curlコマンドを表示
      console.log('\n🔧 以下のコマンドで取得できます:\n');
      console.log(getCurlCommand(args[1]));
      console.log('\n');
      
    } else if (args[0] === '--puppeteer') {
      // Puppeteerの使用方法を表示
      await searchWithPuppeteer(args[1] || 'サンプル');
      
    } else {
      // 単一キーワード検索
      const result = await searchAndExtractASIN(args[0]);
      
      if (result.asin) {
        console.log(`\n✅ 検索成功！`);
        console.log(`   ASIN: ${result.asin}`);
        console.log(`   商品: ${result.title}`);
        console.log(`   価格: ${result.priceText}`);
        console.log(`   商品URL: ${result.productUrl}`);
        console.log(`   アフィリエイトURL: ${result.affiliateUrl}`);
        console.log(`   取得日時: ${result.lastUpdated}\n`);
      } else {
        console.log(`\n❌ 検索失敗`);
        console.log(`   エラー: ${result.error}`);
        if (result.debug) {
          console.log(`   ${result.debug}\n`);
        }
      }
    }
    
  } catch (error) {
    console.error(`\n❌ エラー: ${error.message}\n`);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main().catch(console.error);
}

// エクスポート（他のスクリプトから使用する場合）
module.exports = {
  searchAndExtractASIN,
  getCurlCommand
};