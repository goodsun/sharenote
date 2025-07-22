#!/usr/bin/env node

/**
 * Amazon ASIN取得ツール (Node.js版)
 * 
 * 使用方法:
 * 1. URLからASIN取得: node scripts/get-asin.js "https://www.amazon.co.jp/dp/B07T4LN3YC"
 * 2. キーワード検索: node scripts/get-asin.js --search "トイレットペーパー"
 * 3. バッチ処理: node scripts/get-asin.js --batch products.txt
 * 4. JSON出力: node scripts/get-asin.js --json "URL"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ASINをURLから抽出
function extractASIN(url) {
  // パターン1: /dp/ASIN
  let match = url.match(/\/dp\/([A-Z0-9]{10})/);
  if (match) return match[1];
  
  // パターン2: /gp/product/ASIN
  match = url.match(/\/gp\/product\/([A-Z0-9]{10})/);
  if (match) return match[1];
  
  // パターン3: ?asin=ASIN
  const urlObj = new URL(url);
  const asin = urlObj.searchParams.get('asin');
  if (asin && asin.match(/^[A-Z0-9]{10}$/)) return asin;
  
  return null;
}

// 検索URLを生成
function generateSearchURL(keyword) {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
}

// バッチファイルを処理
async function processBatchFile(filename) {
  const results = [];
  
  try {
    const fileStream = fs.createReadStream(filename);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.startsWith('http')) {
        const asin = extractASIN(trimmed);
        results.push({
          input: trimmed,
          asin: asin,
          type: 'url'
        });
      } else {
        results.push({
          input: trimmed,
          searchUrl: generateSearchURL(trimmed),
          type: 'keyword'
        });
      }
    }
    
    return results;
  } catch (error) {
    throw new Error(`ファイル読み込みエラー: ${error.message}`);
  }
}

// コマンドライン引数を解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    search: false,
    batch: false,
    json: false,
    help: false,
    input: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--search':
      case '-s':
        options.search = true;
        options.input = args[++i];
        break;
      case '--batch':
      case '-b':
        options.batch = true;
        options.input = args[++i];
        break;
      case '--json':
      case '-j':
        options.json = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (!args[i].startsWith('-')) {
          options.input = args[i];
        }
    }
  }
  
  return options;
}

// ヘルプメッセージを表示
function showHelp() {
  console.log(`
📚 Amazon ASIN取得ツール (Node.js版)

使用方法:
  node scripts/get-asin.js [オプション] <入力>

オプション:
  -s, --search    キーワード検索URLを生成
  -b, --batch     バッチファイルを処理
  -j, --json      JSON形式で出力
  -h, --help      このヘルプを表示

使用例:
  1. URLからASIN取得:
     node scripts/get-asin.js "https://www.amazon.co.jp/dp/B07T4LN3YC"
  
  2. キーワード検索:
     node scripts/get-asin.js --search "トイレットペーパー"
  
  3. バッチ処理:
     node scripts/get-asin.js --batch products.txt
  
  4. JSON形式で出力:
     node scripts/get-asin.js --json "https://www.amazon.co.jp/dp/B07T4LN3YC"

バッチファイルの形式:
  # コメント行
  https://www.amazon.co.jp/dp/B07T4LN3YC
  https://www.amazon.co.jp/dp/B084SV8N5Q
  トイレットペーパー
  洗剤
  `);
}

// メイン処理
async function main() {
  const options = parseArgs();
  
  if (options.help || !options.input) {
    showHelp();
    return;
  }
  
  try {
    if (options.batch) {
      // バッチ処理
      console.log(`\n📁 バッチファイル処理: ${options.input}\n`);
      const results = await processBatchFile(options.input);
      
      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        results.forEach(result => {
          if (result.type === 'url') {
            if (result.asin) {
              console.log(`✅ ${result.input}`);
              console.log(`   ASIN: ${result.asin}`);
              console.log(`   商品URL: https://www.amazon.co.jp/dp/${result.asin}\n`);
            } else {
              console.log(`❌ ${result.input}`);
              console.log(`   ASINが見つかりませんでした\n`);
            }
          } else {
            console.log(`🔍 ${result.input}`);
            console.log(`   検索URL: ${result.searchUrl}\n`);
          }
        });
      }
      
    } else if (options.search) {
      // キーワード検索
      const searchUrl = generateSearchURL(options.input);
      
      if (options.json) {
        console.log(JSON.stringify({
          keyword: options.input,
          searchUrl: searchUrl
        }, null, 2));
      } else {
        console.log(`\n🔍 検索キーワード: ${options.input}`);
        console.log(`📎 検索URL: ${searchUrl}`);
        console.log(`\n使い方:`);
        console.log(`1. 上記URLをブラウザで開く`);
        console.log(`2. 商品ページを開く`);
        console.log(`3. URLをコピーしてこのツールに渡す`);
        console.log(`   例: node scripts/get-asin.js "商品URL"\n`);
      }
      
    } else {
      // URL解析
      const asin = extractASIN(options.input);
      
      if (options.json) {
        console.log(JSON.stringify({
          url: options.input,
          asin: asin,
          productUrl: asin ? `https://www.amazon.co.jp/dp/${asin}` : null,
          affiliateUrl: asin ? `https://www.amazon.co.jp/dp/${asin}?tag=bonsoleil2019-22` : null
        }, null, 2));
      } else {
        if (asin) {
          console.log(`\n✅ ASIN: ${asin}`);
          console.log(`📎 商品URL: https://www.amazon.co.jp/dp/${asin}`);
          console.log(`🔗 アフィリエイトURL: https://www.amazon.co.jp/dp/${asin}?tag=bonsoleil2019-22\n`);
        } else {
          console.log(`\n❌ ASINが見つかりませんでした`);
          console.log(`有効なAmazon商品URLを入力してください\n`);
        }
      }
    }
    
  } catch (error) {
    console.error(`\n❌ エラー: ${error.message}\n`);
    process.exit(1);
  }
}

// 実行
main().catch(console.error);