// Debug API endpoint
module.exports = (req, res) => {
  res.status(200).json({
    message: 'YCQ Sonate Debug Endpoint',
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    headers: req.headers,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DEMO_MODE: process.env.DEMO_MODE
    }
  });
};