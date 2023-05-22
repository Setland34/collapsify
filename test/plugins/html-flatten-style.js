import assert from 'power-assert';
import {describe, it} from 'mocha';
import {stringResponse, gifResponse} from '../helpers.js';
import {rewriteHtml} from '../../built/utils/html-rewriter.js';

async function test(input, expected, options) {
  const actual = await rewriteHtml(input, options);
  assert.equal(actual, expected);
}

describe('posthtml-flatten-style', () => {
  it('should flatten inline style', () => {
    return test(
      '<style>body > .test { background: url(gif.gif); }</style>',
      '<style>body>.test{background:url(data:image/gif;base64,R0lGODlhAQABAAAAADs=)}</style>',
      {
        async fetch(url) {
          assert(url === 'https://example.com/gif.gif');
          return gifResponse();
        },
        resourceLocation: 'https://example.com',
      },
    );
  });

  it('should ignore base64 URLs in inline style', () => {
    return test(
      '<style>body { background: url(data:application/x-empty;base64,); }</style>',
      '<style>body{background:url(data:application/x-empty;base64,)}</style>',
      {
        fetch() {
          assert(false, 'unexpected resource resolution');
        },
        resourceLocation: 'https://example.com',
      },
    );
  });

  it('should flatten external stylesheets', () => {
    return test(
      '<link rel="stylesheet" href="/static/css/app.css">',
      '<style>body,html{height:100%}</style>',
      {
        async fetch(url) {
          assert(url === 'https://example.com/static/css/app.css');
          return stringResponse('html, body { height: 100%; }');
        },
        resourceLocation: 'https://example.com/page.html',
      },
    );
  });

  it('should flatten resources in external stylesheets', () => {
    return test(
      '<link rel="stylesheet" href="/static/css/app.css">',
      '<style>body>.test{background:url(data:image/gif;base64,R0lGODlhAQABAAAAADs=)}</style>',
      {
        async fetch(url) {
          switch (url) {
            case 'https://example.com/static/css/app.css': {
              return stringResponse(
                'body > .test { background: url(gif.gif) }',
              );
            }

            case 'https://example.com/static/css/gif.gif': {
              return gifResponse();
            }

            default: {
              assert(false, 'unknown resource resolution');
            }
          }
        },
        resourceLocation: 'https://example.com/page.html',
      },
    );
  });
});
