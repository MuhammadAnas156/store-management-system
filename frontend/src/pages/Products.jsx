import { useEffect, useState } from "react";
import axios from "axios";

function Products() {
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    lowStockLimit: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
    } catch (error) {
      console.log("Products error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "",
      purchasePrice: "",
      sellingPrice: "",
      stock: "",
      lowStockLimit: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingId && !isAdmin) {
      alert("Only Admin can edit products.");
      return;
    }

    if (
      !form.name ||
      !form.category ||
      form.purchasePrice === "" ||
      form.sellingPrice === "" ||
      form.stock === "" ||
      form.lowStockLimit === ""
    ) {
      alert("Please fill all fields.");
      return;
    }

    const purchasePrice = Number(form.purchasePrice);
    const sellingPrice = Number(form.sellingPrice);
    const stock = Number(form.stock);
    const lowStockLimit = Number(form.lowStockLimit);

    if (purchasePrice < 0 || sellingPrice < 0 || stock < 0 || lowStockLimit < 0) {
      alert("Values cannot be negative.");
      return;
    }

    if (sellingPrice < purchasePrice) {
      const confirmPrice = window.confirm(
        "Selling price is lower than purchase price. This product will have a loss. Continue?"
      );
      if (!confirmPrice) return;
    }

    try {
      const token = localStorage.getItem("token");

      const productData = {
        name: form.name.trim(),
        category: form.category.trim(),
        purchasePrice,
        sellingPrice,
        stock,
        lowStockLimit,
      };

      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/products/${editingId}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Product updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/products", productData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert("Product added successfully!");
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.log("Product save error:", error);
      alert(error.response?.data?.message || "Failed to save product");
    }
  };

  const handleEdit = (product) => {
    if (!isAdmin) {
      alert("Only Admin can edit products.");
      return;
    }

    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      lowStockLimit: product.lowStockLimit,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.log("Delete product error:", error);
      alert(error.response?.data?.message || "Failed to delete product");
    }
  };

  const categories = [
    ...new Set(products.map((product) => product.category).filter(Boolean)),
  ];

  const filteredProducts = products.filter((product) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      product.name?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search);

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <div className="page-header">
        <p className="page-label">INVENTORY</p>
        <h1>Products</h1>
        <p className="page-subtitle">
          Manage products, prices and stock levels.
        </p>
      </div>

      <div className="form-panel">
        <h2>{editingId ? "Edit Product" : "Add Product"}</h2>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label htmlFor="name">Product name</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g. Running Shoes"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              name="category"
              placeholder="e.g. Sneakers"
              value={form.category}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="stock">Stock quantity</label>
            <input
              id="stock"
              type="number"
              name="stock"
              placeholder="0"
              min="0"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="purchasePrice">Purchase price</label>
            <input
              id="purchasePrice"
              type="number"
              name="purchasePrice"
              placeholder="0"
              min="0"
              value={form.purchasePrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sellingPrice">Selling price</label>
            <input
              id="sellingPrice"
              type="number"
              name="sellingPrice"
              placeholder="0"
              min="0"
              value={form.sellingPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lowStockLimit">Low stock limit</label>
            <input
              id="lowStockLimit"
              type="number"
              name="lowStockLimit"
              placeholder="0"
              min="0"
              value={form.lowStockLimit}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? "Update product" : "Add product"}
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
        <h2>Product list</h2>

        <div className="filter-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search product or category..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="table-panel">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <strong>No products found</strong>
            <p>
              {searchText || categoryFilter !== "all"
                ? "Try a different search or filter."
                : "Add your first product using the form above."}
            </p>
          </div>
        </div>
      ) : (
        <div className="table-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Purchase price</th>
                <th>Selling price</th>
                <th>Margin</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const purchasePrice = Number(product.purchasePrice || 0);
                const sellingPrice = Number(product.sellingPrice || 0);
                const stock = Number(product.stock || 0);
                const lowStockLimit = Number(product.lowStockLimit || 0);
                const margin = sellingPrice - purchasePrice;
                const isLowStock = stock <= lowStockLimit;

                return (
                  <tr key={product._id}>
                    <td className="cell-strong">{product.name}</td>
                    <td>{product.category}</td>
                    <td>Rs. {purchasePrice.toLocaleString()}</td>
                    <td>Rs. {sellingPrice.toLocaleString()}</td>
                    <td className="cell-strong">Rs. {margin.toLocaleString()}</td>
                    <td>{stock}</td>
                    <td>
                      <span className={`badge ${isLowStock ? "badge-danger" : "badge-success"}`}>
                        {isLowStock ? "Low stock" : "In stock"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-icon danger"
                          onClick={() => handleDelete(product._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default Products;