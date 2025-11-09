import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Home, Users, MessageSquare, User, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-primary-600">
                MERN Platform
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/dashboard" className="flex items-center text-gray-700 hover:text-primary-600">
                <Home className="w-5 h-5 mr-1" />
                Dashboard
              </Link>
              <Link to="/groups" className="flex items-center text-gray-700 hover:text-primary-600">
                <Users className="w-5 h-5 mr-1" />
                Groups
              </Link>
              <Link to="/chat" className="flex items-center text-gray-700 hover:text-primary-600">
                <MessageSquare className="w-5 h-5 mr-1" />
                Chat
              </Link>
            </nav>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                <User className="w-5 h-5 mr-1" />
                {user?.firstName} {user?.lastName}
              </Link>
              <button onClick={handleLogout} className="flex items-center text-gray-700 hover:text-red-600">
                <LogOut className="w-5 h-5 mr-1" />
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <nav className="px-4 py-3 space-y-2">
              <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-primary-600">
                Dashboard
              </Link>
              <Link to="/groups" className="block py-2 text-gray-700 hover:text-primary-600">
                Groups
              </Link>
              <Link to="/chat" className="block py-2 text-gray-700 hover:text-primary-600">
                Chat
              </Link>
              <Link to="/profile" className="block py-2 text-gray-700 hover:text-primary-600">
                Profile
              </Link>
              <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
