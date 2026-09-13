import { useState, useEffect, useCallback } from "react";
import "./reports.css";
import { getApi } from "../utils/api";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const formatNumber = (v) =>
  v === null || v === undefined || v === ""
    ? "-"
    : Number(v).toLocaleString("fa-IR");

const toJalali = (day) => {
  if (!day) return "-";
  try {
    return new DateObject(new Date(day))
      .convert(persian, persian_fa)
      .format("YYYY/MM/DD");
  } catch (e) {
    return day;
  }
};


const jalaliToGregorian = (dateObj) => {
  if (!dateObj) return null;
  try {
    return dateObj.convert("gregorian", "en").format("YYYY-MM-DD");
  } catch (e) {
    return null;
  }
};

const EMPTY_REPORT = {
  totalInvoices: 0,
  totalRevenue: 0,
  paidCount: 0,
  unpaidCount: 0,
  averageInvoice: 0,
  averageInvoiceAll: 0,
  daily: [],
};

function Reports() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [report, setReport] = useState(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async (fromG, toG) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (fromG) params.set("from", fromG);
      if (toG) params.set("to", toG);
      const qs = params.toString();
      const res = await getApi(
        `/api/reports/range${qs ? `?${qs}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setReport({ ...EMPTY_REPORT, ...data.report });
    } catch (err) {
      console.error("Failed to load report", err);
      setReport(EMPTY_REPORT);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => loadReport(jalaliToGregorian(from), jalaliToGregorian(to)),
      250,
    );
    return () => clearTimeout(t);
  }, [from, to, loadReport]);

  const maxDaily = Math.max(1, ...report.daily.map((d) => d.total || 0));

  const resetFilter = () => {
    setFrom(null);
    setTo(null);
  };

  return (
    <div className="page-with-sidebar reports-page">
      <h2 className="page-title">گزارش ها</h2>

      <div className="reports-toolbar">
        <div className="date-filter">
          <label className="date-field">
            <span>از تاریخ:</span>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              placeholder="انتخاب تاریخ شروع"
              value={from}
              onChange={setFrom}
              inputClass="date-input"
              containerStyle={{ width: "180px" }}
            />
          </label>
          <label className="date-field">
            <span>تا تاریخ:</span>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-left"
              placeholder="انتخاب تاریخ پایان"
              value={to}
              onChange={setTo}
              inputClass="date-input"
              containerStyle={{ width: "180px" }}
            />
          </label>
          <button className="reset-btn" onClick={resetFilter}>
            <i className="fa fa-refresh"></i> همه تاریخ‌ها
          </button>
        </div>
        <div className="range-info">
          {from || to ? (
            <span>
              بازه: {toJalali(from ? from.toDate() : null)} تا{" "}
              {toJalali(to ? to.toDate() : null)}
            </span>
          ) : (
            <span>نمایش همه فاکتورها</span>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#2563eb" }}>
            <i className="fa fa-files-o"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {loading ? "..." : formatNumber(report.totalInvoices)}
            </span>
            <span className="stat-title">کل فاکتورها</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#22c55e" }}>
            <i className="fa fa-money"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {loading ? "..." : `${formatNumber(report.totalRevenue)} تومان`}
            </span>
            <span className="stat-title">کل درآمد (پرداخت‌شده)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f59e0b" }}>
            <i className="fa fa-line-chart"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {loading ? "..." : `${formatNumber(report.averageInvoice)} تومان`}
            </span>
            <span className="stat-title">میانگین هر فاکتور</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#8b5cf6" }}>
            <i className="fa fa-hourglass-half"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {loading
                ? "..."
                : `${formatNumber(report.averageInvoiceAll)} تومان`}
            </span>
            <span className="stat-title">میانگین همه فاکتورها</span>
          </div>
        </div>
      </div>

      <div className="chart-card">
        <h3>نمودار درآمد روزانه</h3>
        {loading ? (
          <div className="chart-empty">در حال بارگذاری...</div>
        ) : report.daily.length === 0 ? (
          <div className="chart-empty">در این بازه فاکتوری ثبت نشده است.</div>
        ) : (
          <div className="bar-chart">
            {report.daily.map((d) => (
              <div className="bar-col" key={d.day}>
                <span className="bar-value num" dir="ltr">
                  {formatNumber(d.total)}
                </span>
                <div
                  className="bar"
                  style={{
                    height: `${Math.max(6, ((d.total || 0) / maxDaily) * 100)}%`,
                  }}
                  title={`${toJalali(d.day)} — ${formatNumber(d.count)} فاکتور`}
                ></div>
                <span className="bar-label">{toJalali(d.day)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chart-card summary-card">
        <h3>خلاصه بازه</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">فاکتورهای پرداخت‌شده</span>
            <span className="summary-value" style={{ color: "#22c55e" }}>
              {formatNumber(report.paidCount)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">فاکتورهای پرداخت‌نشده</span>
            <span className="summary-value" style={{ color: "#ef4444" }}>
              {formatNumber(report.unpaidCount)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">تعداد روزهای دارای فاکتور</span>
            <span className="summary-value">
              {formatNumber(report.daily.length)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">بیشترین درآمد روزانه</span>
            <span className="summary-value">
              {formatNumber(
                maxDaily === 1 && report.daily.length === 0 ? 0 : maxDaily,
              )}{" "}
              تومان
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
