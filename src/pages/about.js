import "./about.css";
import image from "../assets/garage.jpg";

function About({ onBack, onLoginClick, onFeaturesClick }) {
  return (
    <div className="loginpage">
      <img src={image} alt="garage" className="log-img" />
      <div className="form form-about">
        <b className="titr titr-about">درباره ما</b>
        <div className="body body-about">
          ما با هدف ایجاد یک تجربه ساده، سریع و منظم برای مدیریت تعمیرگاه‌های
          خودرو، سامانه مدیریت تعمیرگاه را طراحی کرده‌ایم. این سامانه تلاش
          می‌کند فرآیندهای روزمره تعمیرگاه را از پذیرش خودرو و مدیریت اطلاعات
          مشتریان گرفته تا پیگیری روند تعمیرات، به شکلی یکپارچه و قابل مدیریت
          ارائه دهد. هدف ما این است که صاحبان تعمیرگاه و کارکنان بتوانند به جای
          استفاده از روش‌های سنتی و پراکنده، اطلاعات موردنیاز خود را در یک محیط
          منظم در اختیار داشته باشند و با سرعت و دقت بیشتری امور تعمیرگاه را
          مدیریت کنند. این سامانه با تمرکز بر سادگی، نظم، دسترسی آسان و مدیریت
          بهتر اطلاعات طراحی شده و در ادامه نیز قابلیت توسعه و اضافه شدن امکانات
          جدید را خواهد داشت. برای آشنایی با تمام امکانات و قابلیت‌های سامانه
          می‌توانید از صفحه «<a href="#features" onClick={(e) => { e.preventDefault(); if (onFeaturesClick) onFeaturesClick(); }}>امکانات</a>» دیدن کنید.
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

export default About;
