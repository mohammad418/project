import { useState, useEffect, useCallback } from "react";
import "./customers.css";
import { getApi, postApi } from "../utils/api";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  email: "",
  nationalId: "",
  address: "",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadCustomers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(
        `/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } catch (err) {
      console.error("Failed to load customers", err);
      setCustomers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search, loadCustomers]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddClick = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(!showForm);
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setForm({
      fullName: c.full_name || "",
      phone: c.phone || "",
      email: c.email || "",
      nationalId: c.national_id || "",
      address: c.address || "",
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`آیا از حذف مشتری «${c.full_name}» مطمئن هستید؟`))
      return;
    try {
      const res = await fetch(`/api/customers/${c.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در حذف مشتری.");
        return;
      }
      loadCustomers(search);
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.fullName.trim()) {
      setFormError("نام و نام خانوادگی الزامی است.");
      return;
    }
    if (!form.phone.trim()) {
      setFormError("شماره تلفن الزامی است.");
      return;
    }
    setSaving(true);
    try {
      const url =
        editingId !== null ? `/api/customers/${editingId}` : "/api/customers";
      const res = await fetch(url, {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "خطا در ذخیره اطلاعات.");
      } else {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadCustomers(search);
      }
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  return (
    <div className="page-with-sidebar customers-page">
      <h2 className="page-title">مدیریت مشتریان</h2>

      <div className="toolbar">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="جستجو بر اساس نام، تلفن یا کد ملی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          <i className="fa fa-plus"></i> افزودن مشتری
        </button>
      </div>

      {showForm && (
        <form className="customer-form" onSubmit={handleSubmit}>
          <h3>{editingId !== null ? "ویرایش مشتری" : "افزودن مشتری جدید"}</h3>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              نام و نام خانوادگی *
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="مثلاً علی رضایی"
              />
            </label>
            <label>
              شماره تلفن *
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="مثلاً 09121234567"
              />
            </label>
            <label>
              ایمیل
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@mail.com"
              />
            </label>
            <label>
              کد ملی
              <input
                type="text"
                name="nationalId"
                value={form.nationalId}
                onChange={handleChange}
                placeholder="کد ملی ۱۰ رقمی"
              />
            </label>
            <label className="full-width">
              آدرس
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="آدرس محل سکونت"
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

      <div className="customers-card">
        <table className="customers-table">
          <thead>
            <tr>
              <th>نام و نام خانوادگی</th>
              <th>شماره تلفن</th>
              <th>ایمیل</th>
              <th>کد ملی</th>
              <th>آدرس</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-row">
                  مشتری‌ای یافت نشد.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.full_name}</td>
                  <td dir="ltr">{c.phone}</td>
                  <td dir="ltr">{c.email || "-"}</td>
                  <td dir="ltr">{c.national_id || "-"}</td>
                  <td>{c.address || "-"}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="edit-btn"
                        title="ویرایش"
                        onClick={() => handleEdit(c)}
                      >
                        <i className="fa fa-pencil"></i>
                      </button>
                      <button
                        className="delete-btn"
                        title="حذف"
                        onClick={() => handleDelete(c)}
                      >
                        <i className="fa fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Customers;
