import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

function Customer() {
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const token = localStorage.getItem("token");

  const storedAdmin = localStorage.getItem("admin");
  let userRole = "";

  try {
    if (storedAdmin) {
      const admin = JSON.parse(storedAdmin);
      userRole = admin.role || "";
    }
  } catch (error) {
    console.log("ROLE ERROR:", error);
  }

  const isAdmin = userRole === "admin";

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.log("Customers error:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId && !isAdmin) {
      alert("Only Admin can edit customers.");
      return;
    }

    if (!form.name || !form.phone) {
      alert("Name and phone are required.");
      return;
    }

    try {
      const customerData = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      };

      if (editingId) {
        await axios.put(`${API_URL}/api/customers/${editingId}`, customerData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Customer updated successfully!");
      } else {
        await axios.post(`${API_URL}/api/customers`, customerData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Customer added successfully!");
      }

      resetForm();
      fetchCustomers();
    } catch (error) {
      console.log("Customer save error:", error);
      alert(error.response?.data?.message || "Failed to save customer");
    }
  };

  const handleEdit = (customer) => {
    if (!isAdmin) {
      alert("Only Admin can edit customers.");
      return;
    }

    setEditingId(customer._id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Customer deleted successfully!");

      if (editingId === id) resetForm();
      if (expandedId === id) setExpandedId(null);

      fetchCustomers();
    } catch (error) {
      console.log("Delete customer error:", error);
      alert(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const togglePurchases = async (customerId) => {
    if (expandedId === customerId) {
      setExpandedId(null);
      setPurchases([]);
      return;
    }

    setExpandedId(customerId);
    setLoadingPurchases(true);

    try {
      const response = await axios.get(
        `${API_URL}/api/customers/${customerId}/purchases`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPurchases(response.data);
    } catch (error) {
      console.log("Purchases fetch error:", error);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const search = searchText.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <div className="page-header">
        <p className="page-label">CONTACTS</p>
        <h1>Customers</h1>
        <p className="page-subtitle">
          Manage customer details and view purchase history.
        </p>
      </div>

      <div className="form-panel">
        <h2>{editingId ? "Edit Customer" : "Add Customer"}</h2>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g. Ali Khan"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="text"
              name="phone"
              placeholder="e.g. 03001234567"
              value={form.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (optional)</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="e.g. ali@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address (optional)</label>
            <input
              id="address"
              type="text"
              name="address"
              placeholder="e.g. Model Town, Lahore"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? "Update customer" : "Add customer"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm} className="btn-secondary">
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="filter-panel">
        <h2>Customer list</h2>

        <div className="filter-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, phone or email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <strong>No customers found</strong>
            <p>
              {searchText
                ? "Try a different search."
                : "Add your first customer using the form above."}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <>
                  <tr key={customer._id}>
                    <td className="cell-strong">{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.address || "-"}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => togglePurchases(customer._id)}
                        >
                          {expandedId === customer._id ? "Hide" : "Purchases"}
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleEdit(customer)}
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => handleDelete(customer._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === customer._id && (
                    <tr className="user-detail-row">
                      <td colSpan={5}>
                        {loadingPurchases ? (
                          <p>Loading purchase history...</p>
                        ) : purchases.length === 0 ? (
                          <p>No purchases found for this customer.</p>
                        ) : (
                          purchases.map((invoice) => (
                            <div key={invoice._id} className="product-line-item">
                              <strong>{invoice.invoiceNumber}</strong>
                              <span>
                                Total: Rs. {invoice.grandTotal} &middot; Paid: Rs.{" "}
                                {invoice.paidAmount} &middot; Pending: Rs.{" "}
                                {invoice.pendingAmount} &middot;{" "}
                                {new Date(invoice.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default Customer;