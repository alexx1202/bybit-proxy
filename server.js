const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const BASE_URL = "https://api-testnet.bybit.com"; // or "https://api.bybit.com" for live

app.post("/proxy", async (req, res) => {
  try {
    const { method, path, headers, body } = req.body;
    const url = `${BASE_URL}${path}`;
    const response = await axios({
      method,
      url,
      headers,
      data: body || {}
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
      details: err.response?.data
    });
  }
});

app.get("/", (req, res) => res.send("Bybit Proxy is running."));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy server running on ${port}`));
