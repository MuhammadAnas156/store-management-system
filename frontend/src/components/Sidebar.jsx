import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();

  const adminData = JSON.parse(
    localStorage.getItem("admin") || "{}"
  );

  const isAdmin = adminData.role === "admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <div className="brand-icon">S</div>

        <div>
          <h2>StoreFlow</h2>
          <span>Management System</span>
        </div>
      </div>

      <nav className="sidebar-menu">

        <p className="menu-title">MAIN MENU</p>

        <NavLink to="/dashboard" className="sidebar-link">
          <span>▦</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/products" className="sidebar-link">
          <span>▣</span>
          <span>Products</span>
        </NavLink>

        <NavLink to="/customers" className="sidebar-link">
          <span>♙</span>
          <span>Customers</span>
        </NavLink>

        <NavLink to="/invoice" className="sidebar-link">
          <span>＋</span>
          <span>Create Invoice</span>
        </NavLink>

        <NavLink to="/invoice-history" className="sidebar-link">
          <span>▤</span>
          <span>Invoice History</span>
        </NavLink>

        <NavLink to="/reports" className="sidebar-link">
          <span>◒</span>
          <span>Reports</span>
        </NavLink>

        {isAdmin && (
          <>
            <p className="menu-title admin-menu-title">
              ADMINISTRATION
            </p>

            <NavLink
              to="/deleted-records"
              className="sidebar-link"
            >
              <span>♲</span>
              <span>Deleted Records</span>
            </NavLink>

            <NavLink
              to="/user-management"
              className="sidebar-link"
            >
              <span>♙</span>
              <span>User Management</span>
            </NavLink>
          </>
        )}

      </nav>

      <div className="sidebar-bottom">

        <div className="user-box">
          <div className="user-avatar">
            {adminData.name
              ? adminData.name.charAt(0).toUpperCase()
              : "A"}
          </div>

          <div className="user-info">
            <strong>
              {adminData.name || "Admin"}
            </strong>

            <span>
              {isAdmin
                ? "Administrator"
                : "Administration"}
            </span>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;