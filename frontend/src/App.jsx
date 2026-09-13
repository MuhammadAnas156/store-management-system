import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customer from "./pages/Customer";
import Invoice from "./pages/invoice";
import Reports from "./pages/reports";
import InvoiceHistory from "./pages/invoicehistory";
import DeletedRecords from "./pages/DeletedRecords";
import UserManagement from "./pages/UserManagement";
import Layout from "./components/Layout";

import "./App.css";

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>

      <Routes>

        {/* ROOT */}
        <Route
          path="/"
          element={
            token ? (
              <Navigate to="/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            token ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* PRODUCTS */}
        <Route
          path="/products"
          element={
            token ? (
              <Layout>
                <Products />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* CUSTOMERS */}
        <Route
          path="/customers"
          element={
            token ? (
              <Layout>
                <Customer />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* CREATE INVOICE */}
        <Route
          path="/invoice"
          element={
            token ? (
              <Layout>
                <Invoice />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* INVOICE HISTORY */}
        <Route
          path="/invoice-history"
          element={
            token ? (
              <Layout>
                <InvoiceHistory />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* REPORTS */}
        <Route
          path="/reports"
          element={
            token ? (
              <Layout>
                <Reports />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* DELETED RECORDS */}
        <Route
          path="/deleted-records"
          element={
            token ? (
              <Layout>
                <DeletedRecords />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* USER MANAGEMENT */}
        <Route
          path="/user-management"
          element={
            token ? (
              <Layout>
                <UserManagement />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;