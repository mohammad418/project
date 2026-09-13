import { useState, useEffect, useCallback, useRef } from "react";
import "./invoices.css";
import { getApi } from "../utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAYMENT_MAP = {
  paid: { label: "پرداخت شده", color: "#22c55e" },
  unpaid: { label: "پرداخت نشده", color: "#ef4444" },
  partial: { label: "پرداخت جزئی", color: "#f59e0b" },
};

const formatNumber = (v) =>
  v === null || v === undefined || v === ""
    ? "-"
    : Number(v).toLocaleString("fa-IR");

function toJalaliDate(str) {
  if (!str) return "-";
  const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return str;
  try {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch (e) {
    return str;
  }
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const invoiceRef = useRef(null);

  const loadInvoices = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(
        `/api/invoices${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setInvoices(data.invoices || []);
    } catch (err) {
      console.error("Failed to load invoices", err);
      setInvoices([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadInvoices(search), 300);
    return () => clearTimeout(t);
  }, [search, loadInvoices]);

  const openDetail = async (inv) => {
    setSelected(inv);
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(`/api/invoices/${inv.id}`, token);
      const data = await res.json();
      if (data.success) setSelected(data.invoice);
    } catch (err) {
      console.error("Failed to load invoice detail", err);
    }
    setDetailLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * pageW) / canvas.width;
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pageW,
        Math.min(imgH, pdf.internal.pageSize.getHeight()),
      );
      pdf.save(`invoice-${selected?.id || ""}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("خطا در تولید فایل PDF.");
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelected(null);
  };

  return (
    <div className="page-with-sidebar invoices-page">
      <h2 className="page-title">مدیریت فاکتورها</h2>

      <div className="toolbar">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="جستجو بر اساس نام مشتری یا شماره فاکتور..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="invoices-card">
        <table className="invoices-table">
          <thead>
            <tr>
              <th>شماره فاکتور</th>
              <th>مشتری</th>
              <th>تاریخ</th>
              <th>مبلغ نهایی</th>
              <th>وضعیت پرداخت</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  فاکتوری یافت نشد.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const pay = PAYMENT_MAP[inv.payment_status] || {
                  label: inv.payment_status,
                  color: "#94a3b8",
                };
                return (
                  <tr
                    key={inv.id}
                    className="invoice-row"
                    onClick={() => openDetail(inv)}
                  >
                    <td dir="ltr">{formatNumber(inv.id)}</td>
                    <td>{inv.customer_name || "-"}</td>
                    <td>{toJalaliDate(inv.created_at)}</td>
                    <td>{formatNumber(inv.final_amount)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: pay.color }}
                      >
                        {pay.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showDetail && selected && (
        <div className="invoice-modal-overlay" onClick={closeDetail}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="invoice-modal-loading">در حال بارگذاری...</div>
            ) : (
              <>
                <div className="invoice-modal-actions no-print">
                  <button className="pdf-btn" onClick={handlePdf}>
                    <i className="fa fa-file-pdf-o"></i> خروجی PDF
                  </button>
                  <button className="print-btn" onClick={handlePrint}>
                    <i className="fa fa-print"></i> چاپ فاکتور
                  </button>
                  <button
                    className="close-btn"
                    title="بستن"
                    onClick={closeDetail}
                  >
                    <i className="fa fa-times"></i>
                  </button>
                </div>

                <div className="invoice-sheet" ref={invoiceRef} dir="rtl">
                  <header className="invoice-header">
                    <h2>فاکتور فروش خدمات و قطعات</h2>
                    <p>تعمیرگاه گاراژ</p>
                  </header>

                  <div className="invoice-meta">
                    <div>
                      <span className="meta-label">شماره فاکتور:</span>
                      <span dir="ltr">{formatNumber(selected.id)}</span>
                    </div>
                    <div>
                      <span className="meta-label">تاریخ صدور:</span>
                      <span>{toJalaliDate(selected.created_at)}</span>
                    </div>
                    <div>
                      <span className="meta-label">وضعیت پرداخت:</span>
                      <span>
                        {(PAYMENT_MAP[selected.payment_status] || {}).label ||
                          selected.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="invoice-parties">
                    <div className="party-box">
                      <h4>اطلاعات مشتری</h4>
                      <p>
                        <span className="meta-label">نام:</span>{" "}
                        {selected.customer_name || "-"}
                      </p>
                      <p>
                        <span className="meta-label">تلفن:</span>{" "}
                        <span dir="ltr" className="num">
                          {selected.customer_phone || "-"}
                        </span>
                      </p>
                      <p>
                        <span className="meta-label">کد ملی:</span>{" "}
                        <span dir="ltr" className="num">
                          {selected.national_id || "-"}
                        </span>
                      </p>
                      <p>
                        <span className="meta-label">آدرس:</span>{" "}
                        {selected.address || "-"}
                      </p>
                    </div>
                    {selected.service && (
                      <div className="party-box">
                        <h4>اطلاعات تعمیر</h4>
                        <p>
                          <span className="meta-label">خودرو:</span>{" "}
                          {selected.service.brand} {selected.service.model}{" "}
                          (پلاک{" "}
                          <span dir="ltr" className="num">
                            {selected.service.plate_number}
                          </span>
                          )
                        </p>
                        <p>
                          <span className="meta-label">شرح تعمیر:</span>{" "}
                          {selected.service.issue_description}
                        </p>
                        <p>
                          <span className="meta-label">مکانیک:</span>{" "}
                          {selected.service.mechanic_name || "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  <table className="invoice-items-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>شرح</th>
                        <th>تعداد</th>
                        <th>قیمت واحد</th>
                        <th>جمع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.items || []).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty-row">
                            قلمی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        (selected.items || []).map((it, idx) => (
                          <tr key={it.id || idx}>
                            <td>{formatNumber(idx + 1)}</td>
                            <td>
                              {it.description || it.part_name || "-"}
                              {it.part_code ? (
                                <span className="item-code">
                                  {" "}
                                  ({it.part_code})
                                </span>
                              ) : null}
                            </td>
                            <td>{formatNumber(it.quantity)}</td>
                            <td>{formatNumber(it.unit_price)}</td>
                            <td>{formatNumber(it.total_price)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="invoice-totals">
                    <div className="totals-row">
                      <span>جمع کل:</span>
                      <span className="num">
                        {formatNumber(selected.total_amount)} تومان
                      </span>
                    </div>
                    <div className="totals-row">
                      <span>تخفیف:</span>
                      <span className="num">
                        {formatNumber(selected.discount)} تومان
                      </span>
                    </div>
                    <div className="totals-row">
                      <span>مالیات:</span>
                      <span className="num">
                        {formatNumber(selected.tax)} تومان
                      </span>
                    </div>
                    <div className="totals-row final">
                      <span>مبلغ قابل پرداخت:</span>
                      <span className="num">
                        {formatNumber(selected.final_amount)} تومان
                      </span>
                    </div>
                  </div>

                  <footer className="invoice-footer">
                    <p>امضای مشتری</p>
                    <p>امضا و مهر تعمیرگاه</p>
                  </footer>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Invoices;
