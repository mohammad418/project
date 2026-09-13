const { run, get, all } = require("../db");

exports.getAllInvoices = async (req, res, next) => {
  try {
    const { customerId, paymentStatus, q } = req.query;
    let sql = `
      SELECT i.*, cust.full_name as customer_name, cust.phone as customer_phone
      FROM invoices i
      LEFT JOIN customers cust ON i.customer_id = cust.id
    `;
    let params = [];
    let conditions = [];

    if (customerId) {
      conditions.push("i.customer_id = ?");
      params.push(customerId);
    }

    if (paymentStatus) {
      conditions.push("i.payment_status = ?");
      params.push(paymentStatus);
    }

    if (q) {
      conditions.push("(cust.full_name LIKE ? OR i.id LIKE ?)");
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY i.id DESC";
    const invoices = await all(sql, params);
    return res
      .status(200)
      .json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    next(error);
  }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await get(
      `SELECT i.*, cust.full_name as customer_name, cust.phone as customer_phone, cust.national_id, cust.address
       FROM invoices i
       LEFT JOIN customers cust ON i.customer_id = cust.id
       WHERE i.id = ?`,
      [id],
    );

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "فاکتور یافت نشد." });
    }

    const items = await all(
      `SELECT ii.*, p.name as part_name, p.code as part_code
       FROM invoice_items ii
       LEFT JOIN parts p ON ii.part_id = p.id
       WHERE ii.invoice_id = ?`,
      [id],
    );

    let serviceInfo = null;
    if (invoice.service_id) {
      serviceInfo = await get(
        `SELECT s.*, c.plate_number, c.brand, c.model
         FROM services s
         LEFT JOIN cars c ON s.car_id = c.id
         WHERE s.id = ?`,
        [invoice.service_id],
      );
    }

    return res.status(200).json({
      success: true,
      invoice: {
        ...invoice,
        items,
        service: serviceInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const {
      customerId,
      serviceId,
      items = [],
      discount = 0,
      tax = 0,
      paymentStatus = "unpaid",
      paymentMethod,
    } = req.body;

    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, message: "شناسه مشتری الزامی است." });
    }

    let calculatedTotal = 0;
    for (const item of items) {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      calculatedTotal += qty * price;
    }

    const finalAmount = calculatedTotal - (discount || 0) + (tax || 0);

    const result = await run(
      `INSERT INTO invoices (customer_id, service_id, total_amount, discount, tax, final_amount, payment_status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        serviceId || null,
        calculatedTotal,
        discount || 0,
        tax || 0,
        finalAmount,
        paymentStatus,
        paymentMethod || null,
      ],
    );

    const invoiceId = result.id;

    for (const item of items) {
      const qty = item.quantity || 1;
      const price = item.unitPrice || 0;
      const totalPrice = qty * price;

      await run(
        `INSERT INTO invoice_items (invoice_id, part_id, description, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          item.partId || null,
          item.description || null,
          qty,
          price,
          totalPrice,
        ],
      );

      if (item.partId) {
        await run(
          "UPDATE parts SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?",
          [qty, item.partId],
        );
      }
    }

    const createdInvoice = await get("SELECT * FROM invoices WHERE id = ?", [
      invoiceId,
    ]);
    return res
      .status(201)
      .json({
        success: true,
        message: "فاکتور جدید با موفقیت صادر شد.",
        invoice: createdInvoice,
      });
  } catch (error) {
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, discount, tax } = req.body;

    const existing = await get("SELECT * FROM invoices WHERE id = ?", [id]);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "فاکتور یافت نشد." });
    }

    const newDiscount = discount !== undefined ? discount : existing.discount;
    const newTax = tax !== undefined ? tax : existing.tax;
    const newFinalAmount = existing.total_amount - newDiscount + newTax;

    await run(
      `UPDATE invoices
       SET payment_status = ?, payment_method = ?, discount = ?, tax = ?, final_amount = ?
       WHERE id = ?`,
      [
        paymentStatus !== undefined ? paymentStatus : existing.payment_status,
        paymentMethod !== undefined ? paymentMethod : existing.payment_method,
        newDiscount,
        newTax,
        newFinalAmount,
        id,
      ],
    );

    const updatedInvoice = await get("SELECT * FROM invoices WHERE id = ?", [
      id,
    ]);
    return res
      .status(200)
      .json({
        success: true,
        message: "وضعیت فاکتور به‌روزرسانی شد.",
        invoice: updatedInvoice,
      });
  } catch (error) {
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await get("SELECT * FROM invoices WHERE id = ?", [id]);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "فاکتور یافت نشد." });
    }

    await run("DELETE FROM invoices WHERE id = ?", [id]);
    return res
      .status(200)
      .json({ success: true, message: "فاکتور با موفقیت حذف شد." });
  } catch (error) {
    next(error);
  }
};

exports.getSummaryReport = async (req, res, next) => {
  try {
    const customersCount = await get("SELECT COUNT(*) as count FROM customers");
    const carsCount = await get("SELECT COUNT(*) as count FROM cars");
    const activeServices = await get(
      "SELECT COUNT(*) as count FROM services WHERE status != 'completed' AND status != 'cancelled'",
    );
    const totalServices = await get("SELECT COUNT(*) as count FROM services");
    const totalRevenue = await get(
      "SELECT SUM(final_amount) as total FROM invoices WHERE payment_status = 'paid'",
    );
    const unpaidRevenue = await get(
      "SELECT SUM(final_amount) as total FROM invoices WHERE payment_status = 'unpaid'",
    );
    const lowStockParts = await get(
      "SELECT COUNT(*) as count FROM parts WHERE stock_quantity <= min_stock",
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalCustomers: customersCount.count,
        totalCars: carsCount.count,
        activeRepairs: activeServices.count,
        totalRepairs: totalServices.count,
        totalRevenue: totalRevenue.total || 0,
        unpaidRevenue: unpaidRevenue.total || 0,
        lowStockPartsCount: lowStockParts.count,
      },
    });
  } catch (error) {
    next(error);
  }
};
