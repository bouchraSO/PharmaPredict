import React, { useState, useEffect } from 'react';
import { Send, Calendar, Package, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { predictDemand, getMedicaments } from '../api/apiClient';

export default function PredictForm() {
  const [medicaments, setMedicaments] = useState([]);
  const [formData, setFormData] = useState({
    medicamentId: '', // Sera rempli via la liste déroulante
    stock_actuel: 100,
    date: new Date().toISOString().split('T')[0],
    jourType: 'normal', // 'normal', 'ferie', 'veille', 'lendemain', 'pont'
    // Historique simplifié (seuls les lags sont demandés)
    qtechete_lag_1: 80,
    qtechete_lag_2: 75,
    qtechete_lag_3: 90,
    qtechete_lag_7: 85,
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Charger la liste des médicaments au démarrage
  useEffect(() => {
    getMedicaments()
      .then(res => {
        setMedicaments(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, medicamentId: res.data[0].idmedicament }));
        }
      })
      .catch(console.error);
  }, []);

  // Calcul automatique des features liées à la date
  const getDerivedDateFeatures = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const dayOfWeek = (date.getDay() + 6) % 7; 
    const dayOfMonth = date.getDate();
    const quarter = Math.ceil(month / 3);
    const isWeekend = dayOfWeek >= 5 ? 1 : 0;
    
    let season = 'Winter';
    if (month >= 3 && month <= 5) season = 'Spring';
    else if (month >= 6 && month <= 8) season = 'Summer';
    else if (month >= 9 && month <= 11) season = 'Autumn';

    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
    const weekOfYear = Math.ceil((days + start.getDay() + 1) / 7);

    return { month, day_of_week: dayOfWeek, day_of_month: dayOfMonth, week_of_year: weekOfYear, quarter, is_weekend: isWeekend, season };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const dateFeatures = getDerivedDateFeatures(formData.date);
      const selectedMed = medicaments.find(m => m.idmedicament === parseInt(formData.medicamentId));
      
      if (!selectedMed) {
        alert("Veuillez sélectionner un médicament valide.");
        setLoading(false);
        return;
      }

      // Récupération des lags
      const lag1 = parseFloat(formData.qtechete_lag_1) || 0;
      const lag2 = parseFloat(formData.qtechete_lag_2) || 0;
      const lag3 = parseFloat(formData.qtechete_lag_3) || 0;
      const lag7 = parseFloat(formData.qtechete_lag_7) || 0;

      // CALCUL AUTOMATIQUE DES MOYENNES ET ECART-TYPES (ce que l'utilisateur n'a plus à saisir)
      const lagsArray = [lag1, lag2, lag3, lag7].filter(l => l > 0); // Filtrer les 0
      const mean3 = (lag1 + lag2 + lag3) / 3;
      const mean7 = lagsArray.length > 0 ? lagsArray.reduce((a, b) => a + b, 0) / lagsArray.length : 0;
      const std7 = lagsArray.length > 1 
        ? Math.sqrt(lagsArray.reduce((sq, n) => sq + Math.pow(n - mean7, 2), 0) / lagsArray.length) 
        : 0;
            // Traduction du bouton radio en 4 variables pour l'API
      const jourFeatures = {
        jourférié: formData.jourType === 'ferie' ? 1 : 0,
        avant_jour_ferie: formData.jourType === 'veille' ? 1 : 0,
        apres_jour_ferie: formData.jourType === 'lendemain' ? 1 : 0,
        is_bridge: formData.jourType === 'pont' ? 1 : 0,
      };
      // Construction du payload pour l'API
      const payload = {
        idmedicament: selectedMed.idmedicament,
        prix: selectedMed.prix, // Prix récupéré automatiquement
        stock_actuel: parseInt(formData.stock_actuel),
        ...dateFeatures,
        ...jourFeatures, // Insère les 4 variables calculées automatiquement
        qtechete_lag_1: lag1,
        qtechete_lag_2: lag2,
        qtechete_lag_3: lag3,
        qtechete_lag_7: lag7,
        qtechete_rolling_mean_3: mean3,      // Calculé automatiquement
        qtechete_rolling_mean_7: mean7,      // Calculé automatiquement
        qtechete_rolling_std_7: std7,        // Calculé automatiquement
      };
      

      const res = await predictDemand(payload);
      setResult(res.data);
    } catch (error) {
      console.error("Erreur de prédiction:", error);
      alert("Erreur lors de la prédiction. Vérifiez que l'API est lancée.");
    } finally {
      setLoading(false);
    }
  };

  // Logique de réapprovisionnement
  const getRestockInfo = () => {
    if (!result) return null;
    const stockSecurite = result.demande_predite * 0.3;
    const seuil = result.demande_predite + stockSecurite;
    const stock = parseInt(formData.stock_actuel);
    
    if (stock <= seuil) {
       // Calcul logique : Quantité = Seuil - Stock Actuel
      const seuil = result.demande_predite + stockSecurite;
      const qteReappro = Math.round(seuil - stock);
      return { action: "RÉAPPROVISIONNER", quantite: Math.max(0, qteReappro), color: "text-red-600 bg-red-50 border-red-200" };
    }
    return { action: "STOCK SUFFISANT", quantite: 0, color: "text-green-600 bg-green-50 border-green-200" };
  };

  const restockInfo = getRestockInfo();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Simuler une Prédiction</h2>
      <p className="text-gray-500">Sélectionnez un médicament et entrez les données visibles pour obtenir une recommandation.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-6">
        
        {/* Sélection du Médicament et Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Médicament</label>
            <select 
              name="medicamentId" 
              value={formData.medicamentId} 
              onChange={handleChange} 
              required
              className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              {medicaments.map(med => (
                <option key={med.idmedicament} value={med.idmedicament}>
                  {med.nommedicament} (ID: {med.idmedicament})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actuel</label>
            <input type="number" name="stock_actuel" value={formData.stock_actuel} onChange={handleChange} required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de prévision</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        {/* Paramètres Contextuels */}
        {/* Paramètres Contextuels */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">Type de journée</label>
          <div className="flex flex-wrap gap-4">
            {[
              { value: 'normal', label: 'Jour normal' },
              { value: 'ferie', label: 'Jour férié' },
              { value: 'veille', label: 'Veille de férié' },
              { value: 'lendemain', label: 'Lendemain de férié' },
              { value: 'pont', label: 'Jour de pont' },
            ].map((type) => (
              <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="jourType"
                  value={type.value}
                  checked={formData.jourType === type.value}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Historique simplifié (Lags uniquement) */}
        <div>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600">
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Historique des ventes récentes (Optionnel)
          </button>
          
          {showAdvanced && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 border border-dashed rounded-lg bg-gray-50">
              <div>
                <label className="text-xs text-gray-500">Ventes hier (J-1)</label>
                <input type="number" name="qtechete_lag_1" value={formData.qtechete_lag_1} onChange={handleChange} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ventes avant-hier (J-2)</label>
                <input type="number" name="qtechete_lag_2" value={formData.qtechete_lag_2} onChange={handleChange} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ventes il y a 3 jours (J-3)</label>
                <input type="number" name="qtechete_lag_3" value={formData.qtechete_lag_3} onChange={handleChange} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Ventes il y a 7 jours (J-7)</label>
                <input type="number" name="qtechete_lag_7" value={formData.qtechete_lag_7} onChange={handleChange} className="w-full border rounded px-2 py-1 text-sm" />
              </div>
              
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
            <Send className="w-4 h-4" />
            {loading ? 'Calcul en cours...' : 'Prédire la demande'}
          </button>
        </div>
      </form>

      {/* Résultat */}
      {result && restockInfo && (
        <div className="bg-white rounded-xl border p-6 space-y-4 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900">Résultat de la simulation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-blue-600" /><span className="text-sm text-blue-700">Demande Prédite</span></div>
              <p className="text-3xl font-bold text-blue-700">{result.demande_predite} <span className="text-sm font-normal">unités</span></p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-gray-600" /><span className="text-sm text-gray-700">Stock Actuel Saisi</span></div>
              <p className="text-3xl font-bold text-gray-700">{formData.stock_actuel} <span className="text-sm font-normal">unités</span></p>
            </div>

            <div className={`p-4 rounded-lg border ${restockInfo.color}`}>
              <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5" /><span className="text-sm font-bold">Recommandation</span></div>
              <p className="text-xl font-bold">{restockInfo.action}</p>
              {restockInfo.quantite > 0 && <p className="text-sm mt-1">Commander : <span className="font-bold text-lg">{restockInfo.quantite} unités</span></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}