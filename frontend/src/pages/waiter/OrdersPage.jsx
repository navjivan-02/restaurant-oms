import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import WaiterLayout from '../../components/waiter/WaiterLayout';

const STATUS_STYLE = {
  pending:   'bg-amber-100  text-amber-700',
  confirmed: 'bg-blue-100   text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready:     'bg-green-100  text-green-700',
  served:    'bg-gray-100   text-gray-500',
  billed:    'bg-gray-100   text-gray-400',
};

const STATUS_LABEL = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing…',
  ready:     '✓ Ready!',
  served:    'Served',
  billed:    'Billed',
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const orderTotal = (order) =>
  order.orderItems.reduce(
    (sum, i) => sum + parseFloat(i.unitPrice) * i.quantity,
    0
  );

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const socket = useSocket();

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => {
        // Only show this waiter's orders
        setOrders(data.orders.filter(o => o.waiterId === user.id));
      })
      .finally(() => setLoading(false));
  }, [user.id]);

  // Real-time: update order in list when status changes
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated) => {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    };
    socket.on('order:status_updated', handleUpdate);
    return () => socket.off('order:status_updated', handleUpdate);
  }, [socket]);

  return (
    <WaiterLayout>
      <div className="p-4">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">My Orders</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length > 0
              ? `${orders.length} active order${orders.length !== 1 ? 's' : ''}`
              : 'No active orders today'}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-medium text-gray-500">No active orders</p>
            <p className="text-sm mt-1">Go to Tables to place a new order</p>
          </div>
        )}

        {/* Order cards */}
        {!loading && (
          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                  order.status === 'ready'
                    ? 'border-green-400'
                    : order.status === 'preparing'
                    ? 'border-orange-400'
                    : 'border-transparent'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-gray-800 text-lg">
                      Table {order.table?.tableNumber}
                    </span>
                    <span className="text-gray-400 text-sm ml-2">#{order.id}</span>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                {/* Items list */}
                <div className="space-y-1.5 mb-3">
                  {order.orderItems.map(item => (
                    <div key={item.id} className="flex justify-between items-baseline">
                      <span className="text-sm text-gray-700">
                        {item.quantity}× {item.menuItem.name}
                        {item.notes && (
                          <span className="text-gray-400 text-xs ml-1">({item.notes})</span>
                        )}
                      </span>
                      <span className="text-sm text-gray-400 ml-2 flex-shrink-0">
                        ₹{parseFloat(item.unitPrice) * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer: time + total */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{formatTime(order.createdAt)}</span>
                  <span className="text-sm font-bold text-gray-700">₹{orderTotal(order)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WaiterLayout>
  );
};

export default OrdersPage;
