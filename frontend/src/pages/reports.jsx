import { useEffect, useState } from "react";
import axios from "axios";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Reports() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [period, setPeriod] = useState("monthly");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("all-time");

  const [reportData, setReportData] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/invoices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(response.data);
    } catch (error) {
      console.log("Reports error:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.log("Customers fetch error:", error);
    }
  };

  const toInputDate = (date) => date.toISOString().split("T")[0];

  const applyPreset = (preset) => {
    setActivePreset(preset);

    const now = new Date();

    if (preset === "all-time") {
      setStartDate("");
      setEndDate("");
      return;
    }

    if (preset === "this-week") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      setStartDate(toInputDate(monday));
      setEndDate(toInputDate(now));
      return;
    }

    if (preset === "last-week") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - day - 6);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      setStartDate(toInputDate(lastMonday));
      setEndDate(toInputDate(lastSunday));
      return;
    }

    if (preset === "this-month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toInputDate(first));
      setEndDate(toInputDate(now));
      return;
    }

    if (preset === "last-month") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toInputDate(first));
      setEndDate(toInputDate(last));
      return;
    }

    if (preset === "this-year") {
      const first = new Date(now.getFullYear(), 0, 1);
      setStartDate(toInputDate(first));
      setEndDate(toInputDate(now));
      return;
    }

    if (preset === "last-year") {
      const first = new Date(now.getFullYear() - 1, 0, 1);
      const last = new Date(now.getFullYear() - 1, 11, 31);
      setStartDate(toInputDate(first));
      setEndDate(toInputDate(last));
      return;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.createdAt);

    if (customerFilter !== "all" && invoice.customer?._id !== customerFilter) {
      return false;
    }

    if (startDate && invoiceDate < new Date(startDate)) {
      return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (invoiceDate > end) {
        return false;
      }
    }

    return true;
  });

  useEffect(() => {
    createReport();
  }, [invoices, period, customerFilter, startDate, endDate]);

  const createReport = () => {
    const data = {};

    filteredInvoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt);

      let key = "";

      if (period === "daily") {
        key = date.toLocaleDateString();
      } else if (period === "weekly") {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + firstDay.getDay() + 1) / 7);
        key = `Week ${weekNumber}`;
      } else if (period === "monthly") {
        key = date.toLocaleString("default", { month: "short", year: "numeric" });
      } else if (period === "yearly") {
        key = date.getFullYear().toString();
      }

      if (!data[key]) {
        data[key] = { name: key, sales: 0, profit: 0, paid: 0, pending: 0 };
      }

      data[key].sales += Number(invoice.grandTotal || 0);
      data[key].profit += Number(invoice.profit || 0);
      data[key].paid += Number(invoice.paidAmount || 0);
      data[key].pending += Number(invoice.pendingAmount || 0);
    });

    setReportData(Object.values(data));
  };

  const totalSales = reportData.reduce((sum, item) => sum + item.sales, 0);
  const totalProfit = reportData.reduce((sum, item) => sum + item.profit, 0);
  const totalPaid = reportData.reduce((sum, item) => sum + item.paid, 0);
  const totalPending = reportData.reduce((sum, item) => sum + item.pending, 0);

  const presets = [
    { key: "all-time", label: "All time" },
    { key: "this-week", label: "This week" },
    { key: "last-week", label: "Last week" },
    { key: "this-month", label: "This month" },
    { key: "last-month", label: "Last month" },
    { key: "this-year", label: "This year" },
    { key: "last-year", label: "Last year" },
  ];

  return (
    <>
      <div className="page-header">
        <p className="page-label">ANALYTICS</p>
        <h1>Business Reports</h1>
        <p className="page-subtitle">Analyze your business performance.</p>
      </div>

      <div className="filter-panel">
        <h2>Filters</h2>

        <div className="filter-row">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="filter-select">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All customers</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="preset-buttons">
          {presets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`preset-btn ${activePreset === preset.key ? "active" : ""}`}
              onClick={() => applyPreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="date-range-row">
          <div className="form-group">
            <label htmlFor="startDate">From</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset("custom");
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">To</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset("custom");
              }}
            />
          </div>
        </div>
      </div>

      <section className="stats-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon green-icon">💰</div>
            <span className="stat-label">SALES</span>
          </div>
          <h2 className="money-value">Rs. {totalSales.toLocaleString()}</h2>
          <p>Total sales in range</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon green-icon">↗</div>
            <span className="stat-label">PROFIT</span>
          </div>
          <h2 className="money-value">Rs. {totalProfit.toLocaleString()}</h2>
          <p>Total profit in range</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon blue-icon">✓</div>
            <span className="stat-label">PAID</span>
          </div>
          <h2 className="money-value">Rs. {totalPaid.toLocaleString()}</h2>
          <p>Payments received</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon red-icon">⏳</div>
            <span className="stat-label">PENDING</span>
          </div>
          <h2 className="money-value">Rs. {totalPending.toLocaleString()}</h2>
          <p>Outstanding payments</p>
        </div>
      </section>

      <div className="dashboard-panel" style={{ marginTop: "20px" }}>
        <div className="panel-header">
          <div>
            <h2>Sales & Profit Report</h2>
            <p>Breakdown by {period} period</p>
          </div>
          <span className="panel-icon">📊</span>
        </div>

        <div style={{ width: "100%", height: "380px", marginTop: "10px" }}>
          {reportData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📈</div>
              <strong>No data for this selection</strong>
              <p>Try a different filter or date range.</p>
            </div>
          ) : (
            <ResponsiveContainer>
              <BarChart data={reportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `Rs. ${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="sales" name="Sales" radius={[6, 6, 0, 0]} />
                <Bar dataKey="profit" name="Profit" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="table-panel" style={{ marginTop: "20px" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 750, color: "var(--color-ink)" }}>
          Report Details
        </h2>

        {reportData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <strong>No invoice data available</strong>
            <p>Adjust the filters above to see report data.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Sales</th>
                <th>Profit</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>

            <tbody>
              {reportData.map((item, index) => (
                <tr key={index}>
                  <td className="cell-strong">{item.name}</td>
                  <td>Rs. {item.sales.toLocaleString()}</td>
                  <td>Rs. {item.profit.toLocaleString()}</td>
                  <td>Rs. {item.paid.toLocaleString()}</td>
                  <td>Rs. {item.pending.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default Reports;