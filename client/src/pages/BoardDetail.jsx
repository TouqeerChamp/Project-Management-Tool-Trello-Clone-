import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { removeToken } from '../utils/auth';
import listAPI from '../api/lists';
import cardAPI from '../api/cards';
import boardAPI from '../api/boards';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

const BoardDetail = () => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // For delete confirmation
  const [deletingItem, setDeletingItem] = useState(null); // 'list' or 'card' to indicate what's being deleted
  const [editingCard, setEditingCard] = useState(null); // Card ID that is being edited
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardPriority, setEditCardPriority] = useState('Medium');
  const [editCardDueDate, setEditCardDueDate] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0); // Track online users
  const [showChat, setShowChat] = useState(false); // Toggle chat sidebar
  const [showMobileChat, setShowMobileChat] = useState(false); // Toggle chat sidebar on mobile
  const [messages, setMessages] = useState([]); // Store chat messages
  const [newMessage, setNewMessage] = useState(''); // Store new message to send

  // State for creating new list
  const [showListModal, setShowListModal] = useState(false);
  const [listTitle, setListTitle] = useState('');

  // State for creating new card
  const [cardInputs, setCardInputs] = useState({}); // To track card inputs per list
  const [showCardInputs, setShowCardInputs] = useState({}); // To track which lists show card input

  // Fetch board and lists data
  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  // Socket.IO connection handling
  useEffect(() => {
    // Join the board room when component mounts
    socket.emit('joinBoard', boardId);

    // Listen for card movement events from other users
    socket.on('cardMoved', (data) => {
      // Update the UI to reflect the card movement from other users
      setLists(prevLists => {
        const updatedLists = [...prevLists];

        // Find source and destination lists
        const sourceListIndex = updatedLists.findIndex(list => list._id === data.sourceListId);
        const destListIndex = updatedLists.findIndex(list => list._id === data.destinationListId);

        if (sourceListIndex !== -1 && destListIndex !== -1) {
          if (sourceListIndex === destListIndex) {
            // Moving within the same list
            const list = updatedLists[sourceListIndex];
            const newCards = Array.from(list.cards);
            const [movedCard] = newCards.splice(data.sourceIndex, 1);
            newCards.splice(data.destinationIndex, 0, movedCard);

            updatedLists[sourceListIndex] = { ...list, cards: newCards };
          } else {
            // Moving to a different list
            const sourceList = updatedLists[sourceListIndex];
            const destList = updatedLists[destListIndex];

            const newSourceCards = Array.from(sourceList.cards);
            const [movedCard] = newSourceCards.splice(data.sourceIndex, 1);

            const newDestCards = Array.from(destList.cards);
            newDestCards.splice(data.destinationIndex, 0, movedCard);

            updatedLists[sourceListIndex] = { ...sourceList, cards: newSourceCards };
            updatedLists[destListIndex] = { ...destList, cards: newDestCards };
          }
        }

        return updatedLists;
      });
    });

    // Listen for user joined events
    socket.on('userJoined', (data) => {
      if (data.boardId === boardId) {
        setOnlineUsers(data.userCount);
      }
    });

    // Listen for user left events
    socket.on('userLeft', (data) => {
      if (data.boardId === boardId) {
        setOnlineUsers(data.userCount);
      }
    });

    // Listen for new messages
    socket.on('newMessage', (data) => {
      if (data.boardId === boardId) {
        setMessages(prev => [...prev, data]);
      }
    });

    // Cleanup function when component unmounts
    return () => {
      socket.emit('leaveBoard', boardId);
      socket.off('cardMoved');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('newMessage');
    };
  }, [boardId]);

  // Function to send a message
  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    // Emit message via socket
    socket.emit('sendMessage', {
      boardId,
      message: newMessage.trim(),
      user: 'Current User' // In a real app, you'd pass the actual user info
    });

    setNewMessage('');
  };

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      // First get board information
      const boardResponse = await boardAPI.getBoards();
      if (boardResponse.success) {
        const currentBoard = boardResponse.data.find(b => b._id === boardId);
        if (currentBoard) {
          setBoard(currentBoard);
        }
      }

      // Get lists with cards
      const response = await listAPI.getListsByBoardWithCards(boardId);
      if (response.success) {
        setLists(response.data);
      } else {
        setError(response.message || 'Failed to fetch lists');
      }
    } catch (err) {
      console.error('Error fetching board data:', err);
      setError(err.message || 'Failed to fetch board data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const response = await listAPI.createList({
        title: listTitle,
        boardId: boardId
      });

      if (response.success) {
        setLists([...lists, { ...response.data, cards: [] }]);
        setListTitle('');
        setShowListModal(false);
      } else {
        setError(response.message || 'Failed to create list');
      }
    } catch (err) {
      console.error('Error creating list:', err);
      setError(err.message || 'Failed to create list');
    }
  };

  const handleCreateCard = async (listId, e) => {
    e.preventDefault();
    const cardTitle = cardInputs[`${listId}_title`] || '';
    const cardDescription = cardInputs[`${listId}_description`] || '';
    const cardPriority = cardInputs[`${listId}_priority`] || 'Medium';
    const cardDueDate = cardInputs[`${listId}_dueDate`] || '';

    if (!cardTitle.trim()) {
      setError('Card title is required');
      return;
    }

    try {
      const response = await cardAPI.createCard({
        title: cardTitle,
        description: cardDescription,
        priority: cardPriority,
        dueDate: cardDueDate || null,
        listId: listId
      });

      if (response.success) {
        // Update the lists state to include the new card
        setLists(lists.map(list =>
          list._id === listId
            ? { ...list, cards: [...list.cards, response.data] }
            : list
        ));

        // Clear the inputs for this list
        setCardInputs({
          ...cardInputs,
          [`${listId}_title`]: '',
          [`${listId}_description`]: '',
          [`${listId}_priority`]: 'Medium',
          [`${listId}_dueDate`]: ''
        });

        // Hide input after creating card
        setShowCardInputs({ ...showCardInputs, [listId]: false });
      } else {
        setError(response.message || 'Failed to create card');
      }
    } catch (err) {
      console.error('Error creating card:', err);
      setError(err.message || 'Failed to create card');
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const toggleCardInput = (listId) => {
    setShowCardInputs({
      ...showCardInputs,
      [listId]: !showCardInputs[listId]
    });
  };

  const handleDeleteList = async (listId, listTitle) => {
    setShowDeleteConfirm({ id: listId, title: listTitle });
    setDeletingItem('list');
  };

  const handleDeleteCard = async (cardId, cardTitle, listId) => {
    setShowDeleteConfirm({ id: cardId, title: cardTitle, listId });
    setDeletingItem('card');
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      setLoading(true);

      let response;
      if (deletingItem === 'list') {
        response = await listAPI.deleteList(showDeleteConfirm.id);
      } else if (deletingItem === 'card') {
        response = await cardAPI.deleteCard(showDeleteConfirm.id);
      }

      if (response.success) {
        if (deletingItem === 'list') {
          // Remove the deleted list from the state
          setLists(lists.filter(list => list._id !== showDeleteConfirm.id));
        } else if (deletingItem === 'card') {
          // Remove the deleted card from its list
          setLists(lists.map(list =>
            list._id === showDeleteConfirm.listId
              ? { ...list, cards: list.cards.filter(card => card._id !== showDeleteConfirm.id) }
              : list
          ));
        }
        setShowDeleteConfirm(null);
        setDeletingItem(null);
      } else {
        setError(response.message || `Failed to delete ${deletingItem}`);
      }
    } catch (err) {
      console.error(`Error deleting ${deletingItem}:`, err);
      setError(err.message || `Failed to delete ${deletingItem}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
    setDeletingItem(null);
  };

  const handleEditCard = (card) => {
    setEditingCard(card._id);
    setEditCardTitle(card.title);
    setEditCardDescription(card.description || '');
    setEditCardPriority(card.priority || 'Medium');
    setEditCardDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
  };

  const handleUpdateCard = async (cardId, listId) => {
    try {
      setLoading(true);
      const response = await cardAPI.updateCard(cardId, {
        title: editCardTitle,
        description: editCardDescription,
        priority: editCardPriority,
        dueDate: editCardDueDate || null
      });

      if (response.success) {
        // Update the card in the state
        setLists(lists.map(list =>
          list._id === listId
            ? {
                ...list,
                cards: list.cards.map(card =>
                  card._id === cardId
                    ? {
                        ...card,
                        title: editCardTitle,
                        description: editCardDescription,
                        priority: editCardPriority,
                        dueDate: editCardDueDate || null
                      }
                    : card
                )
              }
            : list
        ));
        setEditingCard(null);
        setEditCardTitle('');
        setEditCardDescription('');
        setEditCardPriority('Medium');
        setEditCardDueDate('');
      } else {
        setError(response.message || 'Failed to update card');
      }
    } catch (err) {
      console.error('Error updating card:', err);
      setError(err.message || 'Failed to update card');
    } finally {
      setLoading(false);
    }
  };

  const cancelEditCard = () => {
    setEditingCard(null);
    setEditCardTitle('');
    setEditCardDescription('');
  };

  // Handle drag and drop end
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If there's no destination, the card was dropped outside a valid area
    if (!destination) return;

    // If the card was dropped in the same location, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the card being dragged
    const cardId = draggableId;

    // Update the UI immediately for a smooth experience
    // First, find the card from the current state
    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    // Find the card in the current lists state
    let cardToMove;
    let sourceListIndex;
    let cardIndex;

    lists.forEach((list, listIdx) => {
      const card = list.cards.find((c, cardIdx) => {
        if (c._id === cardId) {
          sourceListIndex = listIdx;
          cardIndex = cardIdx;
          return true;
        }
        return false;
      });
      if (card) {
        cardToMove = card;
      }
    });

    if (!cardToMove) return; // Card not found

    // Update the lists state to reflect the drag and drop
    if (sourceListId === destListId) {
      // Moving within the same list
      const list = lists[sourceListIndex];
      const newCards = Array.from(list.cards);
      const [movedCard] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, movedCard);

      const newLists = Array.from(lists);
      newLists[sourceListIndex] = { ...list, cards: newCards };

      setLists(newLists);

      // Emit socket event for real-time update
      socket.emit('cardMoved', {
        boardId,
        cardId,
        sourceListId,
        destinationListId: destListId,
        sourceIndex: source.index,
        destinationIndex: destination.index
      });
    } else {
      // Moving to a different list
      const sourceList = lists[sourceListIndex];
      const destListIndex = lists.findIndex(list => list._id === destListId);
      const destList = lists[destListIndex];

      const newSourceCards = Array.from(sourceList.cards);
      const [movedCard] = newSourceCards.splice(source.index, 1);

      const newDestCards = Array.from(destList.cards);
      newDestCards.splice(destination.index, 0, movedCard);

      const newLists = Array.from(lists);
      newLists[sourceListIndex] = { ...sourceList, cards: newSourceCards };
      newLists[destListIndex] = { ...destList, cards: newDestCards };

      setLists(newLists);

      // Update the card's listId in the backend
      try {
        await cardAPI.moveCard(cardId, destListId);
        // Success - card moved successfully

        // Emit socket event for real-time update
        socket.emit('cardMoved', {
          boardId,
          cardId,
          sourceListId,
          destinationListId: destListId,
          sourceIndex: source.index,
          destinationIndex: destination.index
        });
      } catch (error) {
        console.error('Error moving card:', error);
        setError(error.message || 'Failed to move card');

        // Revert the UI change if the backend update fails
        const revertedLists = Array.from(lists);
        revertedLists[destListIndex] = { ...destList, cards: Array.from(destList.cards).filter(c => c._id !== cardId) };
        revertedLists[sourceListIndex] = { ...sourceList, cards: [...sourceList.cards, cardToMove] };
        setLists(revertedLists);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 mx-4 max-w-md w-full border border-white/20">
          <div className="text-red-200 mb-4">{error}</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-600"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Glassmorphism Header */}
      <header className="backdrop-blur-lg bg-white/20 shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-white">
                {board ? board.title : 'Board Detail'}
              </h1>
              <p className="text-white/70">Manage your project tasks</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
              {/* User Presence Indicator */}
              <div className="flex items-center space-x-2 text-white/80 text-sm">
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${onlineUsers > 0 ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                  <span>{onlineUsers} online</span>
                </div>
              </div>
              {/* Mobile Chat Toggle Button */}
              <button
                onClick={() => setShowChat(true)}
                className="md:hidden bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowListModal(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 shadow-lg text-sm"
                >
                  Add List
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 text-sm"
                >
                  Back to Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Board Content and Chat Layout */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-150px)] w-full">
        {/* Main Content - Lists and Cards */}
        <div className={`w-full overflow-x-auto ${showChat && !showMobileChat ? 'md:w-3/4' : 'w-full'} px-4 py-4 md:p-8`}>
          {lists.length === 0 ? (
            <div className="text-center py-12">
              <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-8 max-w-md mx-auto shadow-xl border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">No lists yet</h3>
                <p className="text-white/70 mb-6">Start by adding your first list to organize tasks</p>
                <button
                  onClick={() => setShowListModal(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 shadow-lg"
                >
                  Create First List
                </button>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex space-x-4 overflow-x-auto pb-4">
                {lists.map((list) => (
                  <Droppable droppableId={list._id} key={list._id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`${snapshot.isDraggingOver ? 'bg-white/30' : ''} flex-shrink-0 w-72 backdrop-blur-lg bg-white/20 rounded-2xl p-4 shadow-xl border border-white/20`}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-white">{list.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-white/60 text-sm">{list.cards.length} cards</span>
                            <button
                              onClick={() => handleDeleteList(list._id, list.title)}
                              className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 rounded-full hover:bg-red-500/30 backdrop-blur-sm"
                              title="Delete List"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Cards in this list */}
                        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-2">
                          {list.cards.length > 0 ? (
                            list.cards.map((card, index) => (
                              editingCard === card._id ? (
                                // Edit mode for card
                                <div
                                  key={card._id}
                                  className="backdrop-blur-sm bg-white/30 rounded-lg p-3 border border-white/20 shadow-sm"
                                >
                                  <div className="flex flex-col space-y-2">
                                    <input
                                      type="text"
                                      value={editCardTitle}
                                      onChange={(e) => setEditCardTitle(e.target.value)}
                                      className="w-full px-2 py-1 text-sm bg-white/20 text-white placeholder-white/50 rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm"
                                      placeholder="Card title"
                                      required
                                    />
                                    <textarea
                                      value={editCardDescription}
                                      onChange={(e) => setEditCardDescription(e.target.value)}
                                      className="w-full px-2 py-1 text-sm bg-white/20 text-white placeholder-white/50 rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm resize-none"
                                      placeholder="Card description"
                                      rows="2"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <select
                                        value={editCardPriority}
                                        onChange={(e) => setEditCardPriority(e.target.value)}
                                        className="px-2 py-1 text-sm bg-white/20 text-white rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm"
                                      >
                                        <option value="High" className="text-red-600">High</option>
                                        <option value="Medium" className="text-yellow-600">Medium</option>
                                        <option value="Low" className="text-green-600">Low</option>
                                      </select>
                                      <input
                                        type="date"
                                        value={editCardDueDate}
                                        onChange={(e) => setEditCardDueDate(e.target.value)}
                                        className="px-2 py-1 text-sm bg-white/20 text-white rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm"
                                      />
                                    </div>
                                    <div className="flex space-x-1 mt-1">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCard(card._id, list._id)}
                                        disabled={loading}
                                        className="flex-1 text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white py-1 rounded hover:from-blue-600 hover:to-purple-600 transition duration-200 disabled:opacity-50"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelEditCard}
                                        disabled={loading}
                                        className="flex-1 text-xs bg-white/20 text-white py-1 rounded hover:bg-white/30 transition duration-200 disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // View mode for card - now draggable
                                <Draggable key={card._id} draggableId={card._id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`backdrop-blur-sm bg-white/30 rounded-lg p-3 border border-white/20 shadow-sm hover:shadow-md transition-shadow duration-200 relative ${
                                        snapshot.isDragging ? 'shadow-xl transform scale-105' : ''
                                      }`}
                                    >
                                      <div className="flex justify-end space-x-1 mb-1">
                                        <button
                                          onClick={() => handleEditCard(card)}
                                          className="text-blue-300 hover:text-blue-200 transition-colors duration-200 p-1 rounded-full hover:bg-blue-500/30 backdrop-blur-sm"
                                          title="Edit Card"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteCard(card._id, card.title, list._id)}
                                          className="text-red-400 hover:text-red-300 transition-colors duration-200 p-1 rounded-full hover:bg-red-500/30 backdrop-blur-sm"
                                          title="Delete Card"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </button>
                                      </div>
                                      <h4 className="text-white font-medium text-sm">{card.title}</h4>
                                      {card.description && (
                                        <p className="text-white/70 text-xs mt-1">{card.description}</p>
                                      )}
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {card.priority && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            card.priority === 'High'
                                              ? 'bg-red-500/30 text-red-200 border border-red-400/30'
                                              : card.priority === 'Medium'
                                                ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400/30'
                                                : 'bg-green-500/30 text-green-200 border border-green-400/30'
                                          } backdrop-blur-sm`}>
                                            {card.priority}
                                          </span>
                                        )}
                                        {card.dueDate && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                            new Date(card.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
                                              ? 'bg-red-600/50 text-red-100 border border-red-500/50'
                                              : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                                          } backdrop-blur-sm`}>
                                            {new Date(card.dueDate).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            ))
                          ) : (
                            <div className="text-center py-4 text-white/50 text-sm italic">
                              No cards yet
                            </div>
                          )}
                          {provided.placeholder}
                        </div>

                        {/* Add Card Input */}
                        {showCardInputs[list._id] && (
                          <form onSubmit={(e) => handleCreateCard(list._id, e)} className="mb-2 space-y-2">
                            <input
                              type="text"
                              value={cardInputs[`${list._id}_title`] || ''}
                              onChange={(e) => setCardInputs({
                                ...cardInputs,
                                [`${list._id}_title`]: e.target.value
                              })}
                              placeholder="Enter card title..."
                              className="w-full px-3 py-2 text-sm bg-white/20 text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300 backdrop-blur-sm"
                              required
                            />
                            <textarea
                              value={cardInputs[`${list._id}_description`] || ''}
                              onChange={(e) => setCardInputs({
                                ...cardInputs,
                                [`${list._id}_description`]: e.target.value
                              })}
                              placeholder="Enter card description..."
                              className="w-full px-3 py-2 text-sm bg-white/20 text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300 backdrop-blur-sm resize-none"
                              rows="2"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={cardInputs[`${list._id}_priority`] || 'Medium'}
                                onChange={(e) => setCardInputs({
                                  ...cardInputs,
                                  [`${list._id}_priority`]: e.target.value
                                })}
                                className="px-2 py-1 text-sm bg-white/20 text-white rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm"
                              >
                                <option value="High" className="text-red-600">High</option>
                                <option value="Medium" className="text-yellow-600">Medium</option>
                                <option value="Low" className="text-green-600">Low</option>
                              </select>
                              <input
                                type="date"
                                value={cardInputs[`${list._id}_dueDate`] || ''}
                                onChange={(e) => setCardInputs({
                                  ...cardInputs,
                                  [`${list._id}_dueDate`]: e.target.value
                                })}
                                className="px-2 py-1 text-sm bg-white/20 text-white rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition duration-200"
                              >
                                Add Card
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleCardInput(list._id)}
                                className="flex-1 bg-white/20 text-white text-xs py-2 rounded-lg hover:bg-white/30 transition duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Add Card Button */}
                        {!showCardInputs[list._id] && (
                          <button
                            onClick={() => toggleCardInput(list._id)}
                            className="w-full bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30"
                          >
                            + Add Card
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                ))}

                {/* Add new list button */}
                <button
                  onClick={() => setShowListModal(true)}
                  className="flex-shrink-0 w-72 h-48 flex items-center justify-center backdrop-blur-lg bg-white/10 hover:bg-white/20 rounded-2xl border-2 border-dashed border-white/30 text-white hover:text-white/90 transition duration-200"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">+</div>
                    <div className="text-sm font-medium">Add New List</div>
                  </div>
                </button>
              </div>
            </DragDropContext>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className={`${showChat ? 'block' : 'hidden'} md:block fixed md:relative inset-0 md:inset-auto z-40 md:z-auto`}>
          <div className="fixed inset-0 bg-black/50 md:hidden" onClick={() => setShowChat(false)}></div>
          <div className="w-full md:w-80 h-[calc(100vh-150px)] md:h-auto backdrop-blur-lg bg-white/20 rounded-2xl shadow-xl border border-white/20 flex flex-col ml-2 md:ml-0 absolute md:relative top-0 md:top-auto right-0 md:right-auto">
            <div className="p-4 border-b border-white/20">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Board Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white/70 hover:text-white md:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="text-white/70 text-sm mt-1">
                {onlineUsers} {onlineUsers === 1 ? 'person' : 'people'} online
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div key={index} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-white text-sm">{msg.user}</div>
                      <div className="text-white/60 text-xs">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-white/90 mt-1">{msg.message}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/50 py-8">
                  No messages yet. Start the conversation!
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/20">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/20 text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-300 backdrop-blur-sm"
                />
                <button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-2 rounded-lg transition duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create List Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Create New List</h2>
              <button
                onClick={() => {
                  setShowListModal(false);
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateList}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="listTitle">
                  List Title
                </label>
                <input
                  type="text"
                  id="listTitle"
                  value={listTitle}
                  onChange={(e) => setListTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter list title"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowListModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
                >
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Confirm Delete</h2>
              <button
                onClick={cancelDelete}
                className="text-white/70 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white/90 mb-2">Are you sure you want to delete this {deletingItem}?</p>
              <p className="text-white/70 font-semibold">"{showDeleteConfirm.title}"</p>
              <p className="text-red-300 text-sm mt-2">Warning: This action cannot be undone.</p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={loading}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDetail;