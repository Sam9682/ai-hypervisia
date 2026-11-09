import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { isActivePath } from '../utils/navigation';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Accueil' },
  { to: '/forum', label: 'Forum', requiresAuth: true },
  {
    to: '/events',
    label: 'Événements',
    requiresAuth: true,
    children: [{ to: '/admin/events', label: 'Gérer les événements', requiresAuth: true, adminOnly: true }],
  },
  { to: '/documents', label: 'Documents', requiresAuth: true },
  { to: '/oracle', label: 'EduScalar: Générateur de Cours', requiresAuth: true },
  { to: '/admin/users', label: 'Utilisateurs', requiresAuth: true, adminOnly: true },
  { to: '/settings', label: 'Paramètres', requiresAuth: true, adminOnly: true },
];

export const Layout = ({ children }: LayoutProps) => {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const isVisible = (item: NavItem) =>
    (!item.requiresAuth || isAuthenticated) && (!item.adminOnly || isAdmin);

  const visibleItems = NAV_ITEMS.filter(isVisible);

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const desktopLinkClass = (to: string) =>
    `inline-flex items-center px-3 h-16 pt-1 text-sm font-medium border-b-2 transition-colors ${
      isActivePath(pathname, to)
        ? 'border-brand-red text-white'
        : 'border-transparent text-navy-100 hover:text-white'
    }`;

  const mobileLinkClass = (to: string, nested = false) =>
    `block px-3 py-2 rounded-md font-medium border-l-4 ${nested ? 'pl-8 text-sm' : 'text-base'} ${
      isActivePath(pathname, to)
        ? 'border-brand-red text-white bg-navy-900'
        : 'border-transparent text-navy-100 hover:text-white hover:bg-navy-900'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:text-navy-900 focus:px-4 focus:py-2 focus:rounded"
      >
        Aller au contenu principal
      </a>
      <header className="bg-navy-950 text-white sticky top-0 z-40">
        <nav aria-label="Navigation principale">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center text-xl font-bold tracking-wide text-white">
                  HYPERVISIA
                </Link>
                {/* Desktop Menu */}
                <div className="hidden md:flex md:ml-8 md:space-x-6">
                  {visibleItems.map((item) => {
                    const subItems = (item.children ?? []).filter(isVisible);
                    const active = isActivePath(pathname, item.to);
                    if (subItems.length === 0) {
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={desktopLinkClass(item.to)}
                          aria-current={active ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                      );
                    }
                    return (
                      <div key={item.to} className="relative group">
                        <Link
                          to={item.to}
                          className={desktopLinkClass(item.to)}
                          aria-current={active ? 'page' : undefined}
                        >
                          {item.label}
                        </Link>
                        <div className="absolute top-full left-0 w-56 bg-white border border-slate-200 rounded-md shadow-sm py-2 z-50 hidden group-hover:block group-focus-within:block">
                          {subItems.map((sub) => (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              aria-current={isActivePath(pathname, sub.to) ? 'page' : undefined}
                              className={`block px-4 py-2 text-sm hover:bg-navy-100 hover:text-navy-900 ${
                                isActivePath(pathname, sub.to)
                                  ? 'text-navy-900 font-semibold underline decoration-brand-red decoration-2 underline-offset-4'
                                  : 'text-slate-700'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center">
                {isAuthenticated ? (
                  <button onClick={handleLogout} className="ml-3 btn-primary text-sm">
                    Déconnexion
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <Link
                      to="/login"
                      className="btn-secondary text-sm !bg-transparent !text-white !border-white hover:!bg-navy-900"
                    >
                      Connexion
                    </Link>
                    <Link to="/register" className="btn-primary text-sm">
                      Inscription
                    </Link>
                  </div>
                )}
              </div>
              {/* Mobile Menu Button */}
              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-navy-900"
                  aria-label="Menu"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div id="mobile-menu" className="md:hidden border-t border-navy-700">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {visibleItems.map((item) => (
                  <div key={item.to} className="space-y-1">
                    <Link
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActivePath(pathname, item.to) ? 'page' : undefined}
                      className={mobileLinkClass(item.to)}
                    >
                      {item.label}
                    </Link>
                    {(item.children ?? []).filter(isVisible).map((sub) => (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        onClick={() => setMobileMenuOpen(false)}
                        aria-current={isActivePath(pathname, sub.to) ? 'page' : undefined}
                        className={mobileLinkClass(sub.to, true)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ))}
                {/* Mobile Auth Buttons */}
                <div className="pt-4 border-t border-navy-700 mt-4">
                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="btn-primary w-full text-center"
                    >
                      Déconnexion
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn-secondary block w-full text-center !bg-transparent !text-white !border-white hover:!bg-navy-900"
                      >
                        Connexion
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="btn-primary block w-full text-center"
                      >
                        Inscription
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8 focus:outline-none"
      >
        {children}
      </main>
      <footer className="bg-navy-950 text-navy-100 mt-16">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-lg font-bold tracking-wide text-white">HYPERVISIA</p>
            <p className="text-sm mt-2">© 2026 HYPERVISIA - Association loi 1901 - N° W913016363</p>
            <p className="text-xs mt-2">Développé et hébergé sur OVH par des agents virtuels IA - softfluid.fr</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
