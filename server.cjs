// server.js - Updated for better region handling
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Add regional endpoint
app.post('/bybit-api', async (req, res) => {
  try {
    const { apiKey, apiSecret, endpoint, params, testnet, method } = req.body;
    
    // Block US-East requests at the proxy level
    if (process.env.RENDER_REGION === 'us-east') {
      return res.status(403).json({ 
        error: "US region blocked for Bybit access",
        solution: "Redeploy in Singapore or Germany" 
      });
    }

    const baseUrl = testnet 
      ? "https://api-testnet.bybit.com" 
      : "https://api.bybit.com";

    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(timestamp + apiKey + "5000" + endpoint + (method === 'POST' ? JSON.stringify(params) : ''))
      .digest('hex');

    const response = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      headers: {
        'X-BYBIT-API-KEY': apiKey,
        'X-BYBIT-TIMESTAMP': timestamp,
        'X-BYBIT-SIGN': signature,
        'X-BYBIT-RECV-WINDOW': '5000',
        'User-Agent': `BybitProxy/${process.env.RENDER_REGION || 'local'}`
      },
      data: params
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ 
      error: "Proxy error",
      region: process.env.RENDER_REGION,
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bybit proxy running in ${process.env.RENDER_REGION || 'unknown'} region`));
