const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');

const router = express.Router();

// @desc    Create a new card inside a list
// @route   POST /api/cards
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, listId, priority, dueDate } = req.body;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Card title is required',
      });
    }

    if (!listId) {
      return res.status(400).json({
        success: false,
        message: 'List ID is required',
      });
    }

    // Check if list exists
    const list = await List.findById(listId).populate('board');
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    // Check if the board (and thus the list) belongs to the user
    if (list.board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add card to this list',
      });
    }

    // Validate priority if provided
    if (priority && !['High', 'Medium', 'Low'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Priority must be High, Medium, or Low',
      });
    }

    let parsedDueDate = null;
    if (dueDate) {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid due date format',
        });
      }
      parsedDueDate = date;
    }

    // Create new card
    const card = new Card({
      title: title.trim(),
      description: description ? description.trim() : '',
      list: listId,
      priority: priority || undefined, // Use undefined to let the schema default apply
      dueDate: parsedDueDate,
    });

    await card.save();

    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      data: card,
    });
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating card',
      error: error.message,
    });
  }
});

// @desc    Get all cards for a specific list
// @route   GET /api/cards/list/:listId
// @access  Private
router.get('/list/:listId', authMiddleware, async (req, res) => {
  try {
    const { listId } = req.params;

    // Check if list exists
    const list = await List.findById(listId).populate('board');
    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'List not found',
      });
    }

    // Check if the board (and thus the list) belongs to the user
    if (list.board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view cards for this list',
      });
    }

    const cards = await Card.find({ list: listId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching cards',
      error: error.message,
    });
  }
});

// @desc    Update a card
// @route   PUT /api/cards/:id
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, listId, priority, dueDate } = req.body;

    // Find the card and the associated list/board
    const card = await Card.findById(req.params.id).populate({
      path: 'list',
      populate: { path: 'board' }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    // Check if the board belongs to the user
    if (card.list.board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this card',
      });
    }

    // Validate title if provided
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Card title is required',
        });
      }
      card.title = title.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      card.description = description.trim();
    }

    // Update priority if provided
    if (priority !== undefined) {
      if (!['High', 'Medium', 'Low'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be High, Medium, or Low',
        });
      }
      card.priority = priority;
    }

    // Update dueDate if provided
    if (dueDate !== undefined) {
      if (dueDate) {
        const date = new Date(dueDate);
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid due date format',
          });
        }
        card.dueDate = date;
      } else {
        card.dueDate = null;
      }
    }

    // Update listId if provided
    if (listId !== undefined) {
      // Check if the new list exists and belongs to the same board
      const newList = await List.findById(listId).populate('board');
      if (!newList) {
        return res.status(404).json({
          success: false,
          message: 'Target list not found',
        });
      }

      // Ensure the target list belongs to the same user
      if (newList.board.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to move card to this list',
        });
      }

      card.list = listId;
    }

    await card.save();

    res.status(200).json({
      success: true,
      message: 'Card updated successfully',
      data: card,
    });
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating card',
      error: error.message,
    });
  }
});

// @desc    Delete a card
// @route   DELETE /api/cards/:id
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Find the card and the associated list/board
    const card = await Card.findById(req.params.id).populate({
      path: 'list',
      populate: { path: 'board' }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Card not found',
      });
    }

    // Check if the board belongs to the user
    if (card.list.board.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this card',
      });
    }

    await Card.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting card',
      error: error.message,
    });
  }
});

module.exports = router;