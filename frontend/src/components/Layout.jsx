import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Layout({ children }) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
  }

  try {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      const admin = JSON.parse(storedAdmin);
      setUserRole(admin.role || "");
    }
  } catch (error) {
    console.log("ROLE ERROR:", error);
  }
  
}, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    isActive ? "sidebar-btn active" : "sidebar-btn";

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">S</div>
          <div className="brand-text">
            <h2>StoreFlow</h2>
            <span>Management System</span>
          </div>
        </div>

        <div className="sidebar-section-title">MAIN MENU</div>

        <nav className="sidebar-menu">
          <NavLink to="/dashboard" className={navClass}>
            <span className="menu-icon">🏠</span>
            <span className="menu-text">Dashboard</span>
          </NavLink>

          <NavLink to="/products" className={navClass}>
            <span className="menu-icon">📦</span>
            <span className="menu-text">Products</span>
          </NavLink>

          <NavLink to="/customers" className={navClass}>
            <span className="menu-icon">👥</span>
            <span className="menu-text">Customers</span>
          </NavLink>

          <NavLink to="/invoice" className={navClass}>
            <span className="menu-icon">🧾</span>
            <span className="menu-text">Create Invoice</span>
          </NavLink>

          <NavLink to="/invoice-history" className={navClass}>
            <span className="menu-icon">📋</span>
            <span className="menu-text">Invoice History</span>
          </NavLink>

          <NavLink to="/reports" className={navClass}>
            <span className="menu-icon">📊</span>
            <span className="menu-text">Reports</span>
          </NavLink>
        </nav>

        {userRole === "admin" && (
          <>
            <div className="sidebar-section-title admin-title">
              ADMINISTRATION
            </div>

            <nav className="sidebar-menu">
              <NavLink to="/deleted-records" className={navClass}>
                <span className="menu-icon">🗑️</span>
                <span className="menu-text">Deleted Records</span>
              </NavLink>

              <NavLink to="/user-management" className={navClass}>
                <span className="menu-icon">👤</span>
                <span className="menu-text">User Management</span>
              </NavLink>
            </nav>
          </>
        )}

        <div className="sidebar-bottom">
          <div className="logged-user">
            <div className="user-avatar">
              {userRole === "admin" ? "A" : "U"}
            </div>
            <div className="user-info">
              <strong>{userRole === "admin" ? "Admin" : "Administration"}</strong>
              <small>{userRole === "admin" ? "Full Access" : "Staff Access"}</small>
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <span>↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}

export default Layout;