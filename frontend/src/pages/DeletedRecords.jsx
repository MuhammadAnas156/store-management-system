import { useEffect, useState } from "react";
import axios from "axios";

function DeletedRecords() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  const fetchDeletedRecords = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "http://localhost:5000/api/admin/deleted-records",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRecords(response.data);
    } catch (error) {
      console.log("DELETED RECORDS ERROR:", error);
      setError(error.response?.data?.message || "Failed to load deleted records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDeletedRecords();
    } else {
      setLoading(false);
    }
  }, []);

  const permanentlyDelete = async (id) => {
    const confirmDelete = window.confirm(
      "This will permanently delete this record. This action cannot be undone. Continue?"
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/admin/deleted-records/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Record permanently deleted!");

      setRecords((prevRecords) =>
        prevRecords.filter((record) => record._id !== id)
      );
    } catch (error) {
      console.log("PERMANENT DELETE ERROR:", error);
      alert(error.response?.data?.message || "Failed to permanently delete record");
    }
  };

  // =====================================================
  // ACCESS DENIED — page itself is admin-only now,
  // not just the sidebar link
  // =====================================================

  if (!isAdmin) {
    return (
      <>
        <div className="page-header">
          <p className="page-label">AUDIT LOG</p>
          <h1>Deleted Records</h1>
        </div>

        <div className="table-panel">
          <div className="empty-state">
            <div className="empty-icon">🔒</div>
            <strong>Access denied</strong>
            <p>Only Admin can view deleted records.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header page-header-row">
        <div>
          <p className="page-label">AUDIT LOG</p>
          <h1>Deleted Records</h1>
          <p className="page-subtitle">
            Admin can view and permanently delete records here.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Back to dashboard
        </button>
      </div>

      {error && <div className="alert-banner">{error}</div>}

      {loading ? (
        <div className="table-panel">
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <strong>Loading deleted records...</strong>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <div className="empty-icon">🗑️</div>
            <strong>No deleted records</strong>
            <p>Abhi tak koi product, customer ya invoice delete nahi hui.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="count-banner">
            Total deleted records: {records.length}
          </div>

          {records.map((record) => (
            <div key={record._id} className={`record-card type-${record.recordType}`}>
              <div className="record-card-header">
                <h4>
                  {record.recordType === "product" && "📦 Product"}
                  {record.recordType === "customer" && "👤 Customer"}
                  {record.recordType === "invoice" && "🧾 Invoice"}
                </h4>

                <span className="role-badge">{record.deletedByRole}</span>
              </div>

              <div className="record-meta">
                <p>
                  <strong>Deleted by:</strong> {record.deletedByName || "Unknown"}
                </p>

                {record.deletedBy?.email && (
                  <p>
                    <strong>Email:</strong> {record.deletedBy.email}
                  </p>
                )}

                <p>
                  <strong>Deleted at:</strong>{" "}
                  {record.createdAt
                    ? new Date(record.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>

              {record.recordType === "product" && (
                <div className="record-details">
                  <h5>PRODUCT DETAILS</h5>
                  <p>
                    <strong>Name:</strong> {record.recordData?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Category:</strong> {record.recordData?.category || "N/A"}
                  </p>
                  <p>
                    <strong>Purchase price:</strong> Rs.{" "}
                    {record.recordData?.purchasePrice || 0}
                  </p>
                  <p>
                    <strong>Selling price:</strong> Rs.{" "}
                    {record.recordData?.sellingPrice || 0}
                  </p>
                  <p>
                    <strong>Stock:</strong> {record.recordData?.stock || 0}
                  </p>
                </div>
              )}

              {record.recordType === "customer" && (
                <div className="record-details">
                  <h5>CUSTOMER DETAILS</h5>
                  <p>
                    <strong>Name:</strong> {record.recordData?.name || "N/A"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {record.recordData?.phone || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {record.recordData?.email || "N/A"}
                  </p>
                  <p>
                    <strong>Address:</strong> {record.recordData?.address || "N/A"}
                  </p>
                </div>
              )}

              {record.recordType === "invoice" && (
                <div className="record-details">
                  <h5>INVOICE DETAILS</h5>
                  <p>
                    <strong>Invoice number:</strong>{" "}
                    {record.recordData?.invoiceNumber || "N/A"}
                  </p>
                  <p>
                    <strong>Grand total:</strong> Rs.{" "}
                    {record.recordData?.grandTotal || 0}
                  </p>
                  <p>
                    <strong>Paid:</strong> Rs. {record.recordData?.paidAmount || 0}
                  </p>
                  <p>
                    <strong>Pending:</strong> Rs.{" "}
                    {record.recordData?.pendingAmount || 0}
                  </p>
                  <p>
                    <strong>Payment method:</strong>{" "}
                    {record.recordData?.paymentMethod || "N/A"}
                  </p>
                </div>
              )}

              <div className="card-actions">
                <button
                  type="button"
                  className="btn-icon danger"
                  onClick={() => permanentlyDelete(record._id)}
                >
                  Permanently delete
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}

export default DeletedRecords;