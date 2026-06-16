from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import pickle
import json
import os
from datetime import datetime, timedelta

app = FastAPI(
    title="Medication Demand Prediction & Restocking API",
    description="API de prédiction de demande et recommandation de réapprovisionnement",
    version="1.0.0"
)

# CORS pour React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# CHARGEMENT DES ARTEFACTS
# ============================================================

MODEL_DIR = "model_artifacts"

def load_artifacts():
    with open(f"{MODEL_DIR}/model.pkl", "rb") as f:
        model = pickle.load(f)
    with open(f"{MODEL_DIR}/features.pkl", "rb") as f:
        features = pickle.load(f)
    with open(f"{MODEL_DIR}/label_encoder.pkl", "rb") as f:
        le_medicament = pickle.load(f)
    with open(f"{MODEL_DIR}/artifacts.json", "r") as f:
        artifacts = json.load(f)
    with open(f"{MODEL_DIR}/recommendations.json", "r") as f:
        recommendations = json.load(f)
    return model, features, le_medicament, artifacts, recommendations

model, features, le_medicament, artifacts, cached_recommendations = load_artifacts()

 # Charger les données brutes pour les endpoints historiques
try:
    raw_df = pd.read_csv("data.csv")
    raw_df['date'] = pd.to_datetime(raw_df['date'])
except:
    raw_df = pd.DataFrame()


# ============================================================
# MODÈLES PYDANTIC
# ============================================================

class PredictionRequest(BaseModel):
    idmedicament: int
    prix: float
    stock_actuel: int
    month: int
    day_of_week: int
    day_of_month: int
    week_of_year: int
    is_weekend: int
    quarter: int
    season: str
    jourférié: int
    avant_jour_ferie: int       # <-- AJOUTÉ
    apres_jour_ferie: int       # <-- AJOUTÉ
    is_bridge: int              # <-- AJOUTÉ
    qtechete_lag_1: float
    qtechete_lag_2: float
    qtechete_lag_3: float
    qtechete_lag_7: float
    qtechete_rolling_mean_3: float
    qtechete_rolling_mean_7: float
    qtechete_rolling_std_7: float

class PredictionResponse(BaseModel):
    idmedicament: int
    demande_predite: int
    confiance: float

class RecommendationItem(BaseModel):
    idmedicament: int
    nommedicament: str
    prix: float
    stock_actuel: int
    demande_predite: int
    seuil_reappro: int
    quantite_reappro: int
    priorite: str
    action: str
    jours_couverture: float

class ModelMetrics(BaseModel):
    mae: float
    rmse: float
    r2: float


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "service": "Medication Demand Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/dashboard": "Statistiques globales du tableau de bord",
            "GET /api/medicaments": "Liste de tous les médicaments",
            "GET /api/medicaments/{id}": "Détail d'un médicament",
            "GET /api/historical/{id}": "Données historiques d'un médicament",
            "GET /api/predictions": "Toutes les prédictions de demande",
            "GET /api/predictions/{id}": "Prédiction pour un médicament",
            "POST /api/predict": "Prédire la demande avec des paramètres personnalisés",
            "GET /api/recommendations": "Recommandations de réapprovisionnement",
            "GET /api/recommendations/{id}": "Recommandation pour un médicament",
            "GET /api/model/metrics": "Métriques du modèle",
            "GET /api/model/features": "Importance des features",
        }
    }


# ---- DASHBOARD ----

@app.get("/api/dashboard")
def get_dashboard():
    total_medicaments = raw_df['idmedicament'].nunique() if not raw_df.empty else 0
    total_demande = int(raw_df['qtechete'].sum()) if not raw_df.empty else 0
    stock_total = int(raw_df['stock_actuel'].sum()) if not raw_df.empty else 0
    
    alertes = [r for r in cached_recommendations if r['priorite'] in ['HAUTE', 'MOYENNE']]
    
    # Demande par saison
    demande_par_saison = {}
    if not raw_df.empty:
        for season, group in raw_df.groupby('season'):
            demande_par_saison[season] = int(group['qtechete'].sum())
    
    # Top 5 médicaments les plus demandés
    top_demande = []
    if not raw_df.empty:
        top = raw_df.groupby(['idmedicament', 'nommedicament'])['qtechete'].sum().reset_index()
        top = top.sort_values('qtechete', ascending=False).head(5)
        for _, row in top.iterrows():
            top_demande.append({
                'idmedicament': int(row['idmedicament']),
                'nommedicament': row['nommedicament'],
                'total_demande': int(row['qtechete'])
            })
    
    # Demande par mois (pour graphique)
    demande_par_mois = []
    if not raw_df.empty:
        monthly = raw_df.groupby(raw_df['date'].dt.to_period('M'))['qtechete'].sum()
        for period, val in monthly.items():
            demande_par_mois.append({
                'mois': str(period),
                'demande': int(val)
            })
    
    # Impact jours fériés
    impact_jour_ferie = {}
    if not raw_df.empty:
        jf = raw_df.groupby('jourférié')['qtechete'].mean()
        impact_jour_ferie = {
            'normal': round(float(jf.get(0, 0)), 1),
            'jour_ferie': round(float(jf.get(1, 0)), 1)
        }
    
    return {
        "total_medicaments": total_medicaments,
        "total_demande": total_demande,
        "stock_total": stock_total,
        "alertes_reappro": len(alertes),
        "demande_par_saison": demande_par_saison,
        "top_demande": top_demande,
        "demande_par_mois": demande_par_mois,
        "impact_jour_ferie": impact_jour_ferie,
        "repartition_priorites": {
            "HAUTE": len([r for r in cached_recommendations if r['priorite'] == 'HAUTE']),
            "MOYENNE": len([r for r in cached_recommendations if r['priorite'] == 'MOYENNE']),
            "BASSE": len([r for r in cached_recommendations if r['priorite'] == 'BASSE']),
            "AUCUNE": len([r for r in cached_recommendations if r['priorite'] == 'AUCUNE'])
        }
    }


# ---- MÉDICAMENTS ----

@app.get("/api/medicaments")
def get_medicaments():
    if raw_df.empty:
        raise HTTPException(status_code=404, detail="Aucune donnée disponible")
    
    medicaments = raw_df.groupby(['idmedicament', 'nommedicament']).agg({
        'prix': 'first',
        'qtechete': 'sum',
        'stock_actuel': 'last'
    }).reset_index()
    
    result = []
    for _, row in medicaments.iterrows():
        result.append({
            "idmedicament": int(row['idmedicament']),
            "nommedicament": row['nommedicament'],
            "prix": float(row['prix']),
            "demande_totale": int(row['qtechete']),
            "stock_actuel": int(row['stock_actuel'])
        })
    return result


@app.get("/api/medicaments/{id_medicament}")
def get_medicament(id_medicament: int):
    if raw_df.empty:
        raise HTTPException(status_code=404, detail="Aucune donnée disponible")
    
    med_data = raw_df[raw_df['idmedicament'] == id_medicament]
    if med_data.empty:
        raise HTTPException(status_code=404, detail=f"Médicament {id_medicament} non trouvé")
    
    first_row = med_data.iloc[0]
    
    return {
        "idmedicament": int(id_medicament),
        "nommedicament": first_row['nommedicament'],
        "prix": float(first_row['prix']),
        "stock_actuel": int(med_data['stock_actuel'].iloc[-1]),
        "demande_moyenne": round(float(med_data['qtechete'].mean()), 1),
        "demande_max": int(med_data['qtechete'].max()),
        "demande_min": int(med_data['qtechete'].min()),
        "demande_totale": int(med_data['qtechete'].sum()),
        "nb_enregistrements": len(med_data)
    }


# ---- HISTORIQUE ----

@app.get("/api/historical/{id_medicament}")
def get_historical(id_medicament: int, limit: int = Query(default=100, le=500)):
    if raw_df.empty:
        raise HTTPException(status_code=404, detail="Aucune donnée disponible")
    
    med_data = raw_df[raw_df['idmedicament'] == id_medicament].sort_values('date')
    if med_data.empty:
        raise HTTPException(status_code=404, detail=f"Médicament {id_medicament} non trouvé")
    
    med_data = med_data.tail(limit)
    
    result = []
    for _, row in med_data.iterrows():
        result.append({
            "date": row['date'].strftime('%Y-%m-%d'),
            "qtechete": int(row['qtechete']),
            "prix": float(row['prix']),
            "stock_actuel": int(row['stock_actuel']),
            "season": row['season'],
            "jourférié": int(row['jourférié'])
        })
    return {
        "idmedicament": int(id_medicament),
        "nommedicament": med_data.iloc[0]['nommedicament'],
        "data": result
    }


# ---- PRÉDICTIONS ----

@app.get("/api/predictions")
def get_all_predictions():
    result = []
    for rec in cached_recommendations:
        result.append({
            "idmedicament": rec['idmedicament'],
            "nommedicament": rec['nommedicament'],
            "demande_predite": rec['demande_predite'],
            "stock_actuel": rec['stock_actuel'],
            "jours_couverture": rec['jours_couverture']
        })
    return result


@app.get("/api/predictions/{id_medicament}")
def get_prediction(id_medicament: int):
    for rec in cached_recommendations:
        if rec['idmedicament'] == id_medicament:
            return {
                "idmedicament": rec['idmedicament'],
                "nommedicament": rec['nommedicament'],
                "demande_predite": rec['demande_predite'],
                "stock_actuel": rec['stock_actuel'],
                "seuil_reappro": rec['seuil_reappro'],
                "jours_couverture": rec['jours_couverture'],
                "priorite": rec['priorite']
            }
    raise HTTPException(status_code=404, detail=f"Prédiction non trouvée pour le médicament {id_medicament}")


@app.post("/api/predict", response_model=PredictionResponse)
def predict_demand(request: PredictionRequest):
    season_map = artifacts.get('season_map', {'Winter': 0, 'Spring': 1, 'Summer': 2, 'Autumn': 3})
    season_encoded = season_map.get(request.season, 0)
    
    try:
        med_encoded = le_medicament.transform([str(request.idmedicament)])[0]
    except ValueError:
        med_encoded = 0
    
    taux_rotation = request.qtechete_lag_1 / (request.stock_actuel + 1)
    stock_demand_ratio = request.stock_actuel / (request.qtechete_lag_1 + 1)
    
    feature_dict = {
        'medicament_encoded': med_encoded,
        'prix': request.prix,
        'month': request.month,
        'day_of_week': request.day_of_week,
        'day_of_month': request.day_of_month,
        'week_of_year': request.week_of_year,
        'is_weekend': request.is_weekend,
        'quarter': request.quarter,
        'season_encoded': season_encoded,
        'jourférié': request.jourférié,
        'stock_actuel': request.stock_actuel,
        'avant_jour_ferie': request.avant_jour_ferie,    # <-- AJOUTÉ
        'apres_jour_ferie': request.apres_jour_ferie,    # <-- AJOUTÉ
        'is_bridge': request.is_bridge,                  # <-- AJOUTÉ
        'qtechete_lag_1': request.qtechete_lag_1,
        'qtechete_lag_2': request.qtechete_lag_2,
        'qtechete_lag_3': request.qtechete_lag_3,
        'qtechete_lag_7': request.qtechete_lag_7,
        'qtechete_rolling_mean_3': request.qtechete_rolling_mean_3,
        'qtechete_rolling_mean_7': request.qtechete_rolling_mean_7,
        'qtechete_rolling_std_7': request.qtechete_rolling_std_7,
        'taux_rotation': taux_rotation,
        'stock_demand_ratio': stock_demand_ratio
    }
    
    X_pred = pd.DataFrame([feature_dict])[features]
    prediction = model.predict(X_pred)[0]
    prediction = max(0, round(prediction))
    
    return PredictionResponse(
        idmedicament=request.idmedicament,
        demande_predite=int(prediction),
        confiance=0.85  # Score de confiance simplifié
    )


# ---- RECOMMANDATIONS ----

@app.get("/api/recommendations", response_model=List[RecommendationItem])
def get_recommendations(priorite: Optional[str] = Query(default=None)):
    result = cached_recommendations
    if priorite:
        result = [r for r in result if r['priorite'] == priorite.upper()]
    return result


@app.get("/api/recommendations/{id_medicament}", response_model=RecommendationItem)
def get_recommendation(id_medicament: int):
    for rec in cached_recommendations:
        if rec['idmedicament'] == id_medicament:
            return rec
    raise HTTPException(status_code=404, detail=f"Recommandation non trouvée pour le médicament {id_medicament}")


# ---- MODÈLE ----

@app.get("/api/model/metrics", response_model=ModelMetrics)
def get_model_metrics():
    return ModelMetrics(
        mae=artifacts['metrics']['mae'],
        rmse=artifacts['metrics']['rmse'],
        r2=artifacts['metrics']['r2']
    )


@app.get("/api/model/features")
def get_feature_importance():
    importance = artifacts['metrics']['feature_importance']
    sorted_importance = sorted(importance.items(), key=lambda x: -x[1])
    return [{"feature": f, "importance": round(i, 4)} for f, i in sorted_importance]


# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)