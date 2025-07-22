import { APIGatewayProxyHandler } from 'aws-lambda';
import { searchAndExtractASIN } from './web-api/amazon-search';

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Web API Request:', {
    method: event.httpMethod,
    path: event.path
  });

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

  // Amazon商品検索エンドポイント
  if (event.path === '/api/amazon/search' && event.httpMethod === 'GET') {
    try {
      const keyword = event.queryStringParameters?.keyword;
      
      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'キーワードが指定されていません' })
        };
      }

      console.log(`Amazon search request for: ${keyword}`);
      
      // Amazon検索を実行
      const result = await searchAndExtractASIN(keyword);
      
      if (result) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...result,
            found: true
          })
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
      console.error('Amazon search error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'サーバーエラーが発生しました' })
      };
    }
  }

  // その他のリクエストは404を返す
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'Not Found' })
  };
};