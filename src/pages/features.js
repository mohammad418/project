import "./features.css";
import image from "../assets/garage.jpg";

function Features({ onBack, onFeatureClick }) {
  return (
    <div className="loginpage">
      <img src={image} alt="garage" className="log-img" />
      <div className="form form-features">
        <b className="titr titr-features">امکانات سامانه</b>
        <div className="body body-features">
          <ul className="features-list">
            <li>
              <a
                href="#customers"
                className="feature-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onFeatureClick) onFeatureClick("customers");
                }}
              >
                <b>مدیریت مشتریان:</b>
              </a>{" "}
              افزودن، ویرایش و پیگیری اطلاعات مشتریان
            </li>
            <li>
              <a
                href="#cars"
                className="feature-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onFeatureClick) onFeatureClick("cars");
                }}
              >
                <b>مدیریت خودروها:</b>
              </a>{" "}
              ثبت و مدیریت اطلاعات خودروهای مشتریان
            </li>
            <li>
              <a
                href="#services"
                className="feature-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onFeatureClick) onFeatureClick("services");
                }}
              >
                <b>تعمیرات و خدمات:</b>
              </a>{" "}
              ثبت تعمیرات، هزینه‌ها و پیگیری وضعیت خدمات
            </li>
            <li>
              <a
                href="#parts"
                className="feature-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onFeatureClick) onFeatureClick("parts");
                }}
              >
                <b>مدیریت قطعات:</b>
              </a>{" "}
              کنترل موجودی قطعات و لوازم یدکی
            </li>
            <li>
              <a
                href="#invoices"
                className="feature-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onFeatureClick) onFeatureClick("invoices");
                }}
              >
                <b>فاکتورها و گزارش‌ها:</b>
              </a>{" "}
              صدور فاکتور و مشاهده گزارش‌های مالی
            </li>
          </ul>
        </div>

        {onBack && (
          <button className="backkey" onClick={onBack}>
            بازگشت به صفحه اصلی
          </button>
        )}
      </div>
    </div>
  );
}

export default Features;
