#!/usr/bin/env node

/**
 * リアルタイムで商品データを更新するスクリプト
 * 
 * 使用方法:
 * node scripts/update-products-realtime.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 基本的な商品キーワード
const keywords = [
  'トイレットペーパー',
  '洗剤',
  'シャンプー',
  'マスク',
  'エコバッグ',
  '電池',
  'ゴミ袋',
  'ラップ',
  '水',
  '米',
  '牛乳',
  '卵',
  'パン',
  'ティッシュ',
  '洗濯洗剤',
  'ボディソープ',
  '歯磨き粉',
  'おむつ',
  '粉ミルク',
  'サプリ'
];

// get-asin-auto.jsを使って商品情報を取得
async function fetchProductInfo(keyword) {
  try {
    console.log(`Fetching: ${keyword}`);
    const scriptPath = path.join(__dirname, 'get-asin-auto.js');
    const result = execSync(`node "${scriptPath}" "${keyword}"`, { encoding: 'utf8' });
    
    // 結果から情報を抽出
    const asinMatch = result.match(/ASIN: ([A-Z0-9]{10})/);
    const titleMatch = result.match(/商品: (.+)/);
    const priceMatch = result.match(/価格: ([\d,]+)/);
    
    if (asinMatch && titleMatch) {
      const priceValue = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;
      
      return {
        keyword,
        asin: asinMatch[1],
        title: titleMatch[1].trim(),
        price: priceValue,
        lastUpdated: new Date().toISOString()
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${keyword}:`, error.message);
    return null;
  }
}

// メイン処理
async function main() {
  console.log('🔄 商品データをリアルタイム更新中...\n');
  
  const products = {};
  
  for (const keyword of keywords) {
    const productInfo = await fetchProductInfo(keyword);
    
    if (productInfo) {
      const key = keyword.toLowerCase().replace(/\s/g, '_');
      products[key] = {
        title: productInfo.title,
        asin: productInfo.asin,
        price: productInfo.price,
        keywords: [keyword],
        triggers: ['なくなった', '切れた', '買う', '購入', '補充', '必要']
      };
      
      console.log(`✅ ${keyword}: ${productInfo.title} (¥${productInfo.price || '???'})`);
    } else {
      console.log(`❌ ${keyword}: 取得失敗`);
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // JavaScriptコードを生成
  const jsCode = `// Amazon Smart Links 商品データベース（自動生成）
// 最終更新: ${new Date().toISOString()}

window.AmazonProductDatabase = ${JSON.stringify(products, null, 2)};
`;

  // ファイルに保存
  const outputPath = path.join(__dirname, '..', 'public', 'amazon-products-data.js');
  fs.writeFileSync(outputPath, jsCode);
  
  console.log(`\n✅ 商品データを更新しました: ${outputPath}`);
  console.log(`📊 取得成功: ${Object.keys(products).length}件`);
}

// 実行
if (require.main === module) {
  main().catch(console.error);
}