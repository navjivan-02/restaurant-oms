import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

// Orders sorted: ready first, then served, preparing, confirmed, pending
const STATUS_PRIORITY = { ready: 0, served: 1, preparing: 2, confirmed: 3, pending: 4 };

const STATUS_BADGE = {
  pending:   'bg-amber-100  text-amber-700',
  confirmed: 'bg-blue-100   text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  ready:     'bg-green-100  text-green-700',
  served:    'bg-gray-100   text-gray-500',
};

const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed',
  preparing: 'Preparing', ready: 'Ready', served: 'Served',
};

const fmt = (n) => parseFloat(n).toFixed(2);

const orderTotal = (order) =>
  order.orderItems.reduce((s, i) => s + parseFloat(i.unitPrice) * i.quantity, 0);

// ─── Bill Modal ──────────────────────────────────────────────────────────────
const BillModal = ({ order, onClose }) => {
  const [bill, setBill]               = useState(null);
  const [generating, setGenerating]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerPhone, setCustomerPhone] = useState('');
  const [markingPaid, setMarkingPaid] = useState(false);
  const [paid, setPaid]               = useState(false);

  const subtotal   = orderTotal(order);
  const gstPercent = 5;
  const gstAmount  = parseFloat((subtotal * gstPercent / 100).toFixed(2));
  const total      = parseFloat((subtotal + gstAmount).toFixed(2));

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post(`/bills/generate/${order.id}`);
      setBill(data.bill);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!bill) return;
    setMarkingPaid(true);
    try {
      await api.patch(`/bills/${bill.id}/payment`, { paymentMethod, customerPhone });
      setPaid(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[95vh] overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {bill ? `Bill #${bill.id}` : `Generate Bill — Table ${order.table?.tableNumber}`}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {/* Scrollable bill area */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Printable Bill ──────────────────────────────── */}
          <div className="print-bill">
            {/* Restaurant header */}
            <div className="text-center mb-4">
              <p className="text-xl font-bold text-gray-800">Demo Restaurant</p>
              <p className="text-sm text-gray-500">Vijayawada, Andhra Pradesh</p>
              {bill?.restaurant?.gstNumber && (
                <p className="text-xs text-gray-500 mt-0.5">GSTIN: {bill.restaurant.gstNumber}</p>
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Bill meta */}
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>Table: <strong>{order.table?.tableNumber}</strong></span>
              <span>Date: {today}</span>
            </div>
            {bill && (
              <div className="text-sm text-gray-500 mb-3">Bill #: {bill.id}</div>
            )}

            <div className="border-t border-dashed border-gray-300 my-3" />

            {/* Items table */}
            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-gray-500 border-b border-gray-200">
                  <th className="text-left pb-2 font-medium">Item</th>
                  <th className="text-center pb-2 font-medium">Qty</th>
                  <th className="text-right pb-2 font-medium">Rate</th>
                  <th className="text-right pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.orderItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-800">{item.menuItem.name}</td>
                    <td className="py-1.5 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-1.5 text-right text-gray-600">₹{fmt(item.unitPrice)}</td>
                    <td className="py-1.5 text-right font-medium text-gray-800">
                      ₹{fmt(parseFloat(item.unitPrice) * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>CGST (2.5%)</span>
                <span>₹{fmt(gstAmount / 2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>SGST (2.5%)</span>
                <span>₹{fmt(gstAmount / 2)}</span>
              </div>
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-base text-gray-900">
                <span>Total</span>
                <span>₹{fmt(total)}</span>
              </div>
            </div>

            {paid && (
              <div className="mt-3 text-center text-green-600 font-semibold text-sm">
                ✓ Paid via {paymentMethod.toUpperCase()}
              </div>
            )}

            <div className="border-t border-dashed border-gray-300 mt-4 pt-3 text-center text-xs text-gray-400">
              Thank you! Visit again 🙏
            </div>
          </div>
          {/* ── End Printable Bill ──────────────────────────── */}

        </div>

        {/* Action footer */}
        <div className="border-t border-gray-100 px-6 py-4 space-y-3">
          {!bill && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                         text-white font-bold rounded-xl transition-colors"
            >
              {generating ? 'Generating…' : 'Generate Bill'}
            </button>
          )}

          {bill && !paid && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {['cash', 'upi', 'card'].map(m => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize ${
                      paymentMethod === m
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-orange-300'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Customer phone (optional)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleMarkPaid}
                  disabled={markingPaid}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300
                             text-white font-bold rounded-xl transition-colors"
                >
                  {markingPaid ? 'Recording…' : '✓ Mark as Paid'}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-5 py-3 border border-gray-200 hover:bg-gray-50
                             text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  🖨 Print
                </button>
              </div>
            </div>
          )}

          {bill && paid && (
            <div className="flex gap-2">
              <div className="flex-1 py-3 bg-green-50 text-green-700 font-bold rounded-xl text-center">
                ✓ Payment Recorded
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-3 border border-gray-200 hover:bg-gray-50
                           text-gray-700 font-semibold rounded-xl transition-colors"
              >
                🖨 Print
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Billing Page ────────────────────────────────────────────────────────
const BillingPage = () => {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedOrder, setSelected] = useState(null);
  const { user, logout }            = useAuth();
  const socket                      = useSocket();
  const navigate                    = useNavigate();

  useEffect(() => {
    api.get('/orders')
      .then(({ data }) => setOrders(data.orders))
      .finally(() => setLoading(false));
  }, []);

  const sortedOrders = [...orders].sort(
    (a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9)
  );

  const handleOrderNew = useCallback((order) => {
    setOrders(prev => prev.some(o => o.id === order.id) ? prev : [...prev, order]);
  }, []);

  const handleStatusUpdate = useCallback((updated) => {
    if (updated.status === 'billed') {
      // Remove from list but keep modal open — user still needs to mark payment and print
      setOrders(prev => prev.filter(o => o.id !== updated.id));
    } else {
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    }
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('order:new',            handleOrderNew);
    socket.on('order:status_updated', handleStatusUpdate);
    return () => {
      socket.off('order:new',            handleOrderNew);
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [socket, handleOrderNew, handleStatusUpdate]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-bold text-xl">🍽️ Billing Counter</span>
          {readyCount > 0 && (
            <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
              {readyCount} ready to bill
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-800">Active Orders</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} · click any order to generate bill`}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-24">
              <div className="w-9 h-9 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!loading && orders.length === 0 && (
            <div className="text-center py-24 text-gray-400">
              <div className="text-6xl mb-4">🧾</div>
              <p className="text-xl font-semibold text-gray-500">No active orders</p>
              <p className="text-sm mt-2">New orders will appear here in real-time</p>
            </div>
          )}

          {/* Orders grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedOrders.map(order => {
                const canBill = order.status === 'ready' || order.status === 'served';
                const total   = orderTotal(order);

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-2xl shadow-sm border transition-all ${
                      canBill
                        ? 'border-green-200 hover:shadow-md cursor-pointer'
                        : 'border-gray-100'
                    }`}
                  >
                    {/* Card header */}
                    <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-gray-800">
                          {order.table?.tableNumber}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Order #{order.id} · {order.waiter?.name}
                      </p>
                    </div>

                    {/* Items */}
                    <div className="px-5 py-3 space-y-1">
                      {order.orderItems.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.quantity}× {item.menuItem.name}</span>
                          <span className="text-gray-400">₹{fmt(parseFloat(item.unitPrice) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-4">
                      <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-100">
                        <span className="text-sm text-gray-500">Total (incl. GST)</span>
                        <span className="font-bold text-gray-800">
                          ₹{fmt(total + total * 0.05)}
                        </span>
                      </div>

                      {canBill ? (
                        <button
                          onClick={() => setSelected(order)}
                          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white
                                     font-bold rounded-xl transition-colors text-sm"
                        >
                          Generate Bill
                        </button>
                      ) : (
                        <div className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center ${STATUS_BADGE[order.status]}`}>
                          {STATUS_LABEL[order.status]}…
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bill modal */}
      {selectedOrder && (
        <BillModal
          order={selectedOrder}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default BillingPage;
