import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { removeToken } from '../utils/auth';
import listAPI from '../api/lists';
import cardAPI from '../api/cards';
import boardAPI from '../api/boards';
import { useSocket } from '../context/SocketContext';

const BoardDetail = () => {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { socket, onlineUsers, setOnlineUsers } = useSocket();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); 
  const [deletingItem, setDeletingItem] = useState(null); 
  const [editingCard, setEditingCard] = useState(null); 
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardPriority, setEditCardPriority] = useState('Medium');
  const [editCardDueDate, setEditCardDueDate] = useState('');
  const [showChat, setShowChat] = useState(false); 
  const [showMobileChat, setShowMobileChat] = useState(false); 
  const [messages, setMessages] = useState([]); 
  const [newMessage, setNewMessage] = useState(''); 

  const [showListModal, setShowListModal] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [cardInputs, setCardInputs] = useState({}); 
  const [showCardInputs, setShowCardInputs] = useState({}); 

  useEffect(() => {
    fetchBoardData();
  }, [boardId]);

  // Socket.IO connection handling
  useEffect(() => {
    if (!socket) return;

    // Join the board room
    socket.emit('joinBoard', boardId);

    socket.on('cardMoved', (data) => {
      setLists(prevLists => {
        const updatedLists = [...prevLists];
        const sourceListIndex = updatedLists.findIndex(list => list._id === data.sourceListId);
        const destListIndex = updatedLists.findIndex(list => list._id === data.destinationListId);

        if (sourceListIndex !== -1 && destListIndex !== -1) {
          if (sourceListIndex === destListIndex) {
            const list = updatedLists[sourceListIndex];
            const newCards = Array.from(list.cards);
            const [movedCard] = newCards.splice(data.sourceIndex, 1);
            newCards.splice(data.destinationIndex, 0, movedCard);
            updatedLists[sourceListIndex] = { ...list, cards: newCards };
          } else {
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

    socket.on('userJoined', (data) => {
      if (data.boardId === boardId) setOnlineUsers(data.userCount);
    });

    socket.on('userLeft', (data) => {
      if (data.boardId === boardId) setOnlineUsers(data.userCount);
    });

    socket.on('newMessage', (data) => {
      if (data.boardId === boardId) setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.emit('leaveBoard', boardId);
      socket.off('cardMoved');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('newMessage');
    };
  }, [boardId, socket]);

  const sendMessage = () => {
    if (newMessage.trim() === '' || !socket) return;
    socket.emit('sendMessage', {
      boardId,
      message: newMessage.trim(),
      user: 'Current User' 
    });
    setNewMessage('');
  };

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      const boardResponse = await boardAPI.getBoards();
      if (boardResponse.success) {
        const currentBoard = boardResponse.data.find(b => b._id === boardId);
        if (currentBoard) setBoard(currentBoard);
      }
      const response = await listAPI.getListsByBoardWithCards(boardId);
      if (response.success) {
        setLists(response.data);
      } else {
        setError(response.message || 'Failed to fetch lists');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch board data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const response = await listAPI.createList({ title: listTitle, boardId });
      if (response.success) {
        setLists([...lists, { ...response.data, cards: [] }]);
        setListTitle('');
        setShowListModal(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to create list');
    }
  };

  const handleCreateCard = async (listId, e) => {
    e.preventDefault();
    const title = cardInputs[`${listId}_title`] || '';
    if (!title.trim()) return setError('Card title is required');

    try {
      const response = await cardAPI.createCard({
        title,
        description: cardInputs[`${listId}_description`] || '',
        priority: cardInputs[`${listId}_priority`] || 'Medium',
        dueDate: cardInputs[`${listId}_dueDate`] || null,
        listId
      });
      if (response.success) {
        setLists(lists.map(l => l._id === listId ? { ...l, cards: [...l.cards, response.data] } : l));
        setCardInputs({ ...cardInputs, [`${listId}_title`]: '', [`${listId}_description`]: '' });
        setShowCardInputs({ ...showCardInputs, [listId]: false });
      }
    } catch (err) {
      setError(err.message || 'Failed to create card');
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const cardId = draggableId;
    const sourceListId = source.droppableId;
    const destListId = destination.droppableId;

    let cardToMove;
    const newLists = [...lists];
    const sourceListIndex = newLists.findIndex(l => l._id === sourceListId);
    const destListIndex = newLists.findIndex(l => l._id === destListId);

    const sourceCards = [...newLists[sourceListIndex].cards];
    [cardToMove] = sourceCards.splice(source.index, 1);
    
    if (sourceListId === destListId) {
      sourceCards.splice(destination.index, 0, cardToMove);
      newLists[sourceListIndex].cards = sourceCards;
    } else {
      const destCards = [...newLists[destListIndex].cards];
      destCards.splice(destination.index, 0, cardToMove);
      newLists[sourceListIndex].cards = sourceCards;
      newLists[destListIndex].cards = destCards;
      await cardAPI.moveCard(cardId, destListId);
    }

    setLists(newLists);
    socket.emit('cardMoved', {
      boardId, cardId, sourceListId, destinationListId: destListId,
      sourceIndex: source.index, destinationIndex: destination.index
    });
  };

  const handleLogout = () => { removeToken(); navigate('/login'); };
  const toggleCardInput = (listId) => setShowCardInputs({ ...showCardInputs, [listId]: !showCardInputs[listId] });
  const handleDeleteList = (listId, title) => { setShowDeleteConfirm({ id: listId, title }); setDeletingItem('list'); };
  const handleDeleteCard = (cardId, title, listId) => { setShowDeleteConfirm({ id: cardId, title, listId }); setDeletingItem('card'); };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      const res = deletingItem === 'list' ? await listAPI.deleteList(showDeleteConfirm.id) : await cardAPI.deleteCard(showDeleteConfirm.id);
      if (res.success) {
        if (deletingItem === 'list') setLists(lists.filter(l => l._id !== showDeleteConfirm.id));
        else setLists(lists.map(l => l._id === showDeleteConfirm.listId ? { ...l, cards: l.cards.filter(c => c._id !== showDeleteConfirm.id) } : l));
        setShowDeleteConfirm(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !board) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      <header className="backdrop-blur-lg bg-white/20 shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{board?.title || 'Board'}</h1>
            <p className="text-white/70">{onlineUsers} online</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowListModal(true)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm">Add List</button>
            <button onClick={() => setShowChat(!showChat)} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm">💬 Chat</button>
            <button onClick={() => navigate('/dashboard')} className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm">Dashboard</button>
            <button onClick={handleLogout} className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm">Logout</button>
          </div>
        </div>
      </header>

      <div className="flex p-8 overflow-x-auto space-x-4 h-[calc(100vh-120px)]">
        <DragDropContext onDragEnd={onDragEnd}>
          {lists.map((list) => (
            <Droppable droppableId={list._id} key={list._id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="w-72 flex-shrink-0 bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/20 h-fit">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold">{list.title}</h3>
                    <button onClick={() => handleDeleteList(list._id, list.title)} className="text-red-400">🗑</button>
                  </div>
                  <div className="space-y-3 min-h-[10px]">
                    {list.cards.map((card, index) => (
                      <Draggable key={card._id} draggableId={card._id} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="bg-white/30 p-3 rounded-lg border border-white/20 text-white shadow-sm">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="opacity-70">{card.priority}</span>
                                <button onClick={() => handleDeleteCard(card._id, card.title, list._id)}>×</button>
                            </div>
                            <p className="text-sm font-medium">{card.title}</p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                  <button onClick={() => toggleCardInput(list._id)} className="w-full mt-4 text-white/70 text-sm">+ Add Card</button>
                  {showCardInputs[list._id] && (
                    <form onSubmit={(e) => handleCreateCard(list._id, e)} className="mt-2 space-y-2">
                        <input 
                            className="w-full bg-white/20 p-2 rounded text-sm text-white outline-none" 
                            placeholder="Title" 
                            onChange={e => setCardInputs({...cardInputs, [`${list._id}_title`]: e.target.value})}
                        />
                        <button type="submit" className="w-full bg-blue-500 text-white text-xs py-1 rounded">Save</button>
                    </form>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
        <button onClick={() => setShowListModal(true)} className="w-72 flex-shrink-0 bg-white/10 border-2 border-dashed border-white/30 rounded-2xl text-white h-20">+ Add New List</button>
      </div>

      {showListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New List</h2>
            <input className="w-full border p-2 rounded mb-4" value={listTitle} onChange={e => setListTitle(e.target.value)} placeholder="Title"/>
            <div className="flex justify-end gap-2">
                <button onClick={() => setShowListModal(false)}>Cancel</button>
                <button onClick={handleCreateList} className="bg-blue-500 text-white px-4 py-2 rounded">Create</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-2xl max-w-sm w-full">
                <p className="mb-4">Delete "{showDeleteConfirm.title}"?</p>
                <div className="flex justify-end gap-2">
                    <button onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
                    <button onClick={confirmDelete} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
                </div>
            </div>
        </div>
      )}

      {showChat && (
        <div className="fixed right-4 bottom-4 w-80 bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="bg-purple-500 text-white p-3 flex justify-between items-center">
            <h3 className="font-bold">💬 Board Chat</h3>
            <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200">✕</button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center">No messages yet</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg shadow-sm">
                  <p className="text-xs font-bold text-purple-600">{msg.user}</p>
                  <p className="text-sm text-gray-800">{msg.message}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardDetail;