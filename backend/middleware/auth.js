const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "garage_secret_key_1403";

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        message: "توکن امنیتی یافت نشد. لطفا وارد شوید.",
      });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "توکن نامعتبر یا منقضی شده است." });
    }
    req.user = user;
    next();
  });
}

function optionalToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalToken,
  JWT_SECRET,
};
