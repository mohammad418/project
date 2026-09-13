const { run, get, all } = require("../db");

exports.getAllCars = async (req, res, next) => {
  try {
    const { q, customerId } = req.query;
    let sql = `
      SELECT c.*, cust.full_name as owner_name, cust.phone as owner_phone
      FROM cars c
      LEFT JOIN customers cust ON c.customer_id = cust.id
    `;
    let params = [];
    let conditions = [];

    if (customerId) {
      conditions.push("c.customer_id = ?");
      params.push(customerId);
    }

    if (q) {
      conditions.push(
        "(c.plate_number LIKE ? OR c.brand LIKE ? OR c.model LIKE ? OR cust.full_name LIKE ?)",
      );
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY c.id DESC";
    const cars = await all(sql, params);
    return res.status(200).json({ success: true, count: cars.length, cars });
  } catch (error) {
    next(error);
  }
};

exports.getCarById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const car = await get(
      `SELECT c.*, cust.full_name as owner_name, cust.phone as owner_phone
       FROM cars c
       LEFT JOIN customers cust ON c.customer_id = cust.id
       WHERE c.id = ?`,
      [id],
    );

    if (!car) {
      return res
        .status(404)
        .json({ success: false, message: "خودرو یافت نشد." });
    }

    const services = await all(
      "SELECT * FROM services WHERE car_id = ? ORDER BY id DESC",
      [id],
    );

    return res.status(200).json({
      success: true,
      car: {
        ...car,
        services,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCar = async (req, res, next) => {
  try {
    const { customerId, plateNumber, brand, model, year, color } = req.body;

    if (!plateNumber || !plateNumber.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "شماره پلاک الزامی است." });
    }

    if (!brand || !brand.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "برند خودرو الزامی است." });
    }

    if (!model || !model.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "مدل خودرو الزامی است." });
    }

    const result = await run(
      `INSERT INTO cars (customer_id, plate_number, brand, model, year, color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        customerId || null,
        plateNumber.trim(),
        brand.trim(),
        model.trim(),
        year || null,
        color || null,
      ],
    );

    const newCar = await get("SELECT * FROM cars WHERE id = ?", [result.id]);
    return res
      .status(201)
      .json({ success: true, message: "خودرو با موفقیت ثبت شد.", car: newCar });
  } catch (error) {
    next(error);
  }
};

exports.updateCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerId, plateNumber, brand, model, year, color } = req.body;

    const existing = await get("SELECT * FROM cars WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "خودرو یافت نشد." });
    }

    await run(
      `UPDATE cars
       SET customer_id = ?, plate_number = ?, brand = ?, model = ?, year = ?, color = ?
       WHERE id = ?`,
      [
        customerId !== undefined ? customerId : existing.customer_id,
        plateNumber ? plateNumber.trim() : existing.plate_number,
        brand ? brand.trim() : existing.brand,
        model ? model.trim() : existing.model,
        year !== undefined ? year : existing.year,
        color !== undefined ? color : existing.color,
        id,
      ],
    );

    const updatedCar = await get("SELECT * FROM cars WHERE id = ?", [id]);
    return res
      .status(200)
      .json({
        success: true,
        message: "اطلاعات خودرو به‌روزرسانی شد.",
        car: updatedCar,
      });
  } catch (error) {
    next(error);
  }
};

exports.deleteCar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get("SELECT * FROM cars WHERE id = ?", [id]);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "خودرو یافت نشد." });
    }

    await run("DELETE FROM cars WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "خودرو با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
};
