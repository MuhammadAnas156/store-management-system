import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

function UserManagement() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "administration",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const token = localStorage.getItem("token");

  const storedAdmin = localStorage.getItem("admin");
  let currentUserId = "";

  try {
    if (storedAdmin) {
      const admin = JSON.parse(storedAdmin);
      currentUserId = admin.id || "";
    }
  } catch (error) {
    console.log("ADMIN PARSE ERROR:", error);
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(response.data);
    } catch (error) {
      console.log("GET USERS ERROR:", error);
      alert(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "administration" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
        };

        if (form.password) {
          payload.password = form.password;
        }

        const response = await axios.put(
          `${API_URL}/api/admin/users/${editingId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert(response.data.message);
      } else {
        const response = await axios.post(
          `${API_URL}/api/admin/register`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert(response.data.message);
      }

      resetForm();
      fetchUsers();
    } catch (error) {
      console.log("SAVE USER ERROR:", error);
      alert(error.response?.data?.message || "Failed to save user");
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleView = (userId) => {
    setExpandedId(expandedId === userId ? null : userId);
  };

  const deleteUser = async (userId) => {
    if (userId === currentUserId) {
      alert("You cannot delete your own account.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user? This will move them to Deleted Records."
    );
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));

      if (editingId === userId) resetForm();
      if (expandedId === userId) setExpandedId(null);
    } catch (error) {
      console.log("DELETE USER ERROR:", error);
      alert(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <>
      <div className="page-header">
        <p className="page-label">ACCESS CONTROL</p>
        <h1>User Management</h1>
        <p className="page-subtitle">
          Create, view, edit and remove Admin and Administration accounts.
        </p>
      </div>

      <div className={`form-panel ${editingId ? "editing" : ""}`}>
        <h2>{editingId ? "Edit User" : "Create New User"}</h2>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Enter name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              {editingId ? "New password (optional)" : "Password"}
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
              value={form.password}
              onChange={handleChange}
              required={!editingId}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" value={form.role} onChange={handleChange}>
              <option value="administration">Administration</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? "Update user" : "Create user"}
            </button>

            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-panel">
        <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 750, color: "var(--color-ink)" }}>
          All Users
        </h2>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <strong>Loading users...</strong>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <strong>No users found</strong>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user, index) => (
                <>
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td className="cell-strong">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-pill ${user.role}`}>
                        {user.role === "admin" ? "Admin" : "Administration"}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => toggleView(user._id)}
                        >
                          {expandedId === user._id ? "Hide" : "View"}
                        </button>

                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => startEdit(user)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => deleteUser(user._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === user._id && (
                    <tr className="user-detail-row">
                      <td colSpan={6}>
                        <p>
                          <strong>Full name:</strong> {user.name}
                        </p>
                        <p>
                          <strong>Email:</strong> {user.email}
                        </p>
                        <p>
                          <strong>Role:</strong>{" "}
                          {user.role === "admin" ? "Admin" : "Administration"}
                        </p>
                        <p>
                          <strong>Joined:</strong>{" "}
                          {new Date(user.createdAt).toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default UserManagement;