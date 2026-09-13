const express = require("express");
const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const DeletedRecord = require("../models/DeletedRecord");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET - ALL INVOICES
// =========================

router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("customer", "name phone email")
      .populate("products.product", "name category")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.log("GET INVOICES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
});

// =========================
// GET - SINGLE INVOICE
// =========================

router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate(
        "customer",
        "name phone email address"
      )
      .populate(
        "products.product",
        "name category"
      );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.json(invoice);
  } catch (error) {
    console.log("GET SINGLE INVOICE ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
});

// =========================
// POST - CREATE INVOICE
// Admin + Administration
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      customer,
      products,
      discount = 0,
      paidAmount = 0,
      paymentMethod = "cash",
    } = req.body;

    // =========================
    // BASIC VALIDATION
    // =========================

    if (
      !customer ||
      !products ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return res.status(400).json({
        message:
          "Customer and products are required",
      });
    }

    const discountNumber =
      Number(discount) || 0;

    const paidAmountNumber =
      Number(paidAmount) || 0;

    let subtotal = 0;
    let totalProfit = 0;

    const invoiceProducts = [];

    // =========================
    // CHECK PRODUCTS
    // =========================

    for (const item of products) {
      const product =
        await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message:
            `Product not found: ${item.product}`,
        });
      }

      const quantity =
        Number(item.quantity);

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          message:
            "Quantity must be greater than 0",
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          message:
            `${product.name} has only ${product.stock} items in stock`,
        });
      }

      const sellingPrice =
        Number(item.price) ||
        Number(product.sellingPrice);

      const purchasePrice =
        Number(product.purchasePrice);

      const total =
        sellingPrice * quantity;

      // Product profit
      const productProfit =
        (sellingPrice - purchasePrice) *
        quantity;

      subtotal += total;
      totalProfit += productProfit;

      invoiceProducts.push({
        product: product._id,
        quantity,
        price: sellingPrice,
        purchasePrice,
        total,
      });
    }

    // =========================
    // CALCULATE GRAND TOTAL
    // =========================

    const grandTotal = Math.max(
      subtotal - discountNumber,
      0
    );

    // =========================
    // CALCULATE PAID
    // =========================

    const paid = Math.min(
      Math.max(paidAmountNumber, 0),
      grandTotal
    );

    // =========================
    // CALCULATE PENDING
    // =========================

    const pendingAmount = Math.max(
      grandTotal - paid,
      0
    );

    // =========================
    // GENERATE INVOICE NUMBER
    // =========================

    const invoiceNumber =
      `INV-${Date.now()}`;

    // =========================
    // CREATE INVOICE
    // =========================

    const invoice = new Invoice({
      invoiceNumber,
      customer,
      products: invoiceProducts,
      subtotal,
      discount: discountNumber,
      grandTotal,
      profit: totalProfit,
      paidAmount: paid,
      pendingAmount,
      paymentMethod,
    });

    const savedInvoice =
      await invoice.save();

    // =========================
    // REDUCE PRODUCT STOCK
    // =========================

    for (const item of invoiceProducts) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: -Number(item.quantity),
          },
        }
      );
    }

    // =========================
    // GET COMPLETE INVOICE
    // =========================

    const completeInvoice =
      await Invoice.findById(
        savedInvoice._id
      )
        .populate(
          "customer",
          "name phone email address"
        )
        .populate(
          "products.product",
          "name category"
        );

    res.status(201).json(
      completeInvoice
    );
  } catch (error) {
    console.log(
      "CREATE INVOICE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create invoice",
      error: error.message,
    });
  }
});

// =========================
// PUT - UPDATE INVOICE
// ADMIN ONLY
// =========================

router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const invoice =
        await Invoice.findById(
          req.params.id
        );

      if (!invoice) {
        return res.status(404).json({
          message:
            "Invoice not found",
        });
      }

      // =========================
      // GET UPDATED VALUES
      // =========================

      const discount =
        Math.max(
          Number(req.body.discount) || 0,
          0
        );

      const paidAmount =
        Math.max(
          Number(req.body.paidAmount) || 0,
          0
        );

      const paymentMethod =
        req.body.paymentMethod ||
        invoice.paymentMethod ||
        "cash";

      // =========================
      // RECALCULATE TOTALS
      // =========================

      const grandTotal = Math.max(
        Number(invoice.subtotal) -
          discount,
        0
      );

      const paid = Math.min(
        paidAmount,
        grandTotal
      );

      const pendingAmount =
        Math.max(
          grandTotal - paid,
          0
        );

      // =========================
      // UPDATE INVOICE
      // =========================

      invoice.discount = discount;
      invoice.grandTotal = grandTotal;
      invoice.paidAmount = paid;
      invoice.pendingAmount =
        pendingAmount;
      invoice.paymentMethod =
        paymentMethod;

      await invoice.save();

      // =========================
      // RETURN UPDATED INVOICE
      // =========================

      const updatedInvoice =
        await Invoice.findById(
          invoice._id
        )
          .populate(
            "customer",
            "name phone email"
          )
          .populate(
            "products.product",
            "name category"
          );

      res.json(updatedInvoice);
    } catch (error) {
      console.log(
        "UPDATE INVOICE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update invoice",
        error: error.message,
      });
    }
  }
);

// =========================
// DELETE - INVOICE
// Admin + Administration
// =========================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    console.log("DELETE INVOICE ROUTE HIT:", req.params.id);
    try {
      // =========================
      // FIND INVOICE
      // =========================

      const invoice =
        await Invoice.findById(
          req.params.id
        );

      if (!invoice) {
        return res.status(404).json({
          message:
            "Invoice not found",
        });
      }

      // =========================
      // RESTORE PRODUCT STOCK
      // =========================

      for (const item of invoice.products) {
        if (!item.product) {
          console.log(
            "Product reference missing:",
            item
          );

          continue;
        }

        const product =
          await Product.findById(
            item.product
          );

        if (!product) {
          console.log(
            "Product not found while restoring stock:",
            item.product
          );

          continue;
        }

        const quantity =
          Number(item.quantity) || 0;

        product.stock =
          Number(product.stock || 0) +
          quantity;

        await product.save();

        console.log(
          `Stock restored: ${product.name} +${quantity}`
        );
      }

      // =========================
      // SAVE DELETED RECORD
      // =========================

      await DeletedRecord.create({
        recordType: "invoice",
        recordId: invoice._id,
        recordData:
          invoice.toObject(),
        deletedBy:
          req.admin.id,
        deletedByName:
          req.admin.name ||
          "Unknown",
        deletedByRole:
          req.admin.role ||
          "administration",
      });

      // =========================
      // DELETE INVOICE
      // =========================

      await Invoice.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Invoice deleted successfully and stock restored",
      });
    } catch (error) {
      console.log(
        "DELETE INVOICE ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete invoice",
        error: error.message,
      });
    }
  }
);

module.exports = router;