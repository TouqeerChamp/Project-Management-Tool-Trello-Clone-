import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Users, CheckSquare, Zap } from 'lucide-react';

const Home = () => {
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
          <Link to="/login" className="px-6 py-2.5 rounded-xl glass-card glass-card-hover text-white font-medium transition-all">
            Sign In
          </Link>
          <Link to="/signup" className="gradient-btn px-6 py-2.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <div className="max-w-4xl">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Manage Projects with{' '}
            <span className="gradient-text">Elegance</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            A premium project management tool built with the MERN stack. 
            Organize tasks, collaborate with your team, and ship projects faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="gradient-btn px-10 py-4 text-lg flex items-center gap-2">
              Start for free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="px-10 py-4 rounded-xl glass-card glass-card-hover text-white font-medium transition-all text-lg">
              Sign in to existing account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="glass-card glass-card-hover p-8 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Task Management</h3>
            <p className="text-gray-400">
              Create, organize, and track tasks with an intuitive kanban-style board system.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-8 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
              <Users className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-gray-400">
              Work together seamlessly with real-time updates and team member assignments.
            </p>
          </div>

          <div className="glass-card glass-card-hover p-8 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Built with modern technologies for optimal performance and smooth experience.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-gray-500 text-sm">
        <p>© 2026 Trello Clone. Built with MERN Stack.</p>
      </footer>
    </div>
  );
};

export default Home;
