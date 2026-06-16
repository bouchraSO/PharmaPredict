import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShoppingCart, Filter } from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import { getRecommendations } from '../api/apiClient';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getRecommendations(filter)
      .then(res => setRecommendations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  const totalReappro = recommendations.reduce((sum, r) => sum + r.quantite_reappro, 0);
  const urgentCount = recommendations.filter(r => r.priorite === 'HAUTE').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Recommandations de Réapprovisionnement</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <p className="text-2xl font-bold text-red-700">{urgentCount}</p>
            <p className="text-sm text-red-500">Alertes urgentes</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold text-blue-700">{totalReappro}</p>
            <p className="text-sm text-blue-500">Unités à commander</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <Filter className="w-8 h-8 text-gray-600" />
          <div>
            <p className="text-2xl font-bold text-gray-700">{recommendations.length}</p>
            <p className="text-sm text-gray-500">Médicaments analysés</p>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {['HAUTE', 'MOYENNE', 'BASSE', 'AUCUNE'].map(p => (
          <button
            key={p}
            onClick={() => setFilter(filter === p ? null : p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              ${filter === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Médicament</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Demande Prédite</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Qté Réappro</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Priorité</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Couverture</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map(rec => (
              <tr
                key={rec.idmedicament}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/medicaments/${rec.idmedicament}`)}
              >
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{rec.nommedicament}</p>
                  <p className="text-xs text-gray-500">ID: {rec.idmedicament} • {rec.prix.toFixed(2)} DA</p>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-gray-700">{rec.stock_actuel}</td>
                <td className="px-6 py-4 text-right font-semibold text-blue-700">{rec.demande_predite}</td>
                <td className="px-6 py-4 text-right">
                  {rec.quantite_reappro > 0 ? (
                    <span className="font-bold text-orange-600">{rec.quantite_reappro}</span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <PriorityBadge priorite={rec.priorite} />
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-semibold ${rec.jours_couverture < 7 ? 'text-red-600' : 'text-green-600'}`}>
                    {rec.jours_couverture}j
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-sm font-semibold ${rec.action === 'RÉAPPROVISIONNER' ? 'text-red-600' : 'text-green-600'}`}>
                    {rec.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}