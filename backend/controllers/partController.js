const { run, get, all } = require("../db");

exports.getAllParts = async (req, res, next) => {
  try {
    const { q, category, lowStock } = req.query;
    let sql = "SELECT * FROM parts";
    let params = [];
    let conditions = [];

    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (lowStock === "true") {
      conditions.push("stock_quantity <= min_stock");
    }

    if (q) {
      conditions.push("(name LIKE ? OR code LIKE ? OR category LIKE ?)");
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY id DESC";
    const parts = await all(sql, params);
    return res.status(200).json({ success: true, count: parts.length, parts });
  } catch (error) {
    next(error);
  }
};

exports.getPartById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const part = await get("SELECT * FROM parts WHERE id = ?", [id]);

    if (!part) {
      return res
        .status(404)
        .json({ success: false, message: "قطعه یافت نشد." });
    }

    return res.status(200).json({ success: true, part });
  } catch (error) {
    next(error);
  }
};

exports.createPart = async (req, res, next) => {
  try {
    const { name, code, category, unitPrice, stockQuantity, minStock } =
      req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "نام قطعه الزامی است." });
    }

    if (code && code.trim()) {
      const existingCode = await get("SELECT * FROM parts WHERE code = ?", [
        code.trim(),
      ]);
      if (existingCode) {
        return res
          .status(400)
          .json({ success: false, message: "کد قطعه تکراری است." });
      }
    }

    const result = await run(
      `INSERT INTO parts (name, code, category, unit_price, stock_quantity, min_stock)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        code ? code.trim() : `P-${Date.now().toString().slice(-6)}`,
        category ? category.trim() : null,
        unitPrice || 0,
        stockQuantity !== undefined ? stockQuantity : 0,
        minStock !== undefined ? minStock : 5,
      ],
    );

    const newPart = await get("SELECT * FROM parts WHERE id = ?", [result.id]);
    return res
      .status(201)
      .json({
        success: true,
        message: "قطعه جدید با موفقیت اضافه شد.",
        part: newPart,
      });
  } catch (error) {
    next(error);
  }
};

exports.updatePart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, category, unitPrice, stockQuantity, minStock } =
      req.body;

    const existing = await get("SELECT * FROM parts WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "قطعه یافت نشد." });
    }

    if (code && code.trim() !== existing.code) {
      const existingCode = await get(
        "SELECT * FROM parts WHERE code = ? AND id != ?",
        [code.trim(), id],
      );
      if (existingCode) {
        return res
          .status(400)
          .json({ success: false, message: "کد قطعه تکراری است." });
      }
    }

    await run(
      `UPDATE parts
       SET name = ?, code = ?, category = ?, unit_price = ?, stock_quantity = ?, min_stock = ?
       WHERE id = ?`,
      [
        name !== undefined ? name.trim() : existing.name,
        code !== undefined ? code.trim() : existing.code,
        category !== undefined ? category.trim() : existing.category,
        unitPrice !== undefined ? unitPrice : existing.unit_price,
        stockQuantity !== undefined ? stockQuantity : existing.stock_quantity,
        minStock !== undefined ? minStock : existing.min_stock,
        id,
      ],
    );

    const updatedPart = await get("SELECT * FROM parts WHERE id = ?", [id]);
    return res
      .status(200)
      .json({
        success: true,
        message: "اطلاعات قطعه به روز رسانی شد.",
        part: updatedPart,
      });
  } catch (error) {
    next(error);
  }
};

exports.deletePart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get("SELECT * FROM parts WHERE id = ?", [id]);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "قطعه یافت نشد." });
    }

    await run("DELETE FROM parts WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "قطعه با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
};
