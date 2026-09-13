import { useEffect, useState } from "react";
import axios from "axios";

function Customer() {
  const [customers, setCustomers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [searchText, setSearchText] = useState("");

  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [customerSummary, setCustomerSummary] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    totalPending: 0,
  });

  const [editingId, setEditingId] = useState(null);

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
      const response = await axios.get("http://localhost:5000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.log("Failed to fetch customers:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/customers", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Customer added successfully!");
      setForm({ name: "", phone: "", email: "", address: "" });
      fetchCustomers();
    } catch (error) {
      console.log("Failed to add customer:", error);
      alert(error.response?.data?.message || "Failed to add customer");
    }
  };

  const handleEdit = (customer) => {
    if (!isAdmin) {
      alert("Only Admin can edit customers.");
      return;
    }

    setEditingId(customer._id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Only Admin can edit customers.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/customers/${editingId}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Customer updated successfully!");
      setForm({ name: "", phone: "", email: "", address: "" });
      setEditingId(null);
      fetchCustomers();
    } catch (error) {
      console.log("Failed to update customer:", error);
      alert(error.response?.data?.message || "Failed to update customer");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", address: "" });
  };

  const deleteCustomer = async (customerId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Customer deleted successfully!");

      setCustomers((prevCustomers) =>
        prevCustomers.filter((customer) => customer._id !== customerId)
      );

      if (selectedCustomer?._id === customerId) {
        closePurchaseHistory();
      }
    } catch (error) {
      console.log("Failed to delete customer:", error);
      alert(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const viewPurchaseHistory = async (customer) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/customers/${customer._id}/purchases`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const invoices = response.data;

      setPurchaseHistory(invoices);
      setSelectedCustomer(customer);

      const totalPurchases = invoices.reduce(
        (total, invoice) => total + Number(invoice.grandTotal || 0),
        0
      );

      const totalPaid = invoices.reduce(
        (total, invoice) => total + Number(invoice.paidAmount || 0),
        0
      );

      const totalPending = invoices.reduce(
        (total, invoice) => total + Number(invoice.pendingAmount || 0),
        0
      );

      setCustomerSummary({ totalPurchases, totalPaid, totalPending });
    } catch (error) {
      console.log("Failed to fetch purchase history:", error);
      alert(error.response?.data?.message || "Failed to fetch purchase history");
    }
  };

  const closePurchaseHistory = () => {
    setSelectedCustomer(null);
    setPurchaseHistory([]);
    setCustomerSummary({ totalPurchases: 0, totalPaid: 0, totalPending: 0 });
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
        <p className="page-label">CUSTOMERS</p>
        <h1>Customers</h1>
        <p className="page-subtitle">
          Manage customers and view their purchase history.
        </p>
      </div>

      <div className="form-panel">
        <h2>{editingId ? "Edit Customer" : "Add Customer"}</h2>

        <form
          onSubmit={editingId ? handleUpdate : handleSubmit}
          className="product-form"
        >
          <div className="form-group">
            <label htmlFor="name">Customer name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g. Ali Raza"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              type="text"
              name="phone"
              placeholder="03xx-xxxxxxx"
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
              placeholder="name@example.com"
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
              placeholder="Street, city"
              value={form.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? "Update customer" : "Add customer"}
            </button>

            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
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
        <div className="customer-grid">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="customer-card">
              <h3>{customer.name}</h3>

              <p className="customer-meta">
                <strong>Phone:</strong> {customer.phone}
              </p>

              <p className="customer-meta">
                <strong>Email:</strong> {customer.email || "No email"}
              </p>

              <p className="customer-meta">
                <strong>Address:</strong> {customer.address || "No address"}
              </p>

              <div className="customer-actions">
                <button
                  type="button"
                  className="btn-icon accent"
                  onClick={() => viewPurchaseHistory(customer)}
                >
                  Purchase history
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
                  onClick={() => deleteCustomer(customer._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCustomer && (
        <div className="history-panel">
          <div className="history-header">
            <div>
              <h2>Purchase History</h2>
              <p>
                <strong>Customer:</strong> {selectedCustomer.name}
              </p>
              <p>
                <strong>Phone:</strong> {selectedCustomer.phone}
              </p>
            </div>

            <button type="button" className="btn-secondary" onClick={closePurchaseHistory}>
              Close
            </button>
          </div>

          <div className="history-summary-grid">
            <div className="mini-stat">
              <p>Total purchases</p>
              <h2>Rs. {customerSummary.totalPurchases.toLocaleString()}</h2>
            </div>

            <div className="mini-stat">
              <p>Total paid</p>
              <h2>Rs. {customerSummary.totalPaid.toLocaleString()}</h2>
            </div>

            <div className="mini-stat">
              <p>Total pending</p>
              <h2>Rs. {customerSummary.totalPending.toLocaleString()}</h2>
            </div>
          </div>

          <h3>Invoices</h3>

          {purchaseHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <strong>No purchases yet</strong>
              <p>This customer has no invoices so far.</p>
            </div>
          ) : (
            purchaseHistory.map((invoice) => {
              const grandTotal = Number(invoice.grandTotal || 0);
              const paidAmount = Number(invoice.paidAmount || 0);
              const pendingAmount = Number(invoice.pendingAmount || 0);

              let paymentStatus = "Pending";
              let statusClass = "pending";

              if (pendingAmount === 0 && paidAmount >= grandTotal && grandTotal > 0) {
                paymentStatus = "Paid";
                statusClass = "paid";
              } else if (paidAmount > 0 && pendingAmount > 0) {
                paymentStatus = "Partial";
                statusClass = "partial";
              }

              return (
                <div key={invoice._id} className="invoice-card">
                  <div className="invoice-card-header">
                    <h4>{invoice.invoiceNumber}</h4>
                    <span className={`status-pill ${statusClass}`}>
                      {paymentStatus}
                    </span>
                  </div>

                  <p className="invoice-date">
                    {new Date(invoice.createdAt).toLocaleString()}
                  </p>

                  {invoice.products?.map((item, index) => (
                    <div key={index} className="product-line-item">
                      <strong>{item.product?.name || "Product"}</strong>
                      <span>
                        Qty: {item.quantity} &middot; Price: Rs. {item.price} &middot;{" "}
                        Total: Rs. {item.total}
                      </span>
                    </div>
                  ))}

                  <div className="invoice-totals">
                    <p>
                      <strong>Subtotal:</strong> Rs. {invoice.subtotal}
                    </p>
                    <p>
                      <strong>Discount:</strong> Rs. {invoice.discount}
                    </p>
                    <h3 className="invoice-grand-total">
                      Grand total: Rs. {grandTotal}
                    </h3>
                    <p>
                      <strong>Paid:</strong> Rs. {paidAmount}
                    </p>
                    <p>
                      <strong>Pending:</strong> Rs. {pendingAmount}
                    </p>
                    <p>
                      <strong>Payment method:</strong> {invoice.paymentMethod}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}

export default Customer;