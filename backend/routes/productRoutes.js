const express = require("express");
const Product = require("../models/Product");
const DeletedRecord = require("../models/DeletedRecord");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET - ALL PRODUCTS
// =========================

router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// =========================
// POST - ADD PRODUCT
// Administration + Admin
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      category,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockLimit,
    } = req.body;

    const product = new Product({
      name,
      category,
      purchasePrice,
      sellingPrice,
      stock,
      lowStockLimit,
    });

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add product",
      error: error.message,
    });
  }
});

// =========================
// PUT - UPDATE PRODUCT
// ADMIN ONLY
// =========================

router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const updatedProduct =
        await Product.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedProduct) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({
        message: "Failed to update product",
        error: error.message,
      });
    }
  }
);

// =========================
// DELETE - PRODUCT
// Administration + Admin
// =========================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const product = await Product.findById(
        req.params.id
      );

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      // Save deleted product record
      await DeletedRecord.create({
        recordType: "product",
        recordId: product._id,
        recordData: product.toObject(),
        deletedBy: req.admin.id,
        deletedByName:
          req.admin.name || "Unknown",
        deletedByRole:
          req.admin.role || "administration",
      });

      // Delete product from active products
      await Product.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.log(
        "DELETE PRODUCT ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete product",
        error: error.message,
      });
    }
  }
);

module.exports = router;