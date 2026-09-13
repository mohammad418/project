import { useState, useEffect, useCallback } from "react";
import "./cars.css";
import { getApi } from "../utils/api";

const EMPTY_FORM = {
  customerId: "",
  plateNumber: "",
  brand: "",
  model: "",
  year: "",
  color: "",
};

function Cars() {
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadCars = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(
        `/api/cars${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setCars(data.cars || []);
    } catch (err) {
      console.error("Failed to load cars", err);
      setCars([]);
    }
    setLoading(false);
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await getApi("/api/customers", token);
      const data = await res.json();
      if (data.success) setCustomers(data.customers || []);
    } catch (err) {
      console.error("Failed to load customers", err);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCars(search), 300);
    return () => clearTimeout(t);
  }, [search, loadCars]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

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
      customerId: c.customer_id || "",
      plateNumber: c.plate_number || "",
      brand: c.brand || "",
      model: c.model || "",
      year: c.year || "",
      color: c.color || "",
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (c) => {
    if (
      !window.confirm(
        `آیا از حذف خودرو با پلاک «${c.plate_number}» مطمئن هستید؟`,
      )
    )
      return;
    try {
      const res = await fetch(`/api/cars/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در حذف خودرو.");
        return;
      }
      loadCars(search);
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.plateNumber.trim()) {
      setFormError("شماره پلاک الزامی است.");
      return;
    }
    if (!form.brand.trim()) {
      setFormError("برند خودرو الزامی است.");
      return;
    }
    if (!form.model.trim()) {
      setFormError("مدل خودرو الزامی است.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId !== null ? `/api/cars/${editingId}` : "/api/cars";
      const res = await fetch(url, {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customerId: form.customerId ? Number(form.customerId) : null,
          year: form.year ? Number(form.year) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "خطا در ذخیره اطلاعات.");
      } else {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadCars(search);
      }
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  return (
    <div className="page-with-sidebar cars-page">
      <h2 className="page-title">مدیریت خودروها</h2>

      <div className="toolbar">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="جستجو بر اساس پلاک، برند، مدل یا نام مالک..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          <i className="fa fa-plus"></i> افزودن خودرو
        </button>
      </div>

      {showForm && (
        <form className="car-form" onSubmit={handleSubmit}>
          <h3>{editingId !== null ? "ویرایش خودرو" : "افزودن خودرو جدید"}</h3>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              مالک (مشتری)
              <select
                name="customerId"
                value={form.customerId}
                onChange={handleChange}
              >
                <option value="">— انتخاب مشتری —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.phone})
                  </option>
                ))}
              </select>
            </label>
            <label>
              شماره پلاک *
              <input
                type="text"
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleChange}
                placeholder="مثلاً 12-ب-345"
              />
            </label>
            <label>
              برند *
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="مثلاً پژو"
              />
            </label>
            <label>
              مدل *
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="مثلاً 206"
              />
            </label>
            <label>
              سال ساخت
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                placeholder="مثلاً 1398"
              />
            </label>
            <label>
              رنگ
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleChange}
                placeholder="مثلاً سفید"
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

      <div className="cars-card">
        <table className="cars-table">
          <thead>
            <tr>
              <th>پلاک</th>
              <th>برند</th>
              <th>مدل</th>
              <th>سال ساخت</th>
              <th>رنگ</th>
              <th>مالک</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : cars.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">
                  خودرویی یافت نشد.
                </td>
              </tr>
            ) : (
              cars.map((c) => (
                <tr key={c.id}>
                  <td dir="ltr">{c.plate_number}</td>
                  <td>{c.brand}</td>
                  <td>{c.model}</td>
                  <td>{c.year || "-"}</td>
                  <td>{c.color || "-"}</td>
                  <td>{c.owner_name || "-"}</td>
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

export default Cars;
