const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/call-bybit', async (req, res) => {
  try {
    const { apiKey, apiSecret, endpoint, params, testnet } = req.body;
    const baseUrl = testnet ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
    const timestamp = Date.now().toString();
    const recvWindow = 5000;
    const paramStr = new URLSearchParams({ ...params, api_key: apiKey, recv_window: recvWindow, timestamp }).toString();

    const signature = crypto.createHmac('sha256', apiSecret).update(paramStr).digest('hex');

    const fullUrl = `${baseUrl}${endpoint}?${paramStr}&sign=${signature}`;
    const response = await axios.get(fullUrl);
    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
