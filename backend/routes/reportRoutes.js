const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { all, get } = require("../db");

router.get("/summary", invoiceController.getSummaryReport);


router.get("/range", async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const params = [];
    const conditions = [];

    if (from) {
      conditions.push("date(created_at) >= date(?)");
      params.push(from);
    }
    if (to) {
      conditions.push("date(created_at) <= date(?)");
      params.push(to);
    }
    const where =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    
    const daily = await all(
      `SELECT date(created_at) as day, SUM(final_amount) as total, COUNT(*) as count
       FROM invoices ${where}
       GROUP BY day ORDER BY day`,
      params,
    );

    
    const totals = await get(
      `SELECT COUNT(*) as count, SUM(final_amount) as total
       FROM invoices ${where}`,
      params,
    );

    
    const paidConditions = [...conditions, "payment_status = 'paid'"];
    const paid = await get(
      `SELECT COUNT(*) as count, SUM(final_amount) as total FROM invoices WHERE ${paidConditions.join(" AND ")}`,
      params,
    );

    const count = totals.count || 0;
    const totalRevenue = paid.total || 0;
    const paidCount = paid.count || 0;

    return res.status(200).json({
      success: true,
      report: {
        totalInvoices: count,
        totalRevenue,
        paidCount,
        unpaidCount: count - paidCount,
        
        averageInvoice:
          paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0,
        
        averageInvoiceAll:
          count > 0 ? Math.round((totals.total || 0) / count) : 0,
        daily,
      },
    });
  } catch (error) {
    next(error);
  }
});


router.get("/dashboard", async (req, res, next) => {
  try {
    const inProgress = await get(
      "SELECT COUNT(*) as count FROM services WHERE status = 'in_progress'",
    );
    const pending = await get(
      "SELECT COUNT(*) as count FROM services WHERE status = 'pending'",
    );
    const completed = await get(
      "SELECT COUNT(*) as count FROM services WHERE status = 'completed'",
    );
    const delivered = await get(
      "SELECT COUNT(*) as count FROM services WHERE status = 'delivered'",
    );
    const totalCustomers = await get("SELECT COUNT(*) as count FROM customers");

    
    const todayRevenue = await get(
      "SELECT SUM(final_amount) as total FROM invoices WHERE payment_status = 'paid' AND date(created_at) = date('now', 'localtime')",
    );

    
    const completedThisMonth = await get(
      "SELECT COUNT(*) as count FROM services WHERE status IN ('completed','delivered') AND strftime('%Y-%m', end_date) = strftime('%Y-%m', 'now', 'localtime')",
    );

    
    const monthly = await all(
      `SELECT strftime('%Y-%m', created_at) as ym, SUM(final_amount) as total
       FROM invoices WHERE payment_status = 'paid'
         AND created_at >= date('now', 'localtime', '-5 months', 'start of month')
       GROUP BY ym ORDER BY ym`,
    );

    
    const recentRepairs = await all(
      `SELECT s.id, s.status, s.start_date, s.end_date,
              cust.full_name as customer_name,
              c.plate_number
       FROM services s
       LEFT JOIN cars c ON s.car_id = c.id
       LEFT JOIN customers cust ON s.customer_id = cust.id
       ORDER BY s.id DESC LIMIT 10`,
    );

    return res.status(200).json({
      success: true,
      stats: {
        inProgress: inProgress.count,
        pending: pending.count,
        completed: completed.count,
        delivered: delivered.count,
        totalCustomers: totalCustomers.count,
        todayRevenue: todayRevenue.total || 0,
        completedThisMonth: completedThisMonth.count,
        monthlyRevenue: monthly.map((m) => ({
          month: m.ym,
          value: m.total || 0,
        })),
        recentRepairs,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
