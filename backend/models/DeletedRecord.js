const mongoose = require("mongoose");

const deletedRecordSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      enum: ["product", "customer", "invoice", "user"],
      required: true,
    },

    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    recordData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    deletedByName: {
      type: String,
      required: true,
    },

    deletedByRole: {
      type: String,
      enum: ["admin", "administration"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DeletedRecord",
  deletedRecordSchema
);