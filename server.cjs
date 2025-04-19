const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const baseUrl = testnet
  ? "https://api-testnet.bybit.com"
  : "https://api.bybit.com";


// Free tier optimization - simpler middleware
app.use(express.json({ limit: '1mb' }));

// Health check endpoint (required for free tier)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', region: process.env.RENDER_REGION });
});

// Proxy endpoint with free tier timeout awareness
app.post('/bybit-proxy', async (req, res) => {
  try {
    // Free tier has 30s timeout - we'll set our own timeout
    const timeout = 25000; // 25s (leaving 5s buffer)
    
    const { apiKey, apiSecret, endpoint, params, testnet, method } = req.body;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

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
        'User-Agent': 'BybitProxy-FreeTier'
      },
      data: method === 'POST' ? params : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    res.json(response.data);
  } catch (error) {
    if (error.name === 'AbortError') {
      res.status(504).json({ error: "Request timeout", message: "Render free tier timeout approached" });
    } else {
      res.status(500).json({ 
        error: "Proxy error",
        message: error.message
      });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Free tier Bybit proxy running on port ${PORT}`));
