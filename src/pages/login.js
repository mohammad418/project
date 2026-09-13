import { useState } from "react";
import "./login.css";
import image from "../assets/garage.jpg";
import { postApi } from "../utils/api";

function Login({ onBack, onSignupClick, onForgetClick, onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!username.trim() || !password) {
      setError("لطفاً نام کاربری و رمز عبور را وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const response = await postApi("/api/auth/login", {
        username: username.trim(),
        password: password,
        remember: remember,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "رمز یا نام کاربری اشتباه است");
      } else {
        setSuccess(data.message || "ورود با موفقیت انجام شد.");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(data.user);
          } else if (onBack) {
            onBack();
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("خطا در برقراری ارتباط با سرور.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginpage">
      <img src={image} alt="garage" className="log-img" />
      <div className="form">
        <b className="titr">سامانه مدیریت تعمیرگاه</b>
        <p className="log-second">لطفا وارد حساب کاربری خود شوید</p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form onSubmit={handleSubmit} className="login">
          <input
            type="text"
            placeholder="نام کاربری"
            className="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="رمز عبور"
            className="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="remember-box">
            <input
              type="checkbox"
              name="remember"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">مرا به خاطر بسپار</label>
          </div>
          <input
            type="button"
            value={loading ? "در حال بررسی..." : "ورود"}
            disabled={loading}
            onClick={handleSubmit}
          />
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              if (onForgetClick) onForgetClick();
            }}
          >
            رمز عبور را فراموش کرده اید؟
          </a>
          <a
            href="#signup"
            onClick={(e) => {
              e.preventDefault();
              if (onSignupClick) onSignupClick();
            }}
          >
            حساب ندارید؟ثبت نام کنید
          </a>
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

export default Login;
