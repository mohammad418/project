function errorHandler(err, req, res, next) {
  console.error("Server Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "خطای داخلی سرور رخ داده است.",
  });
}

module.exports = errorHandler;
