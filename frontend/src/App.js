import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Waiter
import TablesPage from './pages/waiter/TablesPage';
import MenuPage from './pages/waiter/MenuPage';
import OrdersPage from './pages/waiter/OrdersPage';

// Kitchen
import KitchenDisplay from './pages/kitchen/KitchenDisplay';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Waiter */}
            <Route path="/waiter/tables" element={<ProtectedRoute><TablesPage /></ProtectedRoute>} />
            <Route path="/waiter/menu/:tableId" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
            <Route path="/waiter/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />

            {/* Kitchen */}
            <Route path="/kitchen/display" element={<ProtectedRoute><KitchenDisplay /></ProtectedRoute>} />

            {/* Future issues — placeholders */}
            <Route path="/admin/*"   element={<ProtectedRoute><div className="p-8">Admin — coming soon</div></ProtectedRoute>} />
            <Route path="/billing/*" element={<ProtectedRoute><div className="p-8">Billing — coming soon</div></ProtectedRoute>} />

            {/* Default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
