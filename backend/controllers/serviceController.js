const { run, get, all } = require("../db");

exports.getAllServices = async (req, res, next) => {
  try {
    const { status, carId, customerId, q } = req.query;
    let sql = `
      SELECT s.*,
             c.plate_number, c.brand, c.model,
             cust.full_name as customer_name, cust.phone as customer_phone
      FROM services s
      LEFT JOIN cars c ON s.car_id = c.id
      LEFT JOIN customers cust ON s.customer_id = cust.id
    `;
    let params = [];
    let conditions = [];

    if (status) {
      conditions.push("s.status = ?");
      params.push(status);
    }

    if (carId) {
      conditions.push("s.car_id = ?");
      params.push(carId);
    }

    if (customerId) {
      conditions.push("s.customer_id = ?");
      params.push(customerId);
    }

    if (q) {
      conditions.push(
        "(s.issue_description LIKE ? OR s.mechanic_name LIKE ? OR c.plate_number LIKE ? OR cust.full_name LIKE ?)",
      );
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY s.id DESC";
    const services = await all(sql, params);
    return res
      .status(200)
      .json({ success: true, count: services.length, services });
  } catch (error) {
    next(error);
  }
};

exports.getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await get(
      `SELECT s.*,
              c.plate_number, c.brand, c.model, c.year, c.color,
              cust.full_name as customer_name, cust.phone as customer_phone
       FROM services s
       LEFT JOIN cars c ON s.car_id = c.id
       LEFT JOIN customers cust ON s.customer_id = cust.id
       WHERE s.id = ?`,
      [id],
    );

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "سفارش تعمیر یافت نشد." });
    }

    const invoice = await get("SELECT * FROM invoices WHERE service_id = ?", [
      id,
    ]);

    return res.status(200).json({
      success: true,
      service: {
        ...service,
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
  try {
    const {
      carId,
      customerId,
      issueDescription,
      status,
      estimatedCost,
      mechanicName,
      startDate,
    } = req.body;

    if (!issueDescription || !issueDescription.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "شرح ایراد/خدمات الزامی است." });
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && carId) {
      const car = await get("SELECT customer_id FROM cars WHERE id = ?", [
        carId,
      ]);
      if (car) resolvedCustomerId = car.customer_id;
    }

    const result = await run(
      `INSERT INTO services (car_id, customer_id, issue_description, status, estimated_cost, mechanic_name, start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        carId || null,
        resolvedCustomerId || null,
        issueDescription.trim(),
        status || "pending",
        estimatedCost || 0,
        mechanicName || null,
        startDate || new Date().toISOString().split("T")[0],
      ],
    );

    const newService = await get("SELECT * FROM services WHERE id = ?", [
      result.id,
    ]);
    return res
      .status(201)
      .json({
        success: true,
        message: "سفارش تعمیر با موفقیت ثبت شد.",
        service: newService,
      });
  } catch (error) {
    next(error);
  }
};

exports.updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      carId,
      customerId,
      issueDescription,
      status,
      estimatedCost,
      actualCost,
      mechanicName,
      startDate,
      endDate,
    } = req.body;

    const existing = await get("SELECT * FROM services WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "سفارش تعمیر یافت نشد." });
    }

    await run(
      `UPDATE services
       SET car_id = ?, customer_id = ?, issue_description = ?, status = ?,
           estimated_cost = ?, actual_cost = ?, mechanic_name = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [
        carId !== undefined ? carId : existing.car_id,
        customerId !== undefined ? customerId : existing.customer_id,
        issueDescription !== undefined
          ? issueDescription.trim()
          : existing.issue_description,
        status !== undefined ? status : existing.status,
        estimatedCost !== undefined ? estimatedCost : existing.estimated_cost,
        actualCost !== undefined ? actualCost : existing.actual_cost,
        mechanicName !== undefined ? mechanicName : existing.mechanic_name,
        startDate !== undefined ? startDate : existing.start_date,
        endDate !== undefined ? endDate : existing.end_date,
        id,
      ],
    );

    const updatedService = await get("SELECT * FROM services WHERE id = ?", [
      id,
    ]);
    return res
      .status(200)
      .json({
        success: true,
        message: "وضعیت تعمیرات به روز شد.",
        service: updatedService,
      });
  } catch (error) {
    next(error);
  }
};

exports.deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get("SELECT * FROM services WHERE id = ?", [id]);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "سفارش تعمیر یافت نشد." });
    }

    await run("DELETE FROM services WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "سفارش تعمیر با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
};
