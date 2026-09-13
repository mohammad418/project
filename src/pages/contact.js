import "./contact.css";
import image from "../assets/garage.jpg";

function Contact({ onBack }) {
  return (
    <div className="loginpage">
      <img src={image} alt="garage" className="log-img" />
      <div className="form form-contact">
        <b className="titr titr-contact">تماس با ما</b>
        <div className="body body-contact"></div>
        <p>
          از اینکه بازدید از سایت ما منجر به تمایل شما برای تماس با ما بوده است
          بسیار خرسندیم.
        </p>
        <b>تلفن:09111111111</b>
        
        {onBack && (
          <button className="backkey" onClick={onBack}>
            بازگشت به صفحه اصلی
          </button>
        )}
      </div>
    </div>
  );
}

export default Contact;
