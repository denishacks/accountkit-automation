require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const socket = require('./socket');
const request  = require('request');

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/callback', (req, res) => {
  if (!req.query.code) {
    res.statusCode = 400;
    res.send('');
    return;
  }

  const appAccessToken = ['AA', process.env.APP_ID, process.env.APP_SECRET].join('|');
  const url = `https://graph.accountkit.com/${process.env.API_VERSION}/access_token?grant_type=authorization_code&code=${req.query.code}&access_token=${appAccessToken}`;
  request.get({url, json: true, timeout: 10000}, function(err, resp, body) {
    if (err || body.error) {
      console.error(err || body.error.message);
      res.statusCode = 400;
      res.send('');
      return;
    }

    const url = `https://graph.accountkit.com/${process.env.API_VERSION}/me?access_token=${body.access_token}`;
    request.get({url, json:true, timeout: 10000 }, (err, resp, body) => {
      if (err || body.error) {
        console.error(err || body.error.message);
        res.statusCode = 400;
        res.send('');
        return;
      }

      res.redirect(`/success?phone=${body.phone.number}`);
    });
  });
});

app.get('/success', (req, res) => {
  res.send('');
});

socket(server);

server.listen(3000, () => console.log('Server is listening on port 3000'));
