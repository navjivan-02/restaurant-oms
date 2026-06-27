import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — placeholder routes for future issues */}
          <Route path="/admin/*" element={<ProtectedRoute><div>Admin — coming soon</div></ProtectedRoute>} />
          <Route path="/waiter/*" element={<ProtectedRoute><div>Waiter — coming soon</div></ProtectedRoute>} />
          <Route path="/kitchen/*" element={<ProtectedRoute><div>Kitchen — coming soon</div></ProtectedRoute>} />
          <Route path="/billing/*" element={<ProtectedRoute><div>Billing — coming soon</div></ProtectedRoute>} />

          {/* Default: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
