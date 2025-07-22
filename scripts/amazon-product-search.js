#!/usr/bin/env node

/**
 * Amazon商品検索スクリプト
 * 
 * 使用方法:
 * node scripts/amazon-product-search.js "検索キーワード"
 * 
 * 注意: Amazon Product Advertising APIの認証情報が必要です
 * 環境変数に以下を設定してください:
 * - AMAZON_ACCESS_KEY
 * - AMAZON_SECRET_KEY
 * - AMAZON_PARTNER_TAG (アソシエイトID)
 */

const https = require('https');
const crypto = require('crypto');

// Amazon Product Advertising API設定
const AMAZON_HOST = 'webservices.amazon.co.jp';
const AMAZON_REGION = 'us-west-2'; // APIのリージョン
const AMAZON_SERVICE = 'ProductAdvertisingAPI';

// スクレイピング版（API認証なしで使える簡易版）
async function searchAmazonSimple(keyword) {
  console.log(`\n🔍 "${keyword}" を検索中...\n`);
  
  // Amazonの検索URLを構築
  const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
  console.log(`検索URL: ${searchUrl}`);
  console.log('\n手動で検索する場合の手順:');
  console.log('1. 上記URLをブラウザで開く');
  console.log('2. 商品をクリック');
  console.log('3. URLからASINを取得（/dp/の後の10文字）');
  console.log('   例: https://www.amazon.co.jp/dp/B07T4LN3YC/ → ASIN: B07T4LN3YC\n');
  
  // curlコマンドで商品情報を取得する例
  console.log('コマンドラインで商品情報を確認:');
  console.log(`curl -s "${searchUrl}" | grep -o 'data-asin="[A-Z0-9]*"' | head -5\n`);
  
  return {
    searchUrl,
    message: 'ブラウザで検索してASINを取得してください'
  };
}

// Product Advertising API版（要認証）
async function searchAmazonAPI(keyword) {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG || 'bonsoleil2019-22';
  
  if (!accessKey || !secretKey) {
    console.log('⚠️  Amazon Product Advertising APIの認証情報が設定されていません');
    console.log('以下の環境変数を設定してください:');
    console.log('- AMAZON_ACCESS_KEY');
    console.log('- AMAZON_SECRET_KEY');
    console.log('- AMAZON_PARTNER_TAG\n');
    return null;
  }
  
  // API リクエストのペイロード
  const payload = {
    Keywords: keyword,
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.ProductInfo',
      'ItemInfo.Features'
    ],
    SearchIndex: 'All',
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.co.jp',
    Operation: 'SearchItems'
  };
  
  // リクエストの構築
  const request = {
    host: AMAZON_HOST,
    path: '/paapi5/searchitems',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'content-encoding': 'amz-1.0'
    }
  };
  
  console.log('🔐 Product Advertising APIを使用した検索...');
  console.log('（実装にはAWS SDK for JavaScriptの使用を推奨）\n');
  
  return {
    message: 'Product Advertising APIの実装は別途必要です',
    sdkUrl: 'https://webservices.amazon.com/paapi5/documentation/quick-start/using-sdk.html'
  };
}

// メイン処理
async function main() {
  const keyword = process.argv[2];
  
  if (!keyword) {
    console.log('使用方法: node scripts/amazon-product-search.js "検索キーワード"');
    console.log('例: node scripts/amazon-product-search.js "トイレットペーパー"');
    process.exit(1);
  }
  
  // 簡易検索を実行
  const result = await searchAmazonSimple(keyword);
  
  // API版の情報も表示
  await searchAmazonAPI(keyword);
  
  // 既存の商品データベースから検索
  console.log('\n📦 既存の商品データベースから検索:');
  try {
    const amazonTextLinks = require('../public/amazon-text-links.js');
    const products = {
      "トイレットペーパー": { asin: "B07T4LN3YC", title: "スコッティ フラワーパック" },
      "洗剤": { asin: "B084SV8N5Q", title: "アリエール 洗濯洗剤" },
      "シャンプー": { asin: "B08R6QHPKY", title: "パンテーン シャンプー" },
      "牛乳": { asin: "B09TP5QF4K", title: "明治おいしい牛乳" },
      "米": { asin: "B0053E33YS", title: "新潟県産コシヒカリ" },
      "水": { asin: "B073S1TW1K", title: "天然水 2L×9本" },
      "カップラーメン": { asin: "B00NOUCGJG", title: "日清カップヌードル" },
      "おむつ": { asin: "B0BLPJ87M6", title: "メリーズ おむつ" },
      "粉ミルク": { asin: "B01M5K9V9V", title: "明治ほほえみ" },
      "マスク": { asin: "B088HXFFXM", title: "快適ガードプロ マスク" },
      "サプリ": { asin: "B07PDBMBY4", title: "DHC マルチビタミン" },
      "電池": { asin: "B07L4P18MK", title: "パナソニック 乾電池" },
      "ゴミ袋": { asin: "B07FNWWZQV", title: "ゴミ袋 45L" },
      "ラップ": { asin: "B00U2Q8N3O", title: "サランラップ" }
    };
    
    const found = Object.entries(products).find(([key, value]) => 
      key.includes(keyword) || value.title.includes(keyword)
    );
    
    if (found) {
      console.log(`✅ 見つかりました: ${found[1].title}`);
      console.log(`   ASIN: ${found[1].asin}`);
      console.log(`   URL: https://www.amazon.co.jp/dp/${found[1].asin}`);
    } else {
      console.log('❌ データベースに該当商品が見つかりませんでした');
    }
  } catch (e) {
    console.log('⚠️  商品データベースの読み込みに失敗しました');
  }
}

// 実行
main().catch(console.error);