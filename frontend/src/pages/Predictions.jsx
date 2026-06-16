import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Package } from 'lucide-react';
import { getAllPredictions } from '../api/apiClient';

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('jours_couverture');
  const navigate = useNavigate();

  useEffect(() => {
    getAllPredictions()
      .then(res => setPredictions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...predictions].sort((a, b) => a[sortBy] - b[sortBy]);

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Prédictions de Demande</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="jours_couverture">Jours de couverture ↑</option>
          <option value="demande_predite">Demande prédite ↑</option>
          <option value="stock_actuel">Stock actuel ↑</option>
        </select>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(pred => {
          const ratio = pred.stock_actuel / (pred.demande_predite || 1);
          const statusColor = ratio < 0.5 ? 'border-red-300 bg-red-50' :
                             ratio < 1 ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50';

          return (
            <div
              key={pred.idmedicament}
              className={`rounded-xl border-2 p-5 hover:shadow-md transition-shadow cursor-pointer ${statusColor}`}
              onClick={() => navigate(`/medicaments/${pred.idmedicament}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">{pred.nommedicament}</h3>
                <span className="text-xs text-gray-500">#{pred.idmedicament}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Demande prédite:</span>
                  <span className="font-bold text-blue-700">{pred.demande_predite}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Stock actuel:</span>
                  <span className="font-bold text-green-700">{pred.stock_actuel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-600">Couverture:</span>
                  <span className="font-bold text-orange-700">{pred.jours_couverture} jours</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}