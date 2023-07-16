import { CloudFrontRequestEvent } from 'aws-lambda';

export const authed: CloudFrontRequestEvent = {
  'Records': [
    {
      'cf': {
        'config': {
          'distributionDomainName': 'abcd0123456789.cloudfront.net',
          'distributionId': 'ABCD0123456789',
          'eventType': 'viewer-request',
          'requestId': 'abcd0123-0123-0123-0123-0123456789ab',
        },
        'request': {
          'clientIp': '0.0.0.0',
          'headers': {
            'host': [
              {
                'key': 'Host',
                'value': 'app.dev.example.com',
              },
            ],
            'user-agent': [
              {
                'key': 'User-Agent',
                'value': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
              },
            ],
            'upgrade-insecure-requests': [
              {
                'key': 'upgrade-insecure-requests',
                'value': '1',
              },
            ],
            'accept': [
              {
                'key': 'accept',
                'value': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
              },
            ],
            'sec-gpc': [
              {
                'key': 'sec-gpc',
                'value': '1',
              },
            ],
            'sec-fetch-site': [
              {
                'key': 'sec-fetch-site',
                'value': 'none',
              },
            ],
            'sec-fetch-mode': [
              {
                'key': 'sec-fetch-mode',
                'value': 'navigate',
              },
            ],
            'sec-fetch-user': [
              {
                'key': 'sec-fetch-user',
                'value': '?1',
              },
            ],
            'sec-fetch-dest': [
              {
                'key': 'sec-fetch-dest',
                'value': 'document',
              },
            ],
            'accept-encoding': [
              {
                'key': 'accept-encoding',
                'value': 'gzip, deflate, br',
              },
            ],
            'accept-language': [
              {
                'key': 'accept-language',
                'value': 'en-US,en;q=0.9',
              },
            ],
          },
          'method': 'GET',
          'querystring': '',
          'uri': '/user/test.html',
        },
      },
    },
  ],
};

export const unauthed: CloudFrontRequestEvent = {
  'Records': [
    {
      'cf': {
        'config': {
          'distributionDomainName': 'abcd0123456789.cloudfront.net',
          'distributionId': 'ABCD0123456789',
          'eventType': 'viewer-request',
          'requestId': 'abcd0123-0123-0123-0123-0123456789ab',
        },
        'request': {
          'clientIp': '0.0.0.0',
          'headers': {
            'host': [
              {
                'key': 'Host',
                'value': 'abcd0123456789.cloudfront.net',
              },
            ],
            'user-agent': [
              {
                'key': 'User-Agent',
                'value': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36',
              },
            ],
            'cache-control': [
              {
                'key': 'cache-control',
                'value': 'max-age=0',
              },
            ],
            'upgrade-insecure-requests': [
              {
                'key': 'upgrade-insecure-requests',
                'value': '1',
              },
            ],
            'accept': [
              {
                'key': 'accept',
                'value': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
              },
            ],
            'sec-gpc': [
              {
                'key': 'sec-gpc',
                'value': '1',
              },
            ],
            'sec-fetch-site': [
              {
                'key': 'sec-fetch-site',
                'value': 'none',
              },
            ],
            'sec-fetch-mode': [
              {
                'key': 'sec-fetch-mode',
                'value': 'navigate',
              },
            ],
            'sec-fetch-user': [
              {
                'key': 'sec-fetch-user',
                'value': '?1',
              },
            ],
            'sec-fetch-dest': [
              {
                'key': 'sec-fetch-dest',
                'value': 'document',
              },
            ],
            'accept-encoding': [
              {
                'key': 'accept-encoding',
                'value': 'gzip, deflate, br',
              },
            ],
            'accept-language': [
              {
                'key': 'accept-language',
                'value': 'en-US,en;q=0.9',
              },
            ],
          },
          'method': 'GET',
          'querystring': '',
          'uri': '/user/cart.html',
        },
      },
    },
  ],
};

