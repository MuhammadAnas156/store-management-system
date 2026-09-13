import { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/api/admin/login", {
        email,
        password,
      });

      const loggedInUser = response.data.admin;

      if (loggedInUser.role !== role) {
        alert(`This account is not registered as ${role}.`);
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("admin", JSON.stringify(response.data.admin));

      alert("Login successful!");
      window.location.href = "/dashboard";
    } catch (error) {
      console.log("LOGIN ERROR:", error);
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="brand-logo-big">S</div>
        <h2>StoreFlow</h2>
        <p>
          Manage your inventory, invoices, customers and reports — all in one
          place.
        </p>
      </div>

      <div className="login-form-panel">
        <div className="login-card">
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to continue to your dashboard.</p>

          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn admin ${role === "admin" ? "active" : ""}`}
              onClick={() => setRole("admin")}
            >
              Admin
            </button>

            <button
              type="button"
              className={`role-btn administration ${
                role === "administration" ? "active" : ""
              }`}
              onClick={() => setRole("administration")}
            >
              Administration
            </button>
          </div>

          <p className="login-role-note">
            Logging in as <strong>{role === "admin" ? "Admin" : "Administration"}</strong>
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%" }}>
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;