import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import hypervisiaLogo from '../assets/hypervisia.png';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent hover:from-primary-700 hover:to-purple-700 transition-all">
                <img src={hypervisiaLogo} alt="HYPERVISIA" className="h-100 w-100 mr-2 object-contain" />
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                <Link to="/" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors border-b-2 border-transparent hover:border-primary-600">
                  <span className="mr-1">🏠</span> Accueil
                </Link>
                {isAuthenticated && (
                  <>
                    <Link to="/forum" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors border-b-2 border-transparent hover:border-primary-600">
                      <span className="mr-1">💬</span> Forum
                    </Link>
                    <Link to="/events" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors border-b-2 border-transparent hover:border-primary-600">
                      <span className="mr-1">📅</span> Événements
                    </Link>
                    <Link to="/documents" className="inline-flex items-center px-3 pt-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors border-b-2 border-transparent hover:border-primary-600">
                      <span className="mr-1">📄</span> Documents
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="ml-3 inline-flex items-center px-5 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <span className="mr-1">👋</span> Déconnexion
                </button>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-5 py-2 text-sm font-semibold rounded-lg text-primary-700 bg-white border-2 border-primary-600 hover:bg-primary-50 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <span className="mr-1">🔐</span> Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-5 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <span className="mr-1">✨</span> Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="bg-white/80 backdrop-blur-md border-t border-primary-100 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">© 2026 HYPERVISIA - Association loi 1901</p>
            <p className="text-xs mt-2">Fait avec ❤️ pour notre communauté</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
