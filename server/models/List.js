const mongoose = require('mongoose');

const listSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'List title is required'],
      trim: true,
      maxlength: [100, 'List title cannot exceed 100 characters'],
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'List must belong to a board'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('List', listSchema);