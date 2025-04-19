const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.send('Bybit Proxy Server is running');
});

// Main proxy endpoint
app.post('/', async (req, res) => {
  try {
    const { apiKey, apiSecret, endpoint, params, testnet, method } = req.body;
    
    // Validate required fields
    if (!apiKey || !apiSecret || !endpoint || !method) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Determine Bybit API URL
    const baseUrl = testnet ? 
      "https://api-testnet.bybit.com" : 
      "https://api.bybit.com";

    // Prepare request
    const timestamp = Date.now().toString();
    const recvWindow = "5000";
    
    // Generate signature
    const queryString = method === 'GET' ? 
      `?${new URLSearchParams(params).toString()}` : '';
    const payload = timestamp + apiKey + recvWindow + endpoint + queryString + 
                   (method === 'POST' ? JSON.stringify(params) : '');
    
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(payload)
      .digest('hex');

    // Forward request to Bybit
    const config = {
      method: method,
      url: `${baseUrl}${endpoint}${queryString}`,
      headers: {
        'X-BYBIT-API-KEY': apiKey,
        'X-BYBIT-TIMESTAMP': timestamp,
        'X-BYBIT-SIGN': signature,
        'X-BYBIT-RECV-WINDOW': recvWindow,
        'Content-Type': 'application/json'
      },
      data: method === 'POST' ? params : undefined
    };

    const bybitResponse = await axios(config);
    res.json(bybitResponse.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: "Proxy error",
      message: error.message,
      details: error.response?.data || null 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bybit proxy server running on port ${PORT}`);
});
