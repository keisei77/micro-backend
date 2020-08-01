const express = require('express');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const port = parseInt(process.env.PORT, 10) || 4000;
const dev = process.env.NODE_ENV !== 'production';
const ncovHandler = require('./route/ncov');
const weiboHandler = require('./route/weibo');
const weiboDetailHandler = require('./route/weiboDetail');
const weiboAssetsHandler = require('./route/weiboAssets');
const weiboLargeAssetsHandler = require('./route/weiboLargeAssets');
const bodyParser = require('body-parser');

function sessionCookie(req, res, next) {
  const htmlPage =
    !req.path.match(/^\/(_next|static)/) &&
    !req.path.match(/\.(js|map)$/) &&
    req.accepts('text/html', 'text/css', 'image/png') === 'text/html';

  if (!htmlPage) {
    next();
    return;
  }

  if (!req.cookies.sid || req.cookies.sid.length === 0) {
    req.cookies.sid = uuidv4();
    res.cookie('sid', req.cookies.sid);
  }

  next();
}

const sourcemapsForSentryOnly = (token) => (req, res, next) => {
  // In production we only want to serve source maps for Sentry
  if (!dev && !!token && req.headers['x-sentry-token'] !== token) {
    res
      .status(401)
      .send(
        'Authentication access token is required to access the source map.'
      );
    return;
  }
  next();
};

// app.buildId is only available after app.prepare(), hence why we setup here
const { Sentry } = require('./utils/sentry')();

const server = express();
// This attaches request information to Sentry errors

// parse application/x-www-form-urlencoded
server.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
server.use(bodyParser.json());

server
  .use(Sentry.Handlers.requestHandler())
  .use(cookieParser())
  .use(sessionCookie)
  .get(/\.map$/, sourcemapsForSentryOnly(process.env.SENTRY_DSN))
  // Regular next.js request handler
  // This handles errors if they are thrown before reaching the app
  .use(Sentry.Handlers.errorHandler());

// https://stackoverflow.com/questions/43915577/nodejs-express-heroku-cors
server.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json'
  );
  next();
});

server.get('/api/ncov', ncovHandler);
server.get('/api/weibo', weiboHandler);
server.get('/api/weibo-detail', weiboDetailHandler);
server.get('/assets', weiboAssetsHandler);
server.get('/assets-large', weiboLargeAssetsHandler);
server.listen(port, (err) => {
  if (err) {
    throw err;
  }
  // eslint-disable-next-line no-console
  console.log(`> Ready on http://localhost:${port}`);
});
