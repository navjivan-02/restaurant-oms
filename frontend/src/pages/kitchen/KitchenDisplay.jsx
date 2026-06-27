import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

// Orders kitchen cares about — served/billed are done
const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready'];

const STATUS_STYLE = {
  pending:   { card: 'border-amber-400',  badge: 'bg-amber-100 text-amber-700',  label: 'New Order' },
  confirmed: { card: 'border-amber-400',  badge: 'bg-amber-100 text-amber-700',  label: 'Confirmed' },
  preparing: { card: 'border-blue-400',   badge: 'bg-blue-100  text-blue-700',   label: 'Preparing' },
  ready:     { card: 'border-green-400',  badge: 'bg-green-100 text-green-700',  label: '✓ Ready' },
};

// Web Audio API beep — no external audio file needed
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Browser may block audio until user interaction — silent fallback
  }
};

const getElapsed = (createdAt, now) => {
  const mins = Math.floor((now - new Date(createdAt)) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min';
  return `${mins} mins`;
};

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [updating, setUpdating] = useState({}); // { [orderId]: true } while request in flight
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  // Tick every 30s to keep elapsed timers fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // Fetch initial active orders on mount
  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => {
        const active = data.orders
          .filter(o => ACTIVE_STATUSES.includes(o.status))
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setOrders(active);
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle a new order arriving via socket
  const handleNewOrder = useCallback((order) => {
    setOrders(prev => {
      // Avoid duplicates if we already have it
      if (prev.some(o => o.id === order.id)) return prev;
      playBeep();
      return [...prev, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, []);

  // Handle a status update via socket
  const handleStatusUpdate = useCallback((updated) => {
    setOrders(prev => {
      if (!ACTIVE_STATUSES.includes(updated.status)) {
        // Order left kitchen scope (served/billed) — remove it
        return prev.filter(o => o.id !== updated.id);
      }
      return prev.map(o => o.id === updated.id ? updated : o);
    });
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:new', handleNewOrder);
    socket.on('order:status_updated', handleStatusUpdate);
    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [socket, handleNewOrder, handleStatusUpdate]);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(prev => ({ ...prev, [orderId]: true }));
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      // Socket event will update local state via handleStatusUpdate
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-orange-400 font-bold text-xl">🍽️ Kitchen Display</span>
          <div className="hidden sm:flex items-center gap-3 text-sm">
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full font-semibold">
                {pendingCount} new
              </span>
            )}
            {preparingCount > 0 && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-semibold">
                {preparingCount} preparing
              </span>
            )}
            {orders.length === 0 && !loading && (
              <span className="text-gray-500">No active orders</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6">

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-600">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <p className="text-2xl font-semibold">All caught up!</p>
            <p className="text-base mt-2">Waiting for new orders…</p>
          </div>
        )}

        {/* Order cards grid */}
        {!loading && orders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map(order => {
              const style = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
              const isUpdating = updating[order.id];
              const elapsed = getElapsed(order.createdAt, now);
              const isUrgent = Math.floor((now - new Date(order.createdAt)) / 60000) >= 10;

              return (
                <div
                  key={order.id}
                  className={`bg-gray-900 rounded-2xl border-l-4 ${style.card} flex flex-col overflow-hidden
                    ${isUrgent && order.status !== 'ready' ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-gray-950' : ''}
                  `}
                >
                  {/* Card header */}
                  <div className="px-4 pt-4 pb-3 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-3xl font-black text-white tracking-tight">
                        {order.table?.tableNumber}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
                        {style.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Order #{order.id}</span>
                      <span className={`font-medium ${isUrgent ? 'text-red-400' : 'text-gray-400'}`}>
                        {isUrgent && '⚠ '}{elapsed}
                      </span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="px-4 py-3 flex-1 space-y-2">
                    {order.orderItems.map(item => (
                      <div key={item.id}>
                        <div className="flex items-baseline gap-2">
                          <span className="text-orange-400 font-bold text-lg leading-tight">
                            ×{item.quantity}
                          </span>
                          <span className="text-white font-semibold text-base leading-tight">
                            {item.menuItem.name}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-amber-300 text-sm ml-6 mt-0.5 italic">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                    {order.notes && (
                      <p className="text-gray-400 text-sm mt-2 pt-2 border-t border-gray-800 italic">
                        Order note: {order.notes}
                      </p>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="px-4 pb-4">
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        disabled={isUpdating}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900
                                   text-white font-bold rounded-xl text-base transition-colors active:scale-95"
                      >
                        {isUpdating ? 'Updating…' : 'Start Preparing'}
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus(order.id, 'ready')}
                        disabled={isUpdating}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-900
                                   text-white font-bold rounded-xl text-base transition-colors active:scale-95"
                      >
                        {isUpdating ? 'Updating…' : '✓ Mark as Ready'}
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <div className="w-full py-3 bg-gray-800 text-green-400 font-bold rounded-xl text-base text-center">
                        ✓ Ready for pickup
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenDisplay;
