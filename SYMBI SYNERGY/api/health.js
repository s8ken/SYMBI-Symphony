// Simple health check for API testing
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SYMBI Trust Protocol API - Health Check',
    timestamp: new Date().toISOString(),
    demo: process.env.DEMO_MODE === 'true',
    environment: process.env.NODE_ENV || 'development'
  });
};