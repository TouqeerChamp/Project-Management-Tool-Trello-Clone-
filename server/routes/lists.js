const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');

const router = express.Router();

// @desc    Create a new list inside a board
// @route   POST /api/lists
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, boardId } = req.body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'List title is required',
      });
    }

    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: 'Board ID is required',
      });
    }

    // Check if board exists and belongs to the user
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    if (board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add list to this board',
      });
    }

    // Create new list
    const list = new List({
      title: title.trim(),
      board: boardId,
    });

    await list.save();

    res.status(201).json({
      success: true,
      message: 'List created successfully',
      data: list,
    });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating list',
      error: error.message,
    });
  }
});

// @desc    Get all lists for a specific board
// @route   GET /api/lists/board/:boardId
// @access  Private
router.get('/board/:boardId', authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;

    // Check if board exists and belongs to the user
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    if (board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view lists for this board',
      });
    }

    const lists = await List.find({ board: boardId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: lists.length,
      data: lists,
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lists',
      error: error.message,
    });
  }
});

// @desc    Get all lists and cards for a specific board
// @route   GET /api/lists/board/:boardId/with-cards
// @access  Private
router.get('/board/:boardId/with-cards', authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;

    // Check if board exists and belongs to the user
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    if (board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view lists for this board',
      });
    }

    // Get all lists for the board
    const lists = await List.find({ board: boardId }).sort({ createdAt: 1 });

    // For each list, get all cards
    const listsWithCards = await Promise.all(
      lists.map(async (list) => {
        const cards = await Card.find({ list: list._id }).sort({ createdAt: 1 });
        return {
          ...list.toObject(),
          cards,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: listsWithCards.length,
      data: listsWithCards,
    });
  } catch (error) {
    console.error('Error fetching lists with cards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching lists with cards',
      error: error.message,
    });
  }
});

// @desc    Update a list
// @route   PUT /api/lists/:id
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    // Find the list and the associated board
    const list = await List.findById(req.params.id).populate('board');

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    // Check if the board belongs to the user
    if (list.board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this list',
      });
    }

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'List title is required',
        });
      }
      list.title = title.trim();
    }

    await list.save();

    res.status(200).json({
      success: true,
      message: 'List updated successfully',
      data: list,
    });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating list',
      error: error.message,
    });
  }
});

// @desc    Delete a list
// @route   DELETE /api/lists/:id
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Find the list and the associated board
    const list = await List.findById(req.params.id).populate('board');

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    // Check if the board belongs to the user
    if (list.board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this list',
      });
    }

    // Delete all cards associated with this list first
    await Card.deleteMany({ list: req.params.id });

    // Delete the list
    await List.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting list',
      error: error.message,
    });
  }
});

module.exports = router;