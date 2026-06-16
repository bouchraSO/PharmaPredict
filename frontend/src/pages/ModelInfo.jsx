import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getModelMetrics, getFeatureImportance } from '../api/apiClient';

export default function ModelInfo() {
  const [metrics, setMetrics] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getModelMetrics(), getFeatureImportance()])
      .then(([mRes, fRes]) => {
        setMetrics(mRes.data);
        setFeatures(fRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Modèle de Prédiction</h2>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">{metrics.mae.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">MAE (Erreur Absolue Moyenne)</p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center">
            <p className="text-3xl font-bold text-green-600">{metrics.rmse.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">RMSE (Racine Erreur Quadratique)</p>
          </div>
          <div className="bg-white rounded-xl border p-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{metrics.r2.toFixed(4)}</p>
            <p className="text-sm text-gray-500 mt-1">R² (Coefficient de détermination)</p>
          </div>
        </div>
      )}

      {/* Model Info */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Configuration du Modèle</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Algorithme:</span>
            <span className="ml-2 font-semibold">Random Forest Regressor</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Nombre d'estimateurs:</span>
            <span className="ml-2 font-semibold">200</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Profondeur max:</span>
            <span className="ml-2 font-semibold">15</span>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-500">Variables:</span>
            <span className="ml-2 font-semibold">{features.length} features</span>
          </div>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Importance des Variables</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={features.slice(0, 15)} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
            <YAxis type="category" dataKey="feature" fontSize={11} width={110} />
            <Tooltip />
            <Bar dataKey="importance" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}