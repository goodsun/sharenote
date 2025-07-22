#!/usr/bin/env python3
"""
Amazon商品のASINを取得するスクリプト

使用方法:
1. 単一商品のURL: python scripts/get-amazon-asin.py "https://www.amazon.co.jp/dp/B07T4LN3YC"
2. 検索キーワード: python scripts/get-amazon-asin.py --search "トイレットペーパー"
3. バッチ処理: python scripts/get-amazon-asin.py --batch products.txt
"""

import re
import sys
import argparse
from urllib.parse import urlparse, parse_qs

def extract_asin_from_url(url):
    """URLからASINを抽出"""
    # パターン1: /dp/ASIN
    match = re.search(r'/dp/([A-Z0-9]{10})', url)
    if match:
        return match.group(1)
    
    # パターン2: /gp/product/ASIN
    match = re.search(r'/gp/product/([A-Z0-9]{10})', url)
    if match:
        return match.group(1)
    
    # パターン3: ?asin=ASIN
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    if 'asin' in params:
        return params['asin'][0]
    
    return None

def generate_search_url(keyword):
    """検索URLを生成"""
    import urllib.parse
    encoded = urllib.parse.quote(keyword)
    return f"https://www.amazon.co.jp/s?k={encoded}"

def process_batch_file(filename):
    """バッチファイルを処理"""
    results = []
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                if line.startswith('http'):
                    asin = extract_asin_from_url(line)
                    if asin:
                        results.append(f"{line} → ASIN: {asin}")
                    else:
                        results.append(f"{line} → ASIN not found")
                else:
                    # キーワードとして扱う
                    url = generate_search_url(line)
                    results.append(f"{line} → 検索URL: {url}")
        
        return results
    except FileNotFoundError:
        return [f"Error: ファイル '{filename}' が見つかりません"]

def main():
    parser = argparse.ArgumentParser(description='Amazon商品のASINを取得')
    parser.add_argument('input', nargs='?', help='Amazon商品URL')
    parser.add_argument('--search', '-s', help='検索キーワード')
    parser.add_argument('--batch', '-b', help='バッチ処理用ファイル')
    parser.add_argument('--format', '-f', choices=['json', 'csv', 'text'], 
                       default='text', help='出力形式')
    
    args = parser.parse_args()
    
    if args.batch:
        # バッチ処理
        results = process_batch_file(args.batch)
        for result in results:
            print(result)
    
    elif args.search:
        # 検索URL生成
        url = generate_search_url(args.search)
        print(f"\n🔍 検索キーワード: {args.search}")
        print(f"📎 検索URL: {url}")
        print("\n使い方:")
        print("1. 上記URLをブラウザで開く")
        print("2. 商品ページを開く")
        print("3. URLをコピーしてこのスクリプトに渡す")
        print(f"   例: python {sys.argv[0]} \"商品URL\"")
    
    elif args.input:
        # URL解析
        asin = extract_asin_from_url(args.input)
        if asin:
            if args.format == 'json':
                print(f'{{"url": "{args.input}", "asin": "{asin}"}}')
            elif args.format == 'csv':
                print(f'"{args.input}","{asin}"')
            else:
                print(f"\n✅ ASIN: {asin}")
                print(f"📎 商品URL: https://www.amazon.co.jp/dp/{asin}")
                print(f"🔗 アフィリエイトURL: https://www.amazon.co.jp/dp/{asin}?tag=YOUR_TAG")
        else:
            print("\n❌ ASINが見つかりませんでした")
            print("有効なAmazon商品URLを入力してください")
    
    else:
        # 使用例を表示
        print("\n📚 Amazon ASIN取得ツール\n")
        print("使用例:")
        print(f"1. URLからASIN取得:")
        print(f"   python {sys.argv[0]} \"https://www.amazon.co.jp/dp/B07T4LN3YC\"")
        print(f"\n2. キーワード検索:")
        print(f"   python {sys.argv[0]} --search \"トイレットペーパー\"")
        print(f"\n3. バッチ処理:")
        print(f"   python {sys.argv[0]} --batch products.txt")
        print(f"\n4. JSON形式で出力:")
        print(f"   python {sys.argv[0]} --format json \"URL\"")

if __name__ == "__main__":
    main()