// server.cjs
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Bybit Proxy Server - Operational');
});

// Proxy endpoint
app.post('/proxy', async (req, res) => {
  try {
    const { apiKey, apiSecret, endpoint, params, testnet, method } = req.body;

    const baseUrl = testnet 
      ? "https://api-testnet.bybit.com" 
      : "https://api.bybit.com";

    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(timestamp + apiKey + "5000" + endpoint + (method === "POST" ? JSON.stringify(params) : ""))
      .digest('hex');

    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'X-BYBIT-API-KEY': apiKey,
        'X-BYBIT-TIMESTAMP': timestamp,
        'X-BYBIT-SIGN': signature,
        'X-BYBIT-RECV-WINDOW': '5000',
        'Content-Type': 'application/json'
      },
      data: method === 'POST' ? params : undefined
    });

    res.json(response.data);
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: "Proxy error",
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bybit proxy running on port ${PORT}`));
