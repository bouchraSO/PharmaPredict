import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import PriorityBadge from '../components/PriorityBadge';
import { getMedicament, getHistorical, getPrediction, getRecommendation } from '../api/apiClient';

export default function MedicamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicament, setMedicament] = useState(null);
  const [historical, setHistorical] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMedicament(id),
      getHistorical(id),
      getPrediction(id),
      getRecommendation(id),
    ])
      .then(([medRes, histRes, predRes, recRes]) => {
        setMedicament(medRes.data);
        setHistorical(histRes.data.data);
        setPrediction(predRes.data);
        setRecommendation(recRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{medicament.nommedicament}</h2>
          <p className="text-sm text-gray-500">ID: {medicament.idmedicament} • Prix: {medicament.prix.toFixed(2)} DA</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Stock Actuel" value={medicament.stock_actuel} color={medicament.stock_actuel < 50 ? 'red' : 'green'} />
        <StatCard icon={TrendingUp} label="Demande Moyenne" value={medicament.demande_moyenne} color="blue" />
        <StatCard icon={TrendingUp} label="Demande Max" value={medicament.demande_max} color="orange" />
        <StatCard icon={TrendingUp} label="Demande Totale" value={medicament.demande_totale} color="purple" />
      </div>

      {/* Prediction + Recommendation */}
      {prediction && recommendation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Prédiction de Demande</h3>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600">Demande prédite</span>
                <span className="font-bold text-blue-700 text-xl">{prediction.demande_predite}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Seuil de réappro</span>
                <span className="font-semibold">{prediction.seuil_reappro}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Jours de couverture</span>
                <span className="font-semibold">{prediction.jours_couverture} jours</span>
              </div>
            </div>
          </div>

            <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Recommandation de Réapprovisionnement</h3>
            <div className="space-y-3">
              
              {/* Ligne Priorité */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Priorité</span>
                <PriorityBadge priorite={recommendation.priorite} />
              </div>

              {/* Ligne Action */}
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Action</span>
                <span className={`font-semibold ${recommendation.action === 'RÉAPPROVISIONNER' ? 'text-red-600' : 'text-green-600'}`}>
                  {recommendation.action}
                </span>
              </div>

              {/* Carré Orange (Quantité) - Affiché UNIQUEMENT si l'action est de réapprovisionner */}
              {recommendation.action === 'RÉAPPROVISIONNER' && (
                <div className="flex justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="text-gray-600">Quantité à commander</span>
                  <span className="font-bold text-orange-700 text-xl">
                    {Math.max(0, Math.round(prediction.seuil_reappro - medicament.stock_actuel))} unités
                  </span>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Historique de la Demande</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historical}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} angle={-45} textAnchor="end" height={60} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="qtechete" stroke="#3b82f6" strokeWidth={2} name="Demande" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Évolution du Stock</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={historical}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={10} angle={-45} textAnchor="end" height={60} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="stock_actuel" fill="#10b981" radius={[4, 4, 0, 0]} name="Stock" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}