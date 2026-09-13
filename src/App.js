import { useState, useEffect } from "react";
import "./App.css";
import MainPage from "./pages/mainpage";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Forgot from "./pages/forgot";
import About from "./pages/about";
import Features from "./pages/features";
import Customers from "./pages/customers";
import Cars from "./pages/cars";
import Services from "./pages/services";
import Parts from "./pages/parts";
import Invoices from "./pages/invoices";
import Contact from "./pages/contact";
import Dashboard from "./pages/Dashboard";
import Placeholder from "./pages/Placeholder";
import Reports from "./pages/reports";
import Users from "./pages/users";
import Sidebar from "./components/Sidebar";

function App() {
  const [page, setPage] = useState("main");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setPage("main");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setPage("main");
  };

  const sidebarPages = [
    "dashboard",
    "featureCustomers",
    "featureCars",
    "featureServices",
    "featureParts",
    "featureInvoices",
    "reports",
    "users",
    "settings",
  ];

  const handleFeatureClick = (key) => {
    if (!currentUser) {
      alert("برای استفاده از امکانات وارد سیستم شوید");
      setPage("login");
      return;
    }
    setPage(`feature${key.charAt(0).toUpperCase() + key.slice(1)}`);
  };

  return (
    <div className="App">
      {page === "main" ? (
        <MainPage
          currentUser={currentUser}
          onLogout={handleLogout}
          onLoginClick={() => setPage("login")}
          onAboutClick={() => setPage("about")}
          onFeaturesClick={() => setPage("features")}
          onContactClick={() => setPage("contact")}
          onFeatureClick={handleFeatureClick}
        />
      ) : page === "signup" ? (
        <Signup
          onBack={() => setPage("main")}
          onLoginClick={() => setPage("login")}
          onSignupSuccess={handleLoginSuccess}
        />
      ) : page === "forgot" || page === "forget" ? (
        <Forgot
          onBack={() => setPage("main")}
          onLoginClick={() => setPage("login")}
        />
      ) : page === "about" ? (
        <About
          onBack={() => setPage("main")}
          onLoginClick={() => setPage("login")}
          onFeaturesClick={() => setPage("features")}
        />
      ) : page === "features" ? (
        <Features
          onBack={() => setPage("main")}
          onFeatureClick={handleFeatureClick}
        />
      ) : sidebarPages.includes(page) ? (
        <div className="layout-with-sidebar">
          <Sidebar
            activePage={page}
            onNavigate={setPage}
            onLogout={handleLogout}
            onHome={() => setPage("main")}
          />
          <div className="sidebar-content">
            {page === "dashboard" && <Dashboard />}
            {page === "featureCustomers" && <Customers />}
            {page === "featureCars" && <Cars />}
            {page === "featureServices" && <Services />}
            {page === "featureParts" && <Parts />}
            {page === "featureInvoices" && <Invoices />}
            {page === "reports" && <Reports />}
            {page === "users" && <Users />}
          </div>
        </div>
      ) : page === "contact" ? (
        <Contact onBack={() => setPage("main")} />
      ) : (
        <Login
          onBack={() => setPage("main")}
          onSignupClick={() => setPage("signup")}
          onForgetClick={() => setPage("forgot")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

export default App;
