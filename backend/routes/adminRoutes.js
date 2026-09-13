const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const DeletedRecord = require("../models/DeletedRecord");

const authMiddleware = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ADMIN ONLY - GET ALL USERS
// =====================================================

router.get(
  "/users",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const users = await Admin.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      console.log("GET USERS ERROR:", error);

      res.status(500).json({
        message: "Failed to fetch users",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN ONLY - UPDATE USER
// =====================================================

router.put(
  "/users/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { name, email, role, password } = req.body;

      if (!["admin", "administration"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updateData = { name, email, role };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await Admin.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.log("UPDATE USER ERROR:", error);

      res.status(500).json({
        message: "Failed to update user",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN ONLY - DELETE USER
// =====================================================

router.delete(
  "/users/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      if (req.params.id === req.admin.id) {
        return res.status(400).json({
          message: "You cannot delete your own account",
        });
      }

      const user = await Admin.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await DeletedRecord.create({
        recordType: "user",
         recordId: user._id,
        recordData: {
          name: user.name,
          email: user.email,
          role: user.role,
        },
        deletedBy: req.admin.id,
        deletedByName: req.admin.name,
        deletedByRole: req.admin.role,
      });

      await user.deleteOne();

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.log("DELETE USER ERROR:", error);

      res.status(500).json({
        message: "Failed to delete user",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN ONLY - DELETED RECORDS
// =====================================================

router.get(
  "/deleted-records",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const deletedRecords =
        await DeletedRecord.find()
          .populate(
            "deletedBy",
            "name email role"
          )
          .sort({ createdAt: -1 });

      res.json(deletedRecords);
    } catch (error) {
      console.log(
        "DELETED RECORDS ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch deleted records",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN ONLY - PERMANENTLY DELETE A DELETED RECORD
// =====================================================

router.delete(
  "/deleted-records/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const record = await DeletedRecord.findById(req.params.id);

      if (!record) {
        return res.status(404).json({
          message: "Deleted record not found",
        });
      }

      await record.deleteOne();

      res.json({
        message: "Record permanently deleted",
      });
    } catch (error) {
      console.log("PERMANENT DELETE ERROR:", error);

      res.status(500).json({
        message: "Failed to permanently delete record",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN ONLY - CREATE USER
// =====================================================

router.post(
  "/register",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role = "administration",
      } = req.body;

      // -------------------------
      // VALIDATION
      // -------------------------

      if (!name || !email || !password) {
        return res.status(400).json({
          message:
            "Name, email and password are required",
        });
      }

      // -------------------------
      // CHECK ROLE
      // -------------------------

      if (
        !["admin", "administration"].includes(
          role
        )
      ) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      // -------------------------
      // CHECK EXISTING USER
      // -------------------------

      const existingAdmin =
        await Admin.findOne({ email });

      if (existingAdmin) {
        return res.status(400).json({
          message: "User already exists",
        });
      }

      // -------------------------
      // HASH PASSWORD
      // -------------------------

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      // -------------------------
      // CREATE USER
      // -------------------------

      const admin = new Admin({
        name,
        email,
        password: hashedPassword,
        role,
      });

      await admin.save();

      res.status(201).json({
        message:
          `${role} created successfully`,
      });
    } catch (error) {
      console.log(
        "CREATE USER ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create user",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN / ADMINISTRATION LOGIN
// =====================================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      // -------------------------
      // VALIDATION
      // -------------------------

      if (!email || !password) {
        return res.status(400).json({
          message:
            "Email and password are required",
        });
      }

      // -------------------------
      // FIND USER
      // -------------------------

      const admin =
        await Admin.findOne({ email });

      if (!admin) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      // -------------------------
      // CHECK PASSWORD
      // -------------------------

      const isPasswordCorrect =
        await bcrypt.compare(
          password,
          admin.password
        );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          message:
            "Invalid email or password",
        });
      }

      // -------------------------
      // CREATE JWT TOKEN
      // -------------------------

      const token = jwt.sign(
        {
          id: admin._id,
          name: admin.name,
          role: admin.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      // -------------------------
      // RESPONSE
      // -------------------------

      res.json({
        message:
          "Login successful",

        token,

        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.log(
        "LOGIN ERROR:",
        error
      );

      res.status(500).json({
        message:
          "Login failed",
        error: error.message,
      });
    }
  }
);

module.exports = router;