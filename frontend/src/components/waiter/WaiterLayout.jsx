import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TableGridIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const WaiterLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 h-14 z-10 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <span className="text-orange-500 font-bold text-lg">🍽️ ROMS</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 hidden sm:block">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Scrollable content between header and bottom nav */}
      <main className="flex-1 overflow-y-auto pt-14 pb-16">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 z-10 bg-white border-t border-gray-200 flex">
        <NavLink
          to="/waiter/tables"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-orange-500' : 'text-gray-400'
            }`
          }
        >
          <TableGridIcon />
          <span className="text-xs font-medium">Tables</span>
        </NavLink>

        <NavLink
          to="/waiter/orders"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? 'text-orange-500' : 'text-gray-400'
            }`
          }
        >
          <ClipboardIcon />
          <span className="text-xs font-medium">My Orders</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default WaiterLayout;
