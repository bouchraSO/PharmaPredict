import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill } from 'lucide-react';
import { getMedicaments } from '../api/apiClient';

export default function Medicaments() {
  const [medicaments, setMedicaments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMedicaments()
      .then(res => setMedicaments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = medicaments.filter(m =>
    m.nommedicament.toLowerCase().includes(search.toLowerCase()) ||
    m.idmedicament.toString().includes(search)
  );

  if (loading) return <div className="text-center py-20 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Médicaments</h2>
        <span className="text-sm text-gray-500">{filtered.length} résultats</span>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nom</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Prix (DH)</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Demande Totale</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock Actuel</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(med => (
              <tr key={med.idmedicament} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-500">{med.idmedicament}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900">{med.nommedicament}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">{med.prix.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-700">
                  {med.demande_totale.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={`font-semibold ${med.stock_actuel < 50 ? 'text-red-600' : 'text-green-600'}`}>
                    {med.stock_actuel}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => navigate(`/medicaments/${med.idmedicament}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Détails →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}