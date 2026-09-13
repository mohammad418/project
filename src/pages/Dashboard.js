import { useState, useEffect, useCallback, useRef } from "react";
import "./dashboard.css";
import { getApi, postApi } from "../utils/api";

const STATUS_MAP = {
  pending: { label: "در انتظار", color: "#f59e0b" },
  in_progress: { label: "در حال تعمیر", color: "#3b82f6" },
  completed: { label: "تکمیل شده", color: "#22c55e" },
  delivered: { label: "تحویل داده شده", color: "#8b5cf6" },
};

function formatMoney(n) {
  return Number(n || 0).toLocaleString("fa-IR") + " تومان";
}


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


function div(a, b) {
  return ~~(a / b);
}
function jalCal(jy) {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  let jump = 0,
    leapJ = -14,
    jp = breaks[0],
    n;
  for (let i = 1; i < breaks.length; i++) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ += div(n, 33) * 8 + div((n % 33) + 3, 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(jy + 621, 4) - div(div(jy + 621, 100) + 1, 4) * 3 - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;
  return { leap, gy: jy + 621, march };
}
function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}
function g2d(gy, gm, gd) {
  let d =
    div((gy + div(gm - 8, 6) + 100) * 1461, 4) +
    div(153 * ((gm + 9) % 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461) / 4, 1) * 5 + 308;
  const gd = div((i % 153) / 5, 1) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = j2d(jy, 1, 1);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: (k % 31) + 1 };
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: (k % 30) + 1 };
}

function todayJalali() {
  const t = new Date();
  return d2j(g2d(t.getFullYear(), t.getMonth() + 1, t.getDate()));
}

function jalaliToGregorianStr(str) {
  if (!str) return "";
  const norm = String(str)
    .replace(/[۰-۹]/g, (ch) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)))
    .replace(/[-.]/g, "/")
    .trim();
  const m = norm.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return ""; 
  const jy = Number(m[1]),
    jm = Number(m[2]),
    jd = Number(m[3]);
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return "";
  const g = d2g(j2d(jy, jm, jd));
  const p = (x) => String(x).padStart(2, "0");
  return `${g.gy}-${p(g.gm)}-${p(g.gd)}`;
}

const JALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
const JALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return jalCal(jy).leap === 0 ? 30 : 29;
}

function JalaliDatePicker({ label, value, onChange, name }) {
  const [open, setOpen] = useState(false);
  const today = todayJalali();
  const [view, setView] = useState(() => {
    if (value) {
      const g = jalaliToGregorianStr(value);
      if (g) {
        const j = d2j(g2d(...g.split("-").map(Number)));
        return { jy: j.jy, jm: j.jm };
      }
    }
    return { jy: today.jy, jm: today.jm };
  });
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const daysInMonth = jalaliMonthLength(view.jy, view.jm);
  
  const greg1 = d2g(j2d(view.jy, view.jm, 1));
  const jsDow = new Date(greg1.gy, greg1.gm - 1, greg1.gd).getDay(); 
  const offset = (jsDow + 1) % 7; 
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedJ = (() => {
    if (!value) return null;
    const g = jalaliToGregorianStr(value);
    if (!g) return null;
    return d2j(g2d(...g.split("-").map(Number)));
  })();

  const pick = (d) => {
    const p = (x) => String(x).padStart(2, "0");
    onChange(name, `${view.jy}/${p(view.jm)}/${p(d)}`);
    setOpen(false);
  };

  const prevMonth = () => {
    setView(({ jy, jm }) =>
      jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 },
    );
  };
  const nextMonth = () => {
    setView(({ jy, jm }) =>
      jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 },
    );
  };

  return (
    <label className="jdp-wrap" ref={ref}>
      {label}
      <input
        type="text"
        readOnly
        value={value}
        onClick={() => setOpen(!open)}
        placeholder="انتخاب تاریخ..."
        className="jdp-input"
      />
      {open && (
        <div className="jdp-calendar">
          <div className="jdp-head">
            <button type="button" className="jdp-nav" onClick={prevMonth}>
              ‹
            </button>
            <span className="jdp-title">
              {JALI_MONTHS[view.jm - 1]}{" "}
              {view.jy.toLocaleString("fa-IR", { useGrouping: false })}
            </span>
            <button type="button" className="jdp-nav" onClick={nextMonth}>
              ›
            </button>
          </div>
          <div className="jdp-grid jdp-weekdays">
            {JALI_WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="jdp-grid">
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                disabled={!d}
                className={
                  "jdp-day" +
                  (selectedJ &&
                  selectedJ.jy === view.jy &&
                  selectedJ.jm === view.jm &&
                  selectedJ.jd === d
                    ? " jdp-selected"
                    : "") +
                  (d &&
                  today.jy === view.jy &&
                  today.jm === view.jm &&
                  today.jd === d
                    ? " jdp-today"
                    : "")
                }
                onClick={() => pick(d)}
              >
                {d ? d.toLocaleString("fa-IR", { useGrouping: false }) : ""}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="jdp-now"
            onClick={() => {
              onChange(
                name,
                `${today.jy}/${String(today.jm).padStart(2, "0")}/${String(today.jd).padStart(2, "0")}`,
              );
              setOpen(false);
            }}
          >
            امروز
          </button>
        </div>
      )}
    </label>
  );
}

function PieChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0)
    return (
      <svg viewBox="0 0 160 160" className="pie-chart">
        <circle cx="80" cy="80" r="65" fill="#e2e8f0" />
        <text x="80" y="85" textAnchor="middle" className="pie-total">
          ۰
        </text>
      </svg>
    );

  let angle = -90;
  const cx = 80;
  const cy = 80;
  const r = 65;

  const slices = data.map((d) => {
    if (d.value === 0) return null;
    const sweep = (d.value / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const rad = (a) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(start));
    const y1 = cy + r * Math.sin(rad(start));
    const x2 = cx + r * Math.cos(rad(end));
    const y2 = cy + r * Math.sin(rad(end));
    const large = sweep > 180 ? 1 : 0;
    return (
      <path
        key={d.label}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={d.color}
      />
    );
  });

  return (
    <svg viewBox="0 0 160 160" className="pie-chart">
      {slices}
      <circle cx={cx} cy={cy} r="32" fill="#fff" />
      <text x={cx} y={cy + 5} textAnchor="middle" className="pie-total">
        {total.toLocaleString("fa-IR")}
      </text>
    </svg>
  );
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cars, setCars] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    carId: "",
    laborCost: "",
    startDate: "",
    endDate: "",
    issueDescription: "",
    status: "pending",
  });

  const loadStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await getApi("/api/reports/dashboard", token);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        return;
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
    
    setStats({
      inProgress: 0,
      pending: 0,
      completed: 0,
      delivered: 0,
      totalCustomers: 0,
      todayRevenue: 0,
      completedThisMonth: 0,
      monthlyRevenue: [],
      recentRepairs: [],
    });
  }, []);

  const loadCars = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await getApi("/api/cars", token);
      const data = await res.json();
      if (data.success) setCars(data.cars || []);
    } catch (err) {
      console.error("Failed to load cars", err);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCars();
  }, [loadStats, loadCars]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "laborCost") {
      
      const digits = value
        .replace(/[^0-9۰-۹]/g, "")
        .replace(/[۰-۹]/g, (ch) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(ch)));
      const formatted = digits ? Number(digits).toLocaleString("en-US") : "";
      setForm({ ...form, [name]: formatted, laborCostRaw: digits });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.carId) {
      setFormError("انتخاب خودرو الزامی است.");
      return;
    }
    if (!form.issueDescription.trim()) {
      setFormError("شرح تعمیرات را وارد کنید.");
      return;
    }
    if (form.startDate && !jalaliToGregorianStr(form.startDate)) {
      setFormError("تاریخ ورود شمسی معتبر نیست (نمونه صحیح: ۱۴۰۴/۰۵/۱۲).");
      return;
    }
    if (form.endDate && !jalaliToGregorianStr(form.endDate)) {
      setFormError("تاریخ خروج شمسی معتبر نیست (نمونه صحیح: ۱۴۰۴/۰۵/۲۰).");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await postApi("/api/services", {
        carId: Number(form.carId),
        issueDescription: form.issueDescription,
        status: form.status,
        estimatedCost:
          Number(form.laborCostRaw || form.laborCost.replace(/,/g, "")) || 0,
        actualCost:
          Number(form.laborCostRaw || form.laborCost.replace(/,/g, "")) || 0,
        startDate: jalaliToGregorianStr(form.startDate) || undefined,
        endDate: jalaliToGregorianStr(form.endDate) || undefined,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "خطا در ثبت تعمیرات.");
      } else {
        setShowForm(false);
        setForm({
          carId: "",
          laborCost: "",
          startDate: "",
          endDate: "",
          issueDescription: "",
          status: "pending",
        });
        loadStats();
      }
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  if (!stats)
    return (
      <div className="page-with-sidebar dashboard">در حال بارگذاری...</div>
    );

  const safe = (v) => (typeof v === "number" ? v : 0);

  const statusData = Object.keys(STATUS_MAP).map((key) => ({
    label: STATUS_MAP[key].label,
    value:
      key === "in_progress"
        ? safe(stats.inProgress)
        : key === "pending"
          ? safe(stats.pending)
          : key === "completed"
            ? safe(stats.completed)
            : safe(stats.delivered),
    color: STATUS_MAP[key].color,
  }));

  const monthly = stats.monthlyRevenue || [];
  const maxRevenue = Math.max(...monthly.map((m) => m.value), 1);

  return (
    <div className="page-with-sidebar dashboard">
      <div className="dashboard-head">
        <h2 className="dashboard-title">داشبورد</h2>
        <button
          className="add-repair-btn"
          onClick={() => setShowForm(!showForm)}
        >
          <i className="fa fa-plus"></i> ثبت تعمیر جدید
        </button>
      </div>

      {showForm && (
        <form className="repair-form" onSubmit={handleSubmit}>
          <h3>ثبت تعمیر جدید</h3>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              خودرو *
              <select name="carId" value={form.carId} onChange={handleChange}>
                <option value="">— انتخاب خودرو —</option>
                {cars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.plate_number} — {c.brand} {c.model}
                  </option>
                ))}
              </select>
            </label>
            <label>
              دستمزد (تومان)
              <input
                type="text"
                name="laborCost"
                value={form.laborCost}
                onChange={handleChange}
                placeholder="مثلاً ۵۰۰٬۰۰۰"
                inputMode="numeric"
                dir="ltr"
                style={{ textAlign: "right" }}
              />
            </label>
            <JalaliDatePicker
              label="تاریخ ورود (شمسی)"
              name="startDate"
              value={form.startDate}
              onChange={(name, val) => setForm((f) => ({ ...f, [name]: val }))}
            />
            <JalaliDatePicker
              label="تاریخ خروج (شمسی)"
              name="endDate"
              value={form.endDate}
              onChange={(name, val) => setForm((f) => ({ ...f, [name]: val }))}
            />
            <label>
              وضعیت
              <select name="status" value={form.status} onChange={handleChange}>
                {Object.keys(STATUS_MAP).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_MAP[k].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              شرح تعمیرات *
              <input
                type="text"
                name="issueDescription"
                value={form.issueDescription}
                onChange={handleChange}
                placeholder="مثلاً تعویض روغن و فیلترها"
              />
            </label>
          </div>
          <button type="submit" disabled={saving} className="submit-btn">
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </form>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#3b82f6" }}>
            <i className="fa fa-wrench"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {safe(stats.inProgress).toLocaleString("fa-IR")}
            </span>
            <span className="stat-title">خودروهای در حال تعمیر</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#22c55e" }}>
            <i className="fa fa-money"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {formatMoney(stats.todayRevenue)}
            </span>
            <span className="stat-title">درآمد امروز</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#8b5cf6" }}>
            <i className="fa fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {safe(stats.completedThisMonth).toLocaleString("fa-IR")}
            </span>
            <span className="stat-title">خودروهای تعمیر شده در ماه</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f59e0b" }}>
            <i className="fa fa-users"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {safe(stats.totalCustomers).toLocaleString("fa-IR")}
            </span>
            <span className="stat-title">تعداد کل مشتریان</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>وضعیت کلی</h3>
          <div className="status-chart">
            <PieChart data={statusData} />
            <ul className="chart-legend">
              {statusData.map((d) => (
                <li key={d.label}>
                  <span
                    className="legend-dot"
                    style={{ background: d.color }}
                  ></span>
                  {d.label} ({d.value.toLocaleString("fa-IR")})
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="chart-card">
          <h3>درآمد ماهانه</h3>
          {monthly.length === 0 ? (
            <div className="bar-chart">
              {[0, 0, 0, 0].map((v, i) => (
                <div key={i} className="bar-col">
                  <div className="bar bar-zero" style={{ height: "4px" }}></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bar-chart">
              {monthly.map((m) => (
                <div key={m.month} className="bar-col">
                  <div
                    className="bar"
                    style={{ height: `${(m.value / maxRevenue) * 100}%` }}
                    title={`${Number(m.value).toLocaleString("fa-IR")} تومان`}
                  ></div>
                  <span className="bar-label">{m.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="recent-card">
        <h3>آخرین تعمیرات</h3>
        <table className="repairs-table">
          <thead>
            <tr>
              <th>وضعیت</th>
              <th>تاریخ ورود</th>
              <th>تاریخ خروج</th>
              <th>نام مشتری</th>
              <th>پلاک</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentRepairs || []).length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  تعمیری ثبت نشده است.
                </td>
              </tr>
            ) : (
              stats.recentRepairs.map((r) => {
                const st = STATUS_MAP[r.status] || {
                  label: r.status,
                  color: "#94a3b8",
                };
                return (
                  <tr key={r.id}>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td>{toJalaliDate(r.start_date)}</td>
                    <td>{toJalaliDate(r.end_date)}</td>
                    <td>{r.customer_name || "-"}</td>
                    <td>{r.plate_number || "-"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
