import { useEffect, useState } from "react";
import axios from "axios";

function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    discount: 0,
    paidAmount: 0,
    paymentMethod: "cash",
  });

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

  const fetchInvoices = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setInvoices(response.data);
    } catch (err) {
      console.log("INVOICE ERROR:", err);
      setError(err.response?.data?.message || "Invoices load nahi ho rahi.");
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token]);

  const deleteInvoice = async (invoiceId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this invoice?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:5000/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Invoice deleted successfully!");

      setInvoices((prevInvoices) =>
        prevInvoices.filter((invoice) => invoice._id !== invoiceId)
      );

      if (editingId === invoiceId) {
        cancelEdit();
      }
    } catch (err) {
      console.log("DELETE INVOICE ERROR:", err);
      alert(err.response?.data?.message || "Failed to delete invoice");
    }
  };

  const startEdit = (invoice) => {
    if (!isAdmin) {
      alert("Only Admin can edit invoices.");
      return;
    }

    setEditingId(invoice._id);
    setEditForm({
      discount: invoice.discount || 0,
      paidAmount: invoice.paidAmount || 0,
      paymentMethod: invoice.paymentMethod || "cash",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const updateInvoice = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      alert("Only Admin can edit invoices.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/invoices/${editingId}`,
        {
          discount: Number(editForm.discount || 0),
          paidAmount: Number(editForm.paidAmount || 0),
          paymentMethod: editForm.paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Invoice updated successfully!");

      setEditingId(null);
      setEditForm({ discount: 0, paidAmount: 0, paymentMethod: "cash" });
      fetchInvoices();
    } catch (err) {
      console.log("UPDATE INVOICE ERROR:", err);
      alert(err.response?.data?.message || "Failed to update invoice");
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ discount: 0, paidAmount: 0, paymentMethod: "cash" });
  };

  return (
    <>
      <div className="page-header">
        <p className="page-label">BILLING</p>
        <h1>Invoice History</h1>
        <p className="page-subtitle">All created invoices are shown here.</p>
      </div>

      {editingId && (
        <div className="form-panel editing">
          <h2>Edit Invoice</h2>

          <form onSubmit={updateInvoice} className="product-form" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <div className="form-group">
              <label htmlFor="discount">Discount</label>
              <input
                id="discount"
                type="number"
                name="discount"
                min="0"
                value={editForm.discount}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paidAmount">Paid amount</label>
              <input
                id="paidAmount"
                type="number"
                name="paidAmount"
                min="0"
                value={editForm.paidAmount}
                onChange={handleEditChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentMethod">Payment method</label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                value={editForm.paymentMethod}
                onChange={handleEditChange}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="credit">Credit</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Update invoice
              </button>
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="alert-banner">{error}</div>}

      {invoices.length === 0 && !error && (
        <div className="table-panel">
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <strong>No invoices found</strong>
            <p>Abhi tak koi invoice create nahi hui.</p>
          </div>
        </div>
      )}

      <div className="invoice-history-list">
        {invoices.map((invoice) => {
          const pendingAmount = Number(invoice.pendingAmount || 0);
          const paidAmount = Number(invoice.paidAmount || 0);
          const grandTotal = Number(invoice.grandTotal || 0);
          const isPaid = pendingAmount === 0;

          return (
            <div key={invoice._id} className="invoice-card detailed">
              <div className="invoice-card-header">
                <div>
                  <h4>{invoice.invoiceNumber}</h4>
                  <p>Invoice</p>
                </div>

                <span className={`status-pill ${isPaid ? "paid" : "pending"}`}>
                  {isPaid ? "Paid" : "Pending"}
                </span>
              </div>

              <p className="section-label">CUSTOMER</p>
              <p className="customer-meta">
                <strong>Name:</strong> {invoice.customer?.name || "Unknown"}
              </p>
              <p className="customer-meta">
                <strong>Phone:</strong> {invoice.customer?.phone || "N/A"}
              </p>

              <p className="section-label">PRODUCTS</p>
              {invoice.products?.map((item, index) => (
                <div key={index} className="product-line-item">
                  <strong>{item.product?.name || "Product"}</strong>
                  <span>
                    Qty: {item.quantity} &middot; Price: Rs. {item.price} &middot; Total:
                    Rs. {item.total}
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
                <h3 className="invoice-grand-total">Grand total: Rs. {grandTotal}</h3>
                <p>
                  <strong>Paid:</strong> Rs. {paidAmount}
                </p>
                <p>
                  <strong>Pending:</strong> Rs. {pendingAmount}
                </p>
                <p>
                  <strong>Payment method:</strong> {invoice.paymentMethod}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(invoice.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="card-actions">
                {isAdmin && (
                  <button type="button" className="btn-icon" onClick={() => startEdit(invoice)}>
                    Edit invoice
                  </button>
                )}

                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => deleteInvoice(invoice._id)}
                >
                  Delete invoice
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default InvoiceHistory;