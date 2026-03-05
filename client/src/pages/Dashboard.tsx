import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, LogOut, User, Plus, Calendar, Settings } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Trello Clone</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-card">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-white font-medium">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl glass-card glass-card-hover text-white font-medium transition-all flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="relative z-10 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="glass-card glass-card-hover p-10 mb-10">
            <h1 className="text-4xl font-bold mb-3">
              Welcome back, <span className="gradient-text">{user?.name}</span>!
            </h1>
            <p className="text-gray-400 text-lg">
              Manage your projects and tasks efficiently. Let's get things done today.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-6 mb-10">
            <button className="glass-card glass-card-hover p-6 text-left flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Create Board</h3>
                <p className="text-sm text-gray-400">New project</p>
              </div>
            </button>

            <button className="glass-card glass-card-hover p-6 text-left flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <Layout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">My Boards</h3>
                <p className="text-sm text-gray-400">View all</p>
              </div>
            </button>

            <button className="glass-card glass-card-hover p-6 text-left flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Timeline</h3>
                <p className="text-sm text-gray-400">Schedule</p>
              </div>
            </button>

            <button className="glass-card glass-card-hover p-6 text-left flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Settings</h3>
                <p className="text-sm text-gray-400">Preferences</p>
              </div>
            </button>
          </div>

          {/* Recent Boards Section */}
          <div className="glass-card glass-card-hover p-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Recent Boards</h2>
              <button className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">
                View All
              </button>
            </div>

            {/* Empty State */}
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                <Layout className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No boards yet</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Create your first board to start organizing your projects and tasks efficiently.
              </p>
              <button className="gradient-btn px-8 py-3 flex items-center gap-2 mx-auto">
                <Plus className="w-5 h-5" />
                Create Your First Board
              </button>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Total Tasks</h3>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Layout className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <p className="text-3xl font-bold gradient-text">0</p>
              <p className="text-sm text-gray-500 mt-1">Start by creating a board</p>
            </div>

            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">In Progress</h3>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold gradient-text">0</p>
              <p className="text-sm text-gray-500 mt-1">Tasks in progress</p>
            </div>

            <div className="glass-card glass-card-hover p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Completed</h3>
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <Settings className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-bold gradient-text">0</p>
              <p className="text-sm text-gray-500 mt-1">Tasks completed</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
