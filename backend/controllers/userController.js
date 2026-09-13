const { run, get, all } = require("../db");
const bcrypt = require("bcryptjs");


exports.getAllUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    let sql =
      "SELECT id, username, phone, email, birth_date as birthDate, role, created_at as createdAt FROM users";
    const params = [];
    if (q) {
      sql += " WHERE username LIKE ? OR phone LIKE ? OR email LIKE ?";
      const term = `%${q}%`;
      params.push(term, term, term);
    }
    sql += " ORDER BY id DESC";
    const users = await all(sql, params);
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};


exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, phone, email, birthDate, password } = req.body;

    const existing = await get("SELECT * FROM users WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد." });
    }

    const validRoles = ["admin", "user"];
    if (role && !validRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "نقش معتبر نیست." });
    }

    if (req.user && req.user.id === Number(id) && role && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "نمی‌توانید نقش خودتان را تغییر دهید.",
      });
    }

    let hashed = existing.password;
    if (password && password.trim()) {
      if (password.trim().length < 4) {
        return res.status(400).json({
          success: false,
          message: "رمز عبور باید حداقل ۴ کاراکتر باشد.",
        });
      }
      hashed = await bcrypt.hash(password.trim(), 10);
    }

    await run(
      `UPDATE users
       SET role = ?, phone = ?, email = ?, birth_date = ?, password = ?
       WHERE id = ?`,
      [
        role !== undefined ? role : existing.role,
        phone !== undefined && phone !== ""
          ? phone.replace(/\D/g, "")
          : existing.phone,
        email !== undefined && email !== "" ? email.trim() : existing.email,
        birthDate !== undefined && birthDate !== ""
          ? birthDate
          : existing.birth_date,
        hashed,
        id,
      ],
    );

    const updated = await get(
      "SELECT id, username, phone, email, birth_date as birthDate, role, created_at as createdAt FROM users WHERE id = ?",
      [id],
    );
    return res.status(200).json({
      success: true,
      message: "اطلاعات کاربر به‌روزرسانی شد.",
      user: updated,
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get("SELECT * FROM users WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "کاربر یافت نشد." });
    }

    if (req.user && req.user.id === Number(id)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "نمی‌توانید حساب خودتان را حذف کنید.",
        });
    }

    const adminCount = await get(
      "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
    );
    if (existing.role === "admin" && adminCount.count <= 1) {
      return res.status(400).json({
        success: false,
        message: "آخرین مدیر سیستم را نمی‌توان حذف کرد.",
      });
    }

    await run("DELETE FROM users WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "کاربر با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
};
