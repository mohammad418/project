import { useState, useEffect, useCallback, useRef } from "react";
import "./services.css";
import { getApi } from "../utils/api";

const STATUS_MAP = {
  pending: { label: "در انتظار", color: "#f59e0b" },
  in_progress: { label: "در حال تعمیر", color: "#3b82f6" },
  completed: { label: "تکمیل شده", color: "#22c55e" },
  delivered: { label: "تحویل داده شده", color: "#8b5cf6" },
};


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

const EMPTY_FORM = {
  carId: "",
  issueDescription: "",
  status: "pending",
};

function Services() {
  const [services, setServices] = useState([]);
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusMenuId, setStatusMenuId] = useState(null);
  const statusRef = useRef(null);

  const loadServices = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(
        `/api/services${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setServices(data.services || []);
    } catch (err) {
      console.error("Failed to load services", err);
      setServices([]);
    }
    setLoading(false);
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
    const t = setTimeout(() => loadServices(search), 300);
    return () => clearTimeout(t);
  }, [search, loadServices]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  
  useEffect(() => {
    if (!statusMenuId) return;
    const onDoc = (e) => {
      if (statusRef.current && !statusRef.current.contains(e.target))
        setStatusMenuId(null);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [statusMenuId]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddClick = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(!showForm);
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    setForm({
      carId: s.car_id || "",
      issueDescription: s.issue_description || "",
      status: s.status || "pending",
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`آیا از حذف تعمیر شماره «${s.id}» مطمئن هستید؟`))
      return;
    try {
      const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در حذف تعمیر.");
        return;
      }
      loadServices(search);
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    }
  };

  const handleStatusChange = async (s, newStatus) => {
    setStatusMenuId(null);
    if (newStatus === s.status) return;
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در تغییر وضعیت.");
        return;
      }
      loadServices(search);
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.issueDescription.trim()) {
      setFormError("مشکل اعلام شده الزامی است.");
      return;
    }
    setSaving(true);
    try {
      const url =
        editingId !== null ? `/api/services/${editingId}` : "/api/services";
      const res = await fetch(url, {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          carId: form.carId ? Number(form.carId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "خطا در ذخیره اطلاعات.");
      } else {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadServices(search);
      }
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  return (
    <div className="page-with-sidebar services-page">
      <h2 className="page-title">مدیریت تعمیرات</h2>

      <div className="toolbar">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="جستجو بر اساس شرح مشکل، پلاک، نام مشتری یا مکانیک..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          <i className="fa fa-plus"></i> پذیرش تعمیر جدید
        </button>
      </div>

      {showForm && (
        <form className="service-form" onSubmit={handleSubmit}>
          <h3>{editingId !== null ? "ویرایش تعمیر" : "پذیرش تعمیر جدید"}</h3>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              خودرو
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
              مشکل اعلام شده *
              <input
                type="text"
                name="issueDescription"
                value={form.issueDescription}
                onChange={handleChange}
                placeholder="مثلاً تعویض روغن و فیلترها"
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" disabled={saving} className="submit-btn">
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setShowForm(false)}
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      <div className="services-card">
        <table className="services-table">
          <thead>
            <tr>
              <th>شماره تعمیر</th>
              <th>مشکل اعلام شده</th>
              <th>تاریخ پذیرش</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  تعمیری یافت نشد.
                </td>
              </tr>
            ) : (
              services.map((s) => {
                const st = STATUS_MAP[s.status] || {
                  label: s.status,
                  color: "#94a3b8",
                };
                return (
                  <tr key={s.id}>
                    <td dir="ltr">{Number(s.id).toLocaleString("fa-IR")}</td>
                    <td>{s.issue_description}</td>
                    <td>{toJalaliDate(s.start_date)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: st.color }}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <div
                          className="status-wrap"
                          ref={statusMenuId === s.id ? statusRef : null}
                        >
                          <button
                            className="status-btn"
                            title="تغییر وضعیت"
                            onClick={() =>
                              setStatusMenuId(
                                statusMenuId === s.id ? null : s.id,
                              )
                            }
                          >
                            <i className="fa fa-refresh"></i>
                          </button>
                          {statusMenuId === s.id && (
                            <div className="status-menu">
                              {Object.keys(STATUS_MAP).map((k) => (
                                <button
                                  key={k}
                                  type="button"
                                  className={
                                    "status-option" +
                                    (k === s.status ? " active" : "")
                                  }
                                  onClick={() => handleStatusChange(s, k)}
                                >
                                  <span
                                    className="legend-dot"
                                    style={{ background: STATUS_MAP[k].color }}
                                  ></span>
                                  {STATUS_MAP[k].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          className="edit-btn"
                          title="ویرایش"
                          onClick={() => handleEdit(s)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                        <button
                          className="delete-btn"
                          title="حذف"
                          onClick={() => handleDelete(s)}
                        >
                          <i className="fa fa-trash"></i>
                        </button>
                      </div>
                    </td>
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

export default Services;
