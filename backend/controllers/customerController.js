const { run, get, all } = require("../db");

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { q } = req.query;
    let sql = "SELECT * FROM customers";
    let params = [];

    if (q) {
      sql += " WHERE full_name LIKE ? OR phone LIKE ? OR national_id LIKE ?";
      const searchTerm = `%${q}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }

    sql += " ORDER BY id DESC";
    const customers = await all(sql, params);
    return res
      .status(200)
      .json({ success: true, count: customers.length, customers });
  } catch (error) {
    next(error);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const customer = await get("SELECT * FROM customers WHERE id = ?", [id]);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "مشتری یافت نشد." });
    }

    const cars = await all("SELECT * FROM cars WHERE customer_id = ?", [id]);
    const invoices = await all("SELECT * FROM invoices WHERE customer_id = ?", [
      id,
    ]);
    const services = await all("SELECT * FROM services WHERE customer_id = ?", [
      id,
    ]);

    return res.status(200).json({
      success: true,
      customer: {
        ...customer,
        cars,
        invoices,
        services,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCustomer = async (req, res, next) => {
  try {
    const { fullName, phone, email, nationalId, address } = req.body;

    if (!fullName || !fullName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "نام و نام خانوادگی الزامی است." });
    }

    if (!phone || !phone.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "شماره تلفن الزامی است." });
    }

    const result = await run(
      `INSERT INTO customers (full_name, phone, email, national_id, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        fullName.trim(),
        phone.trim(),
        email || null,
        nationalId || null,
        address || null,
      ],
    );

    const newCustomer = await get("SELECT * FROM customers WHERE id = ?", [
      result.id,
    ]);
    return res
      .status(201)
      .json({
        success: true,
        message: "مشتری با موفقیت تعریف شد.",
        customer: newCustomer,
      });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, email, nationalId, address } = req.body;

    const existing = await get("SELECT * FROM customers WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "مشتری یافت نشد." });
    }

    await run(
      `UPDATE customers
       SET full_name = ?, phone = ?, email = ?, national_id = ?, address = ?
       WHERE id = ?`,
      [
        fullName ? fullName.trim() : existing.full_name,
        phone ? phone.trim() : existing.phone,
        email !== undefined ? email : existing.email,
        nationalId !== undefined ? nationalId : existing.national_id,
        address !== undefined ? address : existing.address,
        id,
      ],
    );

    const updatedCustomer = await get("SELECT * FROM customers WHERE id = ?", [
      id,
    ]);
    return res
      .status(200)
      .json({
        success: true,
        message: "اطلاعات مشتری به‌روزرسانی شد.",
        customer: updatedCustomer,
      });
  } catch (error) {
    next(error);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get("SELECT * FROM customers WHERE id = ?", [id]);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "مشتری یافت نشد." });
    }

    await run("DELETE FROM customers WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "مشتری با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
};
