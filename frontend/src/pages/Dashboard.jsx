import { useEffect, useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [userRole, setUserRole] = useState("");

  const [chartPeriod, setChartPeriod] = useState("monthly");
  const [chartCustomer, setChartCustomer] = useState("all");
  const [chartStartDate, setChartStartDate] = useState("");
  const [chartEndDate, setChartEndDate] = useState("");
  const [chartPreset, setChartPreset] = useState("all-time");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role || "");
    } catch (error) {
      console.log("ROLE ERROR:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [productsResponse, customersResponse, invoicesResponse] =
        await Promise.all([
          axios.get("http://localhost:5000/api/products", { headers }),
          axios.get("http://localhost:5000/api/customers", { headers }),
          axios.get("http://localhost:5000/api/invoices", { headers }),
        ]);

      setProducts(productsResponse.data);
      setCustomers(customersResponse.data);
      setInvoices(invoicesResponse.data);
    } catch (error) {
      console.log("Dashboard data error:", error);
    }
  };

  const totalSales = invoices.reduce(
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

  const totalProfit = invoices.reduce(
    (total, invoice) => total + Number(invoice.profit || 0),
    0
  );

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock || 0) <= Number(product.lowStockLimit || 0)
  );

  const toInputDate = (date) => date.toISOString().split("T")[0];

  const applyChartPreset = (preset) => {
    setChartPreset(preset);

    const now = new Date();

    if (preset === "all-time") {
      setChartStartDate("");
      setChartEndDate("");
      return;
    }

    if (preset === "this-week") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      setChartStartDate(toInputDate(monday));
      setChartEndDate(toInputDate(now));
      return;
    }

    if (preset === "last-week") {
      const day = now.getDay() === 0 ? 7 : now.getDay();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - day - 6);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      setChartStartDate(toInputDate(lastMonday));
      setChartEndDate(toInputDate(lastSunday));
      return;
    }

    if (preset === "this-month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setChartStartDate(toInputDate(first));
      setChartEndDate(toInputDate(now));
      return;
    }

    if (preset === "last-month") {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setChartStartDate(toInputDate(first));
      setChartEndDate(toInputDate(last));
      return;
    }

    if (preset === "this-year") {
      const first = new Date(now.getFullYear(), 0, 1);
      setChartStartDate(toInputDate(first));
      setChartEndDate(toInputDate(now));
      return;
    }

    if (preset === "last-year") {
      const first = new Date(now.getFullYear() - 1, 0, 1);
      const last = new Date(now.getFullYear() - 1, 11, 31);
      setChartStartDate(toInputDate(first));
      setChartEndDate(toInputDate(last));
      return;
    }
  };

  const filteredChartInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.createdAt);

    if (chartCustomer !== "all" && invoice.customer?._id !== chartCustomer) {
      return false;
    }

    if (chartStartDate && invoiceDate < new Date(chartStartDate)) {
      return false;
    }

    if (chartEndDate) {
      const end = new Date(chartEndDate);
      end.setHours(23, 59, 59, 999);
      if (invoiceDate > end) {
        return false;
      }
    }

    return true;
  });

  const filteredPaid = filteredChartInvoices.reduce(
    (total, invoice) => total + Number(invoice.paidAmount || 0),
    0
  );

  const filteredPending = filteredChartInvoices.reduce(
    (total, invoice) => total + Number(invoice.pendingAmount || 0),
    0
  );

  const paymentChartData = [
    { name: "Paid", value: filteredPaid },
    { name: "Pending", value: filteredPending },
  ];

  const salesProfitTrend = (() => {
    const data = {};

    filteredChartInvoices.forEach((invoice) => {
      const date = new Date(invoice.createdAt);
      let key = "";

      if (chartPeriod === "daily") {
        key = date.toLocaleDateString();
      } else if (chartPeriod === "weekly") {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((days + firstDay.getDay() + 1) / 7);
        key = `Week ${weekNumber}`;
      } else if (chartPeriod === "monthly") {
        key = date.toLocaleString("default", { month: "short", year: "numeric" });
      } else if (chartPeriod === "yearly") {
        key = date.getFullYear().toString();
      }

      if (!data[key]) {
        data[key] = { name: key, Sales: 0, Profit: 0 };
      }

      data[key].Sales += Number(invoice.grandTotal || 0);
      data[key].Profit += Number(invoice.profit || 0);
    });

    return Object.values(data);
  })();

  const formatMoney = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString()}`;
  };

  const chartPresets = [
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
      <header className="dashboard-header">
        <div className="header-left">
          <p className="dashboard-label">BUSINESS OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor your store performance and daily activities.
          </p>
        </div>

        <div className="header-right">
          <div className="header-date">
            <span>📅</span>
            <div>
              <small>TODAY</small>
              <strong>
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </strong>
            </div>
          </div>

          <div className="header-user">
            <div className="header-avatar">
              {userRole === "admin" ? "A" : "U"}
            </div>
            <div>
              <strong>{userRole === "admin" ? "Admin" : "Administration"}</strong>
              <span>{userRole === "admin" ? "Administrator" : "Staff Member"}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue-icon">📦</div>
            <span className="stat-label">PRODUCTS</span>
          </div>
          <h2>{products.length}</h2>
          <p>Total products</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon purple-icon">👥</div>
            <span className="stat-label">CUSTOMERS</span>
          </div>
          <h2>{customers.length}</h2>
          <p>Registered customers</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon orange-icon">🧾</div>
            <span className="stat-label">INVOICES</span>
          </div>
          <h2>{invoices.length}</h2>
          <p>Total invoices</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon teal-icon">📊</div>
            <span className="stat-label">STOCK</span>
          </div>
          <h2>{totalStock.toLocaleString()}</h2>
          <p>Items in inventory</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon green-icon">💰</div>
            <span className="stat-label">SALES</span>
          </div>
          <h2 className="money-value">{formatMoney(totalSales)}</h2>
          <p>Total revenue</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon blue-icon">✓</div>
            <span className="stat-label">PAID</span>
          </div>
          <h2 className="money-value">{formatMoney(totalPaid)}</h2>
          <p>Payments received</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon red-icon">⏳</div>
            <span className="stat-label">PENDING</span>
          </div>
          <h2 className="money-value">{formatMoney(totalPending)}</h2>
          <p>Outstanding payments</p>
        </div>

        <div className="stat-card money-card">
          <div className="stat-card-header">
            <div className="stat-icon green-icon">↗</div>
            <span className="stat-label">PROFIT</span>
          </div>
          <h2 className="money-value">{formatMoney(totalProfit)}</h2>
          <p>Total business profit</p>
        </div>
      </section>

      <div className="filter-panel" style={{ marginTop: "20px" }}>
        <h2>Chart Filters</h2>

        <div className="filter-row">
          <select
            value={chartPeriod}
            onChange={(e) => setChartPeriod(e.target.value)}
            className="filter-select"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <select
            value={chartCustomer}
            onChange={(e) => setChartCustomer(e.target.value)}
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
          {chartPresets.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`preset-btn ${chartPreset === preset.key ? "active" : ""}`}
              onClick={() => applyChartPreset(preset.key)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="date-range-row">
          <div className="form-group">
            <label htmlFor="chartStartDate">From</label>
            <input
              id="chartStartDate"
              type="date"
              value={chartStartDate}
              onChange={(e) => {
                setChartStartDate(e.target.value);
                setChartPreset("custom");
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="chartEndDate">To</label>
            <input
              id="chartEndDate"
              type="date"
              value={chartEndDate}
              onChange={(e) => {
                setChartEndDate(e.target.value);
                setChartPreset("custom");
              }}
            />
          </div>
        </div>
      </div>

      <section className="charts-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Payment Overview</h2>
              <p>Paid and pending payments for this selection</p>
            </div>
            <span className="panel-icon">💳</span>
          </div>

          <div className="chart-container">
            {filteredPaid === 0 && filteredPending === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💳</div>
                <strong>No data for this selection</strong>
                <p>Try a different filter or date range.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    <Cell />
                    <Cell />
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Sales & Profit Trend</h2>
              <p>Breakdown by {chartPeriod} period for this selection</p>
            </div>
            <span className="panel-icon">📈</span>
          </div>

          <div className="chart-container">
            {salesProfitTrend.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📈</div>
                <strong>No data for this selection</strong>
                <p>Try a different filter or date range.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesProfitTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend />
                  <Bar dataKey="Sales" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Profit" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Low Stock Products</h2>
              <p>Products requiring attention</p>
            </div>
            <span className="count-badge">{lowStockProducts.length}</span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✓</div>
              <strong>Stock levels are healthy</strong>
              <p>No products are currently low in stock.</p>
            </div>
          ) : (
            <div className="list-container">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="list-row">
                  <div className="list-product">
                    <div className="product-mini-icon">📦</div>
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.category}</small>
                    </div>
                  </div>
                  <span className="stock-badge">{product.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Recent Invoices</h2>
              <p>Latest sales transactions</p>
            </div>
            <span className="count-badge">{invoices.length}</span>
          </div>

          {invoices.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧾</div>
              <strong>No invoices yet</strong>
              <p>Create an invoice to see transactions here.</p>
            </div>
          ) : (
            <div className="list-container">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice._id} className="invoice-row">
                  <div className="invoice-info">
                    <div className="invoice-icon">🧾</div>
                    <div>
                      <strong>{invoice.invoiceNumber}</strong>
                      <small>{invoice.customer?.name || "Unknown Customer"}</small>
                    </div>
                  </div>
                  <strong className="invoice-price">
                    {formatMoney(invoice.grandTotal)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;