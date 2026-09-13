const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { run, get } = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const isEmailValid = (val) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
};

exports.signup = async (req, res, next) => {
  try {
    const { username, phone, email, birthDate, password } = req.body;

    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً نام کاربری را وارد کنید." });
    }

    if (!phone || !phone.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً شماره تلفن را وارد کنید." });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("0") || cleanPhone.length < 11) {
      return res
        .status(400)
        .json({ success: false, message: "شماره تلفن معتبر نیست." });
    }

    if (email && !isEmailValid(email)) {
      return res
        .status(400)
        .json({ success: false, message: "فرمت ایمیل صحیح نیست." });
    }

    if (!password || password.length < 4) {
      return res
        .status(400)
        .json({
          success: false,
          message: "رمز عبور باید حداقل ۴ کاراکتر باشد.",
        });
    }

    const existingUser = await get(
      "SELECT * FROM users WHERE username = ? OR phone = ? OR (email = ? AND email IS NOT NULL AND email != '')",
      [username.trim(), cleanPhone, email ? email.trim() : ""],
    );

    if (existingUser) {
      if (existingUser.username === username.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "نام کاربری قبلاً ثبت شده است." });
      }
      if (existingUser.phone === cleanPhone) {
        return res
          .status(400)
          .json({ success: false, message: "شماره تلفن قبلاً ثبت شده است." });
      }
      if (email && existingUser.email === email.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "ایمیل قبلاً ثبت شده است." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (username, password, phone, email, birth_date, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username.trim(),
        hashedPassword,
        cleanPhone,
        email ? email.trim() : null,
        birthDate || null,
        "user",
      ],
    );

    const newUser = {
      id: result.id,
      username: username.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      birthDate: birthDate || null,
      role: "user",
    };

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.status(201).json({
      success: true,
      message: "ثبت نام با موفقیت انجام شد.",
      user: newUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password, remember } = req.body;

    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً نام کاربری را وارد کنید." });
    }

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً رمز عبور را وارد کنید." });
    }

    const user = await get("SELECT * FROM users WHERE username = ?", [
      username.trim(),
    ]);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "رمز یا نام کاربری اشتباه است" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "رمز یا نام کاربری اشتباه است" });
    }

    const expiresIn = remember ? "30d" : "1d";
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      {
        expiresIn,
      },
    );

    const userProfile = {
      id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email,
      birthDate: user.birth_date,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      user: userProfile,
      token,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { username, email, phone, newPassword } = req.body;

    if (!username || !username.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً نام کاربری را وارد کنید." });
    }

    if (!phone || !phone.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً شماره تلفن را وارد کنید." });
    }

    if (!email || !email.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "لطفاً ایمیل را وارد کنید." });
    }

    const cleanPhone = phone.replace(/\D/g, "");

    const user = await get(
      "SELECT * FROM users WHERE username = ? AND phone = ? AND email = ?",
      [username.trim(), cleanPhone, email.trim()],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "کاربری با این مشخصات (نام کاربری، ایمیل و شماره تلفن) یافت نشد.",
      });
    }

    const targetPassword =
      newPassword && newPassword.trim() ? newPassword.trim() : "123456";
    const hashedPassword = await bcrypt.hash(targetPassword, 10);

    await run("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      user.id,
    ]);

    return res.status(200).json({
      success: true,
      message: "اطلاعات بازیابی با موفقیت تایید شد.",
      password: targetPassword,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await get(
      "SELECT id, username, phone, email, birth_date as birthDate, role, created_at as createdAt FROM users WHERE id = ?",
      [req.user.id],
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد." });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
