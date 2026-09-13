import { useEffect, useState } from "react";
import axios from "axios";

function Invoice() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [customer, setCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [invoiceProducts, setInvoiceProducts] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error) {
      console.log("Failed to fetch products:", error);
    }
  };

  const addProduct = () => {
    if (!selectedProduct) {
      alert("Please select a product");
      return;
    }

    const product = products.find((item) => item._id === selectedProduct);
    if (!product) return;

    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (quantity > product.stock) {
      alert(`Only ${product.stock} items available in stock`);
      return;
    }

    const existingProduct = invoiceProducts.find(
      (item) => item.product === product._id
    );

    if (existingProduct) {
      alert("Product already added to invoice");
      return;
    }

    setInvoiceProducts([
      ...invoiceProducts,
      {
        product: product._id,
        name: product.name,
        quantity: Number(quantity),
        price: product.sellingPrice,
        total: product.sellingPrice * Number(quantity),
      },
    ]);

    setSelectedProduct("");
    setQuantity(1);
  };

  const removeProduct = (id) => {
    setInvoiceProducts(invoiceProducts.filter((item) => item.product !== id));
  };

  const subtotal = invoiceProducts.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = Math.max(subtotal - Number(discount || 0), 0);
  const pendingAmount = Math.max(grandTotal - Number(paidAmount || 0), 0);

  const createInvoice = async (e) => {
    e.preventDefault();

    if (!customer) {
      alert("Please select a customer");
      return;
    }

    if (invoiceProducts.length === 0) {
      alert("Please add at least one product");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/invoices",
        {
          customer,
          products: invoiceProducts.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            price: item.price,
          })),
          discount: Number(discount || 0),
          paidAmount: Number(paidAmount || 0),
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Invoice ${response.data.invoiceNumber} created successfully!`);

      setCustomer("");
      setSelectedProduct("");
      setQuantity(1);
      setDiscount(0);
      setPaidAmount(0);
      setPaymentMethod("cash");
      setInvoiceProducts([]);

      fetchProducts();
    } catch (error) {
      console.log("Failed to create invoice:", error);
      alert(error.response?.data?.message || "Failed to create invoice");
    }
  };

  return (
    <>
      <div className="page-header">
        <p className="page-label">BILLING</p>
        <h1>Create Invoice</h1>
        <p className="page-subtitle">
          Add products, set payment details and generate an invoice.
        </p>
      </div>

      <form onSubmit={createInvoice}>
        <div className="invoice-layout">
          {/* LEFT COLUMN — FORM */}
          <div>
            <div className="form-panel">
              <h2>Customer & Products</h2>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label htmlFor="customer">Customer</label>
                <select
                  id="customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                >
                  <option value="">Select customer</option>
                  {customers.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} - {item.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="product-add-row">
                <div className="form-group">
                  <label htmlFor="product">Product</label>
                  <select
                    id="product"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select product</option>
                    {products.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} - Stock: {item.stock} - Rs. {item.sellingPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group qty">
                  <label htmlFor="quantity">Qty</label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <button type="button" onClick={addProduct} className="btn-primary">
                  Add product
                </button>
              </div>

              <div className="invoice-lines">
                {invoiceProducts.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🧾</div>
                    <strong>No products added yet</strong>
                    <p>Select a product above to add it to this invoice.</p>
                  </div>
                ) : (
                  invoiceProducts.map((item) => (
                    <div key={item.product} className="invoice-line">
                      <div className="invoice-line-info">
                        <strong>{item.name}</strong>
                        <small>
                          Qty: {item.quantity} &middot; Price: Rs. {item.price}
                        </small>
                      </div>

                      <div className="invoice-line-right">
                        <span className="invoice-line-total">
                          Rs. {item.total.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => removeProduct(item.product)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="form-panel">
              <h2>Payment Details</h2>

              <div className="product-form" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                <div className="form-group">
                  <label htmlFor="discount">Discount</label>
                  <input
                    id="discount"
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paidAmount">Paid amount</label>
                  <input
                    id="paidAmount"
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMethod">Payment method</label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — LIVE RECEIPT SUMMARY */}
          <div className="receipt-panel">
            <h2 className="receipt-title">Invoice Summary</h2>

            <div className="receipt-row">
              <span>Items</span>
              <strong>{invoiceProducts.length}</strong>
            </div>

            <div className="receipt-row">
              <span>Subtotal</span>
              <strong>Rs. {subtotal.toLocaleString()}</strong>
            </div>

            <div className="receipt-row">
              <span>Discount</span>
              <strong>Rs. {Number(discount || 0).toLocaleString()}</strong>
            </div>

            <div className="receipt-row">
              <span>Paid</span>
              <strong>Rs. {Number(paidAmount || 0).toLocaleString()}</strong>
            </div>

            <div className="receipt-total-row">
              <span>GRAND TOTAL</span>
              <h2>Rs. {grandTotal.toLocaleString()}</h2>
            </div>

            <div className={`pending-note ${pendingAmount === 0 ? "clear" : ""}`}>
              {pendingAmount === 0
                ? "Fully paid"
                : `Pending: Rs. ${pendingAmount.toLocaleString()}`}
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", marginTop: "18px" }}
            >
              Create invoice
            </button>
          </div>
        </div>
      </form>
    </>
  );
}

export default Invoice;