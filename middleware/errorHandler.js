export default function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: err.message || 'Server error' });
}