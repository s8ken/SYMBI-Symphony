// Simple test API endpoint
module.exports = (req, res) => {
  res.json({
    success: true,
    message: 'SYMBI Trust Protocol API Test',
    timestamp: new Date().toISOString(),
    demo: true
  });
};