import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/auth';
import boardAPI from '../api/boards';
import listAPI from '../api/lists';
import cardAPI from '../api/cards';

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [filteredBoards, setFilteredBoards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // For delete confirmation
  const [totalProjects, setTotalProjects] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term
  const navigate = useNavigate();

  // Fetch boards and stats when component mounts
  useEffect(() => {
    fetchBoards();
  }, []);

  // Filter boards when boards data changes or search term changes
  useEffect(() => {
    if (boards.length > 0) {
      const filtered = boards.filter(board =>
        board.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBoards(filtered);
    } else {
      setFilteredBoards([]);
    }
  }, [boards, searchTerm]);

  const fetchBoards = async () => {
    try {
      // Fetch dashboard stats which includes boards, card count, and recent boards
      const statsResponse = await boardAPI.getDashboardStats();
      if (statsResponse.success) {
        const { totalBoards, totalCards, recentBoards } = statsResponse.stats;
        setTotalProjects(totalBoards);
        setActiveTasks(totalCards);
        setRecentActivity(recentBoards);

        // Also get the full board data for the board listing
        const boardsResponse = await boardAPI.getBoards();
        if (boardsResponse.success) {
          setBoards(boardsResponse.data);
        }
      } else {
        // Fallback to get boards only if stats failed
        const response = await boardAPI.getBoards();
        if (response.success) {
          setBoards(response.data);
          setTotalProjects(response.data.length);
          setActiveTasks(0); // Default to 0 until we get real card count
          setRecentActivity(response.data.slice(0, 3).map(board => ({
            _id: board._id,
            title: board.title,
            createdAt: board.createdAt
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    }
  };

  const handleLogout = () => {
    // Clear the token from localStorage using utility function
    removeToken();
    // Redirect to login page
    navigate('/login');
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await boardAPI.createBoard(boardTitle);
      if (response.success) {
        // Refresh all boards to update stats
        fetchBoards();
        setBoardTitle('');
        setShowModal(false);
      } else {
        setError(response.message || 'Failed to create board');
      }
    } catch (err) {
      console.error('Error creating board:', err);
      setError(err.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (boardId, boardTitle) => {
    setShowDeleteConfirm({ id: boardId, title: boardTitle });
  };

  const confirmDeleteBoard = async () => {
    if (!showDeleteConfirm) return;

    try {
      setLoading(true);
      const response = await boardAPI.deleteBoard(showDeleteConfirm.id);

      if (response.success) {
        // Refresh all boards to update stats
        fetchBoards();
        setShowDeleteConfirm(null);
      } else {
        setError(response.message || 'Failed to delete board');
      }
    } catch (err) {
      console.error('Error deleting board:', err);
      setError(err.message || 'Failed to delete board');
    } finally {
      setLoading(false);
    }
  };

  const cancelDeleteBoard = () => {
    setShowDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500">
      {/* Glassmorphism Header */}
      <header className="backdrop-blur-lg bg-white/20 shadow-lg border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Project Management Dashboard</h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
              {/* Search Bar - Full width on mobile */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 text-white placeholder-white/50 rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300 backdrop-blur-sm"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/50 absolute right-3 top-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-wrap justify-between gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 shadow-lg text-sm flex-1 sm:flex-none"
                >
                  Create New Board
                </button>
                <span className="text-white/90 hidden sm:inline">Welcome!</span>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Total Projects</h3>
            <p className="text-3xl font-bold text-white">{totalProjects}</p>
            <div className="mt-4 text-white/70 text-sm">
              <span className="text-green-300">↑</span> {Math.max(1, Math.floor(totalProjects/2))} more than last month
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Active Tasks</h3>
            <p className="text-3xl font-bold text-white">{activeTasks}</p>
            <div className="mt-4 text-white/70 text-sm">
              <span className="text-green-300">↑</span> {Math.max(0, Math.floor(activeTasks/3))} more than yesterday
            </div>
          </div>

          <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-2">Team Members</h3>
            <p className="text-3xl font-bold text-white">1</p>
            <div className="mt-4 text-white/70 text-sm">
              <span className="text-green-300">↑</span> 0 more than last week
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 backdrop-blur-lg bg-white/20 rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={activity._id} className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-semibold">{activity.title}</h4>
                      <p className="text-white/70 text-sm">Board created</p>
                    </div>
                    <span className="text-white/50 text-sm">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/10 rounded-xl p-4 border border-white/10 text-center">
                <p className="text-white/70">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Cards - replaced with dynamic boards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.length > 0 ? (
            filteredBoards.map((board) => (
              <div key={board._id} className="backdrop-blur-lg bg-white/20 rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-200 relative">
                <button
                  onClick={() => handleDeleteBoard(board._id, board.title)}
                  className="absolute top-3 right-3 text-red-400 hover:text-red-300 transition-colors duration-200 p-1 rounded-full hover:bg-red-500/30 backdrop-blur-sm"
                  title="Delete Board"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <h3 className="text-xl font-semibold text-white mb-3">{board.title}</h3>
                <p className="text-white/70 mb-4">Created: {new Date(board.createdAt).toLocaleDateString()}</p>
                <div className="flex justify-between items-center">
                  <button
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg transition duration-200"
                    onClick={() => navigate(`/board/${board._id}`)}
                  >
                    View Board
                  </button>
                  <span className="text-white/50 text-sm">{new Date(board.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="backdrop-blur-lg bg-white/20 rounded-2xl p-8 max-w-md mx-auto shadow-xl border border-white/20">
                {searchTerm ? (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-2">No boards found</h3>
                    <p className="text-white/70 mb-4">No boards match your search: "{searchTerm}"</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 shadow-lg"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-white mb-4">No boards yet</h3>
                    <p className="text-white/70 mb-6">Start by creating your first board to organize projects</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-6 py-3 rounded-lg transition duration-200 backdrop-blur-sm border border-white/30 shadow-lg"
                    >
                      Create Your First Board
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Board Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Create New Board</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
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

              <form onSubmit={handleCreateBoard}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="boardTitle">
                    Board Title
                  </label>
                  <input
                    type="text"
                    id="boardTitle"
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter board title"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setError('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Board'}
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
                  onClick={cancelDeleteBoard}
                  className="text-white/70 hover:text-white text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="mb-6">
                <p className="text-white/90 mb-2">Are you sure you want to delete the board?</p>
                <p className="text-white/70 font-semibold">"{showDeleteConfirm.title}"</p>
                <p className="text-red-300 text-sm mt-2">Warning: This action cannot be undone.</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelDeleteBoard}
                  disabled={loading}
                  className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteBoard}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;