const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");

router.post("/signup", authController.signup);
router.post("/register", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.get("/me", authenticateToken, authController.getMe);

module.exports = router;
