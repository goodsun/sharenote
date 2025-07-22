#!/usr/bin/env node

/**
 * Amazon商品データベース更新スクリプト
 * search-results.jsonから商品情報を読み込んで、
 * amazon-text-links.js用のコードを生成
 */

const fs = require('fs');
const path = require('path');

// search-results.jsonを読み込み
function loadSearchResults() {
  const filePath = path.join(__dirname, '..', 'search-results.json');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ search-results.jsonが見つかりません');
    console.log('先に get-asin-auto.js を実行してください');
    return null;
  }
  
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

// 商品データベース用のコードを生成
function generateProductCode(results) {
  const productCode = results.map(result => {
    if (!result.asin) return null;
    
    // キーワードから適切なキー名を生成
    const key = result.keyword;
    
    // 価格情報を含むコメント
    const priceComment = result.price ? ` // ${result.priceText}円 (${new Date(result.lastUpdated).toLocaleDateString('ja-JP')})` : '';
    
    return `      "${key}": {
        title: "${result.title.replace(/"/g, '\\"')}",
        asin: "${result.asin}",
        keywords: ["${result.keyword.toLowerCase()}"]${priceComment}
      }`;
  }).filter(Boolean).join(',\n');
  
  return productCode;
}

// メイン処理
function main() {
  console.log('📚 Amazon商品データベース更新ツール\n');
  
  const results = loadSearchResults();
  if (!results) return;
  
  console.log(`✅ ${results.length}件の商品データを読み込みました\n`);
  
  // 商品コードを生成
  const productCode = generateProductCode(results);
  
  console.log('📝 以下のコードをamazon-text-links.jsのthis.productsに追加してください:\n');
  console.log('```javascript');
  console.log(productCode);
  console.log('```\n');
  
  // 価格一覧を表示
  console.log('💰 価格情報:');
  results.forEach(result => {
    if (result.asin && result.price) {
      console.log(`   ${result.keyword}: ¥${result.priceText}`);
    }
  });
  
  // 更新用のファイルを生成
  const outputPath = path.join(__dirname, 'product-updates.js');
  fs.writeFileSync(outputPath, `// ${new Date().toISOString()} に生成\n// amazon-text-links.jsのthis.productsに追加してください\n\n${productCode}`);
  
  console.log(`\n💾 更新用コードを ${outputPath} に保存しました`);
}

// 実行
if (require.main === module) {
  main();
}