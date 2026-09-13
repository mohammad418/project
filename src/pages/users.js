import { useState, useEffect, useCallback } from "react";
import "./users.css";
import { getApi } from "../utils/api";

const ROLE_MAP = {
  admin: { label: "مدیر", color: "#8b5cf6" },
  user: { label: "کاربر", color: "#3b82f6" },
};

const EMPTY_FORM = {
  username: "",
  phone: "",
  email: "",
  birthDate: "",
  role: "user",
  password: "",
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

function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      return null;
    }
  })();

  const loadUsers = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await getApi(
        `/api/users${q ? `?q=${encodeURIComponent(q)}` : ""}`,
        token,
      );
      const data = await res.json();
      if (data.success) setUsers(data.users || []);
    } catch (err) {
      console.error("Failed to load users", err);
      setUsers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadUsers(search), 300);
    return () => clearTimeout(t);
  }, [search, loadUsers]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleEdit = (u) => {
    setEditingId(u.id);
    setForm({
      username: u.username || "",
      phone: u.phone || "",
      email: u.email || "",
      birthDate: u.birthDate || "",
      role: u.role || "user",
      password: "",
    });
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`آیا از حذف کاربر «${u.username}» مطمئن هستید؟`))
      return;
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "خطا در حذف کاربر.");
        return;
      }
      loadUsers(search);
    } catch (err) {
      alert("خطا در ارتباط با سرور.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const body = {
        role: form.role,
        phone: form.phone,
        email: form.email,
        birthDate: form.birthDate,
      };
      if (form.password.trim()) body.password = form.password.trim();

      const res = await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "خطا در ذخیره اطلاعات.");
      } else {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadUsers(search);
      }
    } catch (err) {
      setFormError("خطا در ارتباط با سرور.");
    }
    setSaving(false);
  };

  return (
    <div className="page-with-sidebar users-page">
      <h2 className="page-title">مدیریت کاربران</h2>

      <div className="toolbar">
        <div className="search-box">
          <i className="fa fa-search"></i>
          <input
            type="text"
            placeholder="جستجو بر اساس نام کاربری، تلفن یا ایمیل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {showForm && editingId !== null && (
        <form className="user-form" onSubmit={handleSubmit}>
          <h3>ویرایش کاربر: {form.username}</h3>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-grid">
            <label>
              نقش
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="user">کاربر</option>
                <option value="admin">مدیر</option>
              </select>
            </label>
            <label>
              شماره تلفن
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                dir="ltr"
              />
            </label>
            <label>
              ایمیل
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                dir="ltr"
              />
            </label>
            <label>
              تاریخ تولد
              <input
                type="text"
                name="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                placeholder="مثلاً ۱۳۷۰/۰۱/۰۱"
              />
            </label>
            <label>
              رمز عبور جدید (اختیاری)
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="برای تغییر رمز پر کنید"
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

      <div className="users-card">
        <table className="users-table">
          <thead>
            <tr>
              <th>#</th>
              <th>نام کاربری</th>
              <th>شماره تلفن</th>
              <th>ایمیل</th>
              <th>تاریخ تولد</th>
              <th>نقش</th>
              <th>تاریخ عضویت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  در حال بارگذاری...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-row">
                  کاربری یافت نشد.
                </td>
              </tr>
            ) : (
              users.map((u, idx) => {
                const role = ROLE_MAP[u.role] || {
                  label: u.role,
                  color: "#94a3b8",
                };
                const isSelf = currentUser && currentUser.id === u.id;
                return (
                  <tr key={u.id} className={isSelf ? "self-row" : ""}>
                    <td>{formatNumber(idx + 1)}</td>
                    <td>
                      {u.username}
                      {isSelf && <span className="self-tag">(شما)</span>}
                    </td>
                    <td dir="ltr">{u.phone || "-"}</td>
                    <td dir="ltr">{u.email || "-"}</td>
                    <td>{u.birthDate || "-"}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: role.color }}
                      >
                        {role.label}
                      </span>
                    </td>
                    <td>{toJalaliDate(u.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="edit-btn"
                          title="ویرایش"
                          onClick={() => handleEdit(u)}
                        >
                          <i className="fa fa-pencil"></i>
                        </button>
                        <button
                          className="delete-btn"
                          title="حذف"
                          disabled={isSelf}
                          onClick={() => handleDelete(u)}
                          style={
                            isSelf
                              ? { opacity: 0.4, cursor: "not-allowed" }
                              : {}
                          }
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

export default Users;
