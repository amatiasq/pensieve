const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const port = process.env.PORT;

if (!port) {
  throw new Error('Environment variables not set');
}

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.json({ limit: '50mb', type: 'text/plain' }));

app.post('/auth', require('./auth'));
app.post('/commit', require('./commit'));

app.listen(port, () =>
  console.log(`Hello world app listening on port ${port}!`),
);
