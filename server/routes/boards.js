const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Board = require('../models/Board');

const router = express.Router();

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Board title is required',
      });
    }

    // Create new board
    const board = new Board({
      title: title.trim(),
      user: req.user._id, // User ID from auth middleware
    });

    await board.save();

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      data: board,
    });
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating board',
      error: error.message,
    });
  }
});

// @desc    Get all boards for the logged-in user
// @route   GET /api/boards
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const boards = await Board.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: boards.length,
      data: boards,
    });
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching boards',
      error: error.message,
    });
  }
});

// @desc    Get dashboard stats for the logged-in user
// @route   GET /api/boards/stats
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Get all boards for the user
    const boards = await Board.find({ user: req.user._id });

    if (boards.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalBoards: 0,
          totalCards: 0,
          recentBoards: []
        }
      });
    }

    const boardIds = boards.map(board => board._id);

    // Get all lists that belong to user's boards
    const List = require('../models/List');
    const lists = await List.find({ board: { $in: boardIds } });
    const listIds = lists.map(list => list._id);

    // Get all cards that belong to those lists
    const Card = require('../models/Card');
    const cards = await Card.find({ list: { $in: listIds } });

    // Get recent boards (most recently created)
    const recentBoards = boards
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .map(board => ({
        _id: board._id,
        title: board.title,
        createdAt: board.createdAt
      }));

    res.status(200).json({
      success: true,
      stats: {
        totalBoards: boards.length,
        totalCards: cards.length,
        recentBoards
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats',
      error: error.message,
    });
  }
});

// @desc    Update a board
// @route   PUT /api/boards/:id
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;

    // Find the board and make sure it belongs to the user
    const board = await Board.findOne({ _id: req.params.id, user: req.user._id });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found or not authorized',
      });
    }

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Board title is required',
        });
      }
      board.title = title.trim();
    }

    await board.save();

    res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      data: board,
    });
  } catch (error) {
    console.error('Error updating board:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating board',
      error: error.message,
    });
  }
});

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Find the board and make sure it belongs to the user
    const board = await Board.findOne({ _id: req.params.id, user: req.user._id });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found or not authorized',
      });
    }

    await Board.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting board:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting board',
      error: error.message,
    });
  }
});

module.exports = router;