import "./sidebar.css";
import logo from "../assets/garage.png";

function Sidebar({ activePage, onNavigate, onLogout, onHome }) {
  const items = [
    { key: "dashboard", label: "داشبورد", icon: "fa-home" },
    { key: "featureCustomers", label: "مشتریان", icon: "fa-users" },
    { key: "featureCars", label: "خودروها", icon: "fa-car" },
    { key: "featureServices", label: "تعمیرات", icon: "fa-wrench" },
    { key: "featureParts", label: "قطعات", icon: "fa-cogs" },
    { key: "featureInvoices", label: "فاکتور ها", icon: "fa-file-text-o" },
    { key: "reports", label: "گزارش ها", icon: "fa-bar-chart" },
    { key: "users", label: "کاربران", icon: "fa-user-circle-o" },
  ];

  return (
    <aside className="sidebar">
      <div
        className="sidebar-header"
        onClick={onHome}
        title="بازگشت به صفحه اصلی"
      >
        <img src={logo} alt="لوگو" className="sidebar-logo" />
        <span className="sidebar-title">سامانه مدیریت تعمیرگاه خودرو</span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${activePage === item.key ? "active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            <i className={`fa ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        ))}
        <button className="sidebar-item sidebar-logout" onClick={onLogout}>
          <i className="fa fa-sign-out"></i>
          <span>خروج</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
