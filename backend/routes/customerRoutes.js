const express = require("express");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const DeletedRecord = require("../models/DeletedRecord");
const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// =========================
// GET - Customer Purchases
// =========================

router.get("/:id/purchases", async (req, res) => {
  try {
    const invoices = await Invoice.find({
      customer: req.params.id,
    })
      .populate(
        "customer",
        "name phone email address"
      )
      .populate(
        "products.product",
        "name category"
      )
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({
      message:
        "Failed to fetch customer purchases",
      error: error.message,
    });
  }
});

// =========================
// GET - All Customers
// =========================

router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({
      createdAt: -1,
    });

    res.json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
});

// =========================
// GET - Single Customer
// =========================

router.get("/:id", async (req, res) => {
  try {
    const customer = await Customer.findById(
      req.params.id
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
});

// =========================
// POST - Add Customer
// Admin + Administration
// =========================

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
    } = req.body;

    const customer = new Customer({
      name,
      phone,
      email,
      address,
    });

    const savedCustomer =
      await customer.save();

    res.status(201).json(savedCustomer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add customer",
      error: error.message,
    });
  }
});

// =========================
// PUT - Update Customer
// ADMIN ONLY
// =========================

router.put(
  "/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const updatedCustomer =
        await Customer.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedCustomer) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      res.json(updatedCustomer);
    } catch (error) {
      res.status(500).json({
        message:
          "Failed to update customer",
        error: error.message,
      });
    }
  }
);

// =========================
// DELETE - Delete Customer
// Admin + Administration
// =========================

router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const customer =
        await Customer.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({
          message: "Customer not found",
        });
      }

      // Save deleted customer record
      await DeletedRecord.create({
        recordType: "customer",
        recordId: customer._id,
        recordData: customer.toObject(),
        deletedBy: req.admin.id,
        deletedByName:
          req.admin.name || "Unknown",
        deletedByRole:
          req.admin.role ||
          "administration",
      });

      // Delete customer from active customers
      await Customer.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Customer deleted successfully",
      });
    } catch (error) {
      console.log(
        "DELETE CUSTOMER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete customer",
        error: error.message,
      });
    }
  }
);

module.exports = router;