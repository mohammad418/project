import { useState, useEffect, useCallback } from "react";
import "./parts.css";
import { getApi } from "../utils/api";

const EMPTY_FORM = {
  name: "",
  code: "",
  category: "",
  unitPrice: "",
  stockQuantity: "",
  minStock: "5",
};

const formatNumber = (v) =>
  v === null || v === undefined || v === ""
    ? "-"
    : Number(v).toLocaleString("fa-IR");

function Parts() {
  const [parts, setParts] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadParts = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(
        `/api/parts${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setParts(data.parts || []);
    } catch (err) {
      console.error("Failed to load parts", err);
      setParts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadParts(search), 300);
    return () => clearTimeout(t);
  }, [search, loadParts]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddClick = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(!showForm);
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      code: p.code || "",
      category: p.category || "",
      unitPrice: p.unit_price ?? "",
      stockQuantity: p.stock_quantity ?? "",
      minStock: p.min_stock ?? "5",
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`آیا از حذف قطعه «${p.name}» مطمئن هستید؟`)) return;
    try {
      const res = await fetch(`/api/parts/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در حذف قطعه.");
        return;
      }
      loadParts(search);
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim()) {
      setFormError("نام قطعه الزامی است.");
      return;
    }
    setSaving(true);
    try {
      const url = editingId !== null ? `/api/parts/${editingId}` : "/api/parts";
      const res = await fetch(url, {
        method: editingId !== null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          category: form.category,
          unitPrice: form.unitPrice === "" ? 0 : Number(form.unitPrice),
          stockQuantity:
            form.stockQuantity === "" ? 0 : Number(form.stockQuantity),
          minStock: form.minStock === "" ? 5 : Number(form.minStock),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "خطا در ذخیره اطلاعات.");
      } else {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadParts(search);
      }
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  return (
    <div className="page-with-sidebar parts-page">
      <h2 className="page-title">مدیریت قطعات</h2>

      <div className="toolbar">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="جستجو بر اساس نام، کد یا دسته‌بندی قطعه..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={handleAddClick}>
          <i className="fa fa-plus"></i> افزودن قطعه
        </button>
      </div>

      {showForm && (
        <form className="part-form" onSubmit={handleSubmit}>
          <h3>{editingId !== null ? "ویرایش قطعه" : "افزودن قطعه جدید"}</h3>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              نام قطعه *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثلاً روغن موتور ۴ لیتری"
              />
            </label>
            <label>
              کد قطعه
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="مثلاً P-101"
                dir="ltr"
              />
            </label>
            <label>
              دسته‌بندی
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="مثلاً روغن و سیالات"
              />
            </label>
            <label>
              قیمت (تومان)
              <input
                type="number"
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                min="0"
                dir="ltr"
              />
            </label>
            <label>
              موجودی
              <input
                type="number"
                name="stockQuantity"
                value={form.stockQuantity}
                onChange={handleChange}
                min="0"
                dir="ltr"
              />
            </label>
            <label>
              حداقل موجودی
              <input
                type="number"
                name="minStock"
                value={form.minStock}
                onChange={handleChange}
                min="0"
                dir="ltr"
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

      <div className="parts-card">
        <table className="parts-table">
          <thead>
            <tr>
              <th>نام قطعه</th>
              <th>کد قطعه</th>
              <th>قیمت</th>
              <th>موجودی</th>
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
            ) : parts.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  قطعه‌ای یافت نشد.
                </td>
              </tr>
            ) : (
              parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td dir="ltr">{p.code || "-"}</td>
                  <td>{formatNumber(p.unit_price)}</td>
                  <td
                    className={
                      p.stock_quantity <= p.min_stock ? "low-stock" : ""
                    }
                  >
                    {formatNumber(p.stock_quantity)}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="edit-btn"
                        title="ویرایش"
                        onClick={() => handleEdit(p)}
                      >
                        <i className="fa fa-pencil"></i>
                      </button>
                      <button
                        className="delete-btn"
                        title="حذف"
                        onClick={() => handleDelete(p)}
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

export default Parts;
