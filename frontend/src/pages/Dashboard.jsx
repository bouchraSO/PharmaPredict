import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import { getDashboard } from '../api/apiClient';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Erreur de chargement</div>;

  const prioriteData = Object.entries(data.repartition_priorites).map(([name, value]) => ({ name, value }));
  const saisonData = Object.entries(data.demande_par_saison).map(([name, demande]) => ({ name, demande }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tableau de Bord</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Pill} label="Médicaments" value={data.total_medicaments} color="blue" />
        <StatCard icon={TrendingUp} label="Demande Totale" value={data.total_demande.toLocaleString()} color="green" />
        <StatCard icon={Package} label="Stock Total" value={data.stock_total.toLocaleString()} color="purple" />
        <StatCard
          icon={AlertTriangle}
          label="Alertes Réappro"
          value={data.alertes_reappro}
          color="red"
          subtitle="Priorité HAUTE ou MOYENNE"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demande mensuelle */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Demande par Mois</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.demande_par_mois}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="demande" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition priorités */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Répartition des Priorités</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={prioriteData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {prioriteData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Saison + Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demande par saison */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Demande par Saison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={saisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="demande" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top 5 Médicaments Demandés</h3>
          <div className="space-y-3">
            {data.top_demande.map((med, idx) => (
              <div
                key={med.idmedicament}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/medicaments/${med.idmedicament}`)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{med.nommedicament}</p>
                    <p className="text-xs text-gray-500">ID: {med.idmedicament}</p>
                  </div>
                </div>
                <span className="font-semibold text-gray-700">{med.total_demande.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact jour férié */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Impact des Jours Fériés</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">{data.impact_jour_ferie.normal}</p>
            <p className="text-sm text-gray-500">Demande moyenne (jour normal)</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{data.impact_jour_ferie.jour_ferie}</p>
            <p className="text-sm text-red-400">Demande moyenne (jour férié)</p>
          </div>
        </div>
      </div>
    </div>
  );
}