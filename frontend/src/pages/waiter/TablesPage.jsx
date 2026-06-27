import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import WaiterLayout from '../../components/waiter/WaiterLayout';

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    api.get('/tables')
      .then(({ data }) => setTables(data.tables))
      .catch(() => setError('Failed to load tables. Pull down to retry.'))
      .finally(() => setLoading(false));
  }, []);

  // Live table status from Socket.io
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (updated) => {
      setTables(prev => prev.map(t => t.id === updated.id ? updated : t));
    };
    socket.on('table:status_updated', handleUpdate);
    return () => socket.off('table:status_updated', handleUpdate);
  }, [socket]);

  const handleTablePress = (table) => {
    if (table.status === 'free') {
      navigate(`/waiter/menu/${table.id}`);
    }
  };

  const freeTables = tables.filter(t => t.status === 'free').length;

  return (
    <WaiterLayout>
      <div className="p-4">
        {/* Page title */}
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-800">Tables</h2>
          {!loading && tables.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {freeTables} of {tables.length} free · tap a green table to order
            </p>
          )}
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 text-red-400">{error}</div>
        )}

        {/* Table grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tables.map(table => {
              const isFree = table.status === 'free';
              return (
                <button
                  key={table.id}
                  onClick={() => handleTablePress(table)}
                  disabled={!isFree}
                  className={`
                    relative rounded-2xl p-5 text-left transition-all
                    ${isFree
                      ? 'bg-green-50 border-2 border-green-300 shadow-sm active:scale-95'
                      : 'bg-red-50 border-2 border-red-200 cursor-not-allowed opacity-80'
                    }
                  `}
                >
                  {/* Status dot */}
                  <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
                    isFree ? 'bg-green-400' : 'bg-red-400'
                  }`} />

                  <div className={`text-2xl font-bold ${isFree ? 'text-green-700' : 'text-red-700'}`}>
                    {table.tableNumber}
                  </div>
                  <div className={`text-sm font-medium mt-0.5 ${isFree ? 'text-green-600' : 'text-red-500'}`}>
                    {isFree ? 'Free' : 'Occupied'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {table.capacity} seats
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loading && tables.length === 0 && !error && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">🪑</div>
            <p className="font-medium">No tables found</p>
            <p className="text-sm mt-1">Ask admin to add tables</p>
          </div>
        )}
      </div>
    </WaiterLayout>
  );
};

export default TablesPage;
