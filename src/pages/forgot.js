import { useState } from "react";
import "./forgot.css";
import image from "../assets/garage.jpg";
import { postApi } from "../utils/api";

function Forgot({ onBack, onLoginClick }) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [recoveredPassword, setRecoveredPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const toEnglishDigits = (str) => {
    return str
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
  };

  const handlePhoneChange = (e) => {
    const raw = toEnglishDigits(e.target.value);
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      setPhone("");
      return;
    }

    if (!digits.startsWith("0")) {
      return;
    }

    if (digits.length <= 11) {
      setPhone(digits);
    }
  };

  const isEmailValid = (val) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setRecoveredPassword("");

    if (!username.trim()) {
      setError("لطفاً نام کاربری را وارد کنید.");
      return;
    }

    if (!phone || phone.length < 11) {
      setError("لطفاً شماره تلفن معتبر (۱۱ رقمی با ۰) وارد کنید.");
      return;
    }

    if (!email.trim() || !isEmailValid(email)) {
      setError("فرمت ایمیل وارد شده صحیح نیست.");
      return;
    }

    setLoading(true);
    try {
      const response = await postApi("/api/auth/forgot-password", {
        username: username.trim(),
        phone,
        email: email.trim(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "اطلاعات وارد شده یافت نشد.");
      } else {
        setSuccess(data.message || "اطلاعات با موفقیت تایید شد.");
        if (data.password) {
          setRecoveredPassword(data.password);
        }
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginpage">
      <img src={image} alt="garage" className="log-img" />
      <div className="form">
        <b className="titr">بازیابی رمز عبور</b>
        <p className="log-second">لطفاً اطلاعات حساب کاربری خود را وارد کنید</p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
        {recoveredPassword && (
          <div className="success-box" style={{ fontWeight: "bold" }}>
            رمز عبور شما: {recoveredPassword}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login">
          <input
            type="text"
            placeholder="نام کاربری"
            className="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="text"
            inputMode="numeric"
            className="password"
            placeholder="شماره تلفن"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={11}
          />

          <input
            type="email"
            className="password"
            placeholder="ایمیل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {email && !isEmailValid(email) && (
            <span className="error-text">ایمیل صحیح نیست</span>
          )}

          <input
            type="button"
            value={loading ? "در حال بررسی..." : "بازیابی رمز عبور"}
            disabled={loading}
            onClick={(e) => {
              const form = e.target.closest("form");
              if (form)
                form.requestSubmit
                  ? form.requestSubmit()
                  : form.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true }),
                    );
            }}
          />
          {onLoginClick && (
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onLoginClick();
              }}
            >
              حساب کاربری دارید؟ وارد شوید
            </a>
          )}
        </form>
        {onBack && (
          <button className="backkey" onClick={onBack}>
            بازگشت به صفحه اصلی
          </button>
        )}
      </div>
    </div>
  );
}

export default Forgot;
