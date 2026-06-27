import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const BackArrow = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const MenuPage = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // null = All
  const [cart, setCart] = useState({}); // { [menuItemId]: { menuItemId, name, price, quantity, notes } }
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.get('/menu')
      .then(({ data }) => setCategories(data.categories))
      .finally(() => setLoading(false));
  }, []);

  // All items flattened across categories (menuItems is the Prisma relation name)
  const allItems = categories.flatMap(c => c.menuItems || []);
  const displayedItems = selectedCategoryId
    ? (categories.find(c => c.id === selectedCategoryId)?.menuItems || [])
    : allItems;

  // Cart helpers
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const addToCart = (item) => {
    const price = parseFloat(item.price);
    setCart(prev => ({
      ...prev,
      [item.id]: prev[item.id]
        ? { ...prev[item.id], quantity: prev[item.id].quantity + 1 }
        : { menuItemId: item.id, name: item.name, price, quantity: 1, notes: '' },
    }));
  };

  const removeFromCart = (menuItemId) => {
    setCart(prev => {
      const existing = prev[menuItemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[menuItemId];
        return next;
      }
      return { ...prev, [menuItemId]: { ...existing, quantity: existing.quantity - 1 } };
    });
  };

  const updateNotes = (menuItemId, notes) => {
    setCart(prev => ({
      ...prev,
      [menuItemId]: { ...prev[menuItemId], notes },
    }));
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      await api.post('/orders', {
        tableId: parseInt(tableId),
        items: cartItems.map(i => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          notes: i.notes,
        })),
      });
      navigate('/waiter/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* Sticky top header: back + table + item count */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate('/waiter/tables')}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <BackArrow />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800">Table {tableId}</h1>
          </div>
          {cartCount > 0 && (
            <span className="bg-orange-100 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full">
              {cartCount} in cart
            </span>
          )}
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

      {/* Item list — padded to clear sticky header and order bar */}
      <main className={`flex-1 overflow-y-auto pt-[112px] px-4 ${cartCount > 0 ? 'pb-28' : 'pb-6'}`}>
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-9 h-9 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && displayedItems.length === 0 && (
          <div className="text-center py-16 text-gray-400">No items available</div>
        )}

        {!loading && (
          <div className="space-y-3">
            {displayedItems.map(item => {
              const inCart = cart[item.id];
              return (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Veg / Non-veg indicator */}
                        <span className={`mt-0.5 w-3 h-3 rounded-sm border-2 flex-shrink-0 ${
                          item.isVeg
                            ? 'border-green-600 bg-green-500'
                            : 'border-red-600 bg-red-500'
                        }`} />
                        <span className="font-semibold text-gray-800">{item.name}</span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2 ml-5">
                          {item.description}
                        </p>
                      )}
                      <p className="text-base font-bold text-gray-700 mt-1 ml-5">
                        ₹{item.price}
                      </p>
                    </div>

                    {/* Add button OR qty controls */}
                    {!inCart ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="flex-shrink-0 px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-9 h-9 flex items-center justify-center bg-orange-100 text-orange-600 rounded-xl text-xl font-bold"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-bold text-gray-800 text-lg">
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-9 h-9 flex items-center justify-center bg-orange-500 text-white rounded-xl text-xl font-bold"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Notes input — shows once item is in cart */}
                  {inCart && (
                    <input
                      type="text"
                      value={inCart.notes}
                      onChange={e => updateNotes(item.id, e.target.value)}
                      placeholder="Note for kitchen (e.g. extra spicy, no onion)"
                      className="mt-3 w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5
                                 text-gray-700 placeholder-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Place Order sticky bar — only visible when cart has items */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={placeOrder}
            disabled={placing}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300
                       text-white font-bold rounded-2xl text-lg transition-colors active:scale-[0.98]"
          >
            {placing
              ? 'Placing order…'
              : `Place Order · ₹${cartTotal} (${cartCount} item${cartCount !== 1 ? 's' : ''})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuPage;
