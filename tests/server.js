'use strict';

const miniprofiler = require('@daniloisr/miniprofiler');
const http = require('http');
const ip = require('docker-ip');

const redis = require('redis');
const client = redis.createClient(6060, ip());

const app = miniprofiler.express({
  enable: (req, res) => {
    return !req.url.startsWith('/unprofiled');
  }
});

const server = http.createServer((request, response) => {
  app(request, response, () => {
    miniprofiler.express.for(require('../index.js')(redis))(request, response, () => {
      if (request.url == '/redis-info') {
        client.info(() => {
          response.end('');
        });
      }

      if (request.url == '/redis-set-key') {
        client.set('key', 'Awesome!', () => {
          response.end('');
        });
      }

      if (request.url == '/redis-set-without-callback') {
        client.set('key', 'Fire and forget');
        response.end('');
      }

      if (request.url == '/redis-set-get-key') {
        client.set('key', 'Awesome!', () => {
          client.get('key', (err, result) => {
            response.end(result);
          });
        });
      }

      if (request.url == '/unprofiled') {
        client.set('key', 'Some value', () => {
          client.get('key', (err, result) => {
            response.end(result);
          });
        });
      }

    });
  });
});

module.exports = server;
