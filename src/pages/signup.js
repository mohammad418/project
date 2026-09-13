import { useState } from "react";
import "./signup.css";
import image from "../assets/garage.jpg";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { postApi } from "../utils/api";

function Signup({ onBack, onLoginClick, onSignupSuccess }) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  return (
    <div className="loginpage">
      <img src={image} alt="garage" className="log-img" />
      <div className="form">
        <b className="titr">سامانه مدیریت تعمیرگاه</b>
        <p className="log-second">لطفا حساب کاربری خود را ایجاد کنید</p>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        <form
          action=""
          className="login"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setSuccess("");

            if (!username.trim()) {
              setError("لطفاً نام کاربری را وارد کنید.");
              return;
            }

            if (!phone || phone.length < 11) {
              setError("لطفاً شماره تلفن معتبر (۱۱ رقمی با ۰) وارد کنید.");
              return;
            }

            if (email && !isEmailValid(email)) {
              setError("فرمت ایمیل وارد شده صحیح نیست.");
              return;
            }

            if (!password || password.length < 4) {
              setError("رمز عبور باید حداقل ۴ کاراکتر باشد.");
              return;
            }

            if (password !== confirmPassword) {
              setError("تکرار رمز عبور با رمز عبور یکسان نمی‌باشد.");
              return;
            }

            setLoading(true);
            try {
              let formattedBirthDate = null;
              if (birthDate) {
                if (typeof birthDate === "object" && birthDate.format) {
                  formattedBirthDate = birthDate.format("YYYY/MM/DD");
                } else {
                  formattedBirthDate = String(birthDate);
                }
              }

              const response = await postApi("/api/auth/signup", {
                username: username.trim(),
                phone,
                email: email ? email.trim() : "",
                birthDate: formattedBirthDate,
                password,
              });

              const data = await response.json();

              if (!response.ok || !data.success) {
                setError(
                  data.message || "خطا در ثبت نام. لطفاً مجدداً تلاش کنید.",
                );
              } else {
                setSuccess(data.message || "ثبت نام با موفقیت انجام شد.");
                if (data.token) {
                  localStorage.setItem("token", data.token);
                }
                if (data.user) {
                  localStorage.setItem("user", JSON.stringify(data.user));
                }
                setTimeout(() => {
                  if (onSignupSuccess) {
                    onSignupSuccess(data.user);
                  } else if (onLoginClick) {
                    onLoginClick();
                  } else if (onBack) {
                    onBack();
                  }
                }, 1200);
              }
            } catch (err) {
              console.error("Signup error:", err);
              setError("خطا در برقراری ارتباط با سرور.");
            } finally {
              setLoading(false);
            }
          }}
        >
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

          <DatePicker
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            placeholder="تاریخ تولد"
            value={birthDate}
            onChange={setBirthDate}
            inputClass="password"
            containerStyle={{ width: "100%" }}
          />

          <input
            type="password"
            placeholder="رمز عبور"
            className="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            className="password"
            placeholder="تکرار رمز عبور"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {confirmPassword && password !== confirmPassword && (
            <span className="error-text">
              تکرار رمز عبور با رمز عبور یکسان نمیباشد
            </span>
          )}

          <div className="remember-box">
            <input type="checkbox" name="remember" id="remember" />
            <label htmlFor="remember">مرا به خاطر بسپار</label>
          </div>

          <input
            type="button"
            value={loading ? "در حال ثبت نام..." : "ثبت نام"}
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

export default Signup;
