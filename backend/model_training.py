import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import pickle
import os
import json

# ============================================================
# 1. CHARGEMENT ET PRÉPARATION DES DONNÉES
# ============================================================

def load_and_prepare_data(filepath="data.csv"):
    df = pd.read_csv(filepath)
    
    # Conversion de la date
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['idmedicament', 'date']).reset_index(drop=True)
    
    # ---- Feature Engineering ----
    df['month'] = df['date'].dt.month
    df['day_of_week'] = df['date'].dt.dayofweek
    df['day_of_month'] = df['date'].dt.day
    df['week_of_year'] = df['date'].dt.isocalendar().week.astype(int)
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['quarter'] = df['date'].dt.quarter
    
    # NOUVELLES FEATURES : Impact des jours fériés et week-ends
    # 1. Veille de jour férié (anticipation des patients)
    df['avant_jour_ferie'] = df.groupby('idmedicament')['jourférié'].shift(-1).fillna(0).astype(int)
    # 2. Lendemain de jour férié (rattrapage des ventes)
    df['apres_jour_ferie'] = df.groupby('idmedicament')['jourférié'].shift(1).fillna(0).astype(int)
    # 3. Jour de pont (jour ouvré coincé entre un week-end/férié et un férié/week-end)
    df['is_bridge'] = 0
    df['prev_is_off'] = ((df['jourférié'].shift(1) == 1) | (df['is_weekend'].shift(1) == 1)).astype(int)
    df['next_is_off'] = ((df['jourférié'].shift(-1) == 1) | (df['is_weekend'].shift(-1) == 1)).astype(int)
    df.loc[(df['is_weekend'] == 0) & (df['jourférié'] == 0) & ((df['prev_is_off'] == 1) | (df['next_is_off'] == 1)), 'is_bridge'] = 1
    df.drop(columns=['prev_is_off', 'next_is_off'], inplace=True)
    
    # Encodage de la saison
    season_map = {'Winter': 0, 'Spring': 1, 'Summer': 2, 'Autumn': 3}
    df['season_encoded'] = df['season'].map(season_map)
    
    # Encodage du médicament
    le_medicament = LabelEncoder()
    df['medicament_encoded'] = le_medicament.fit_transform(df['idmedicament'].astype(str))
    
    # ---- Features de lag (historique) ----
    df = df.copy()
    for lag in [1, 2, 3, 7]:
        df[f'qtechete_lag_{lag}'] = df.groupby('idmedicament')['qtechete'].shift(lag)
    
    # Moyenne mobile
    for window in [3, 7]:
        df[f'qtechete_rolling_mean_{window}'] = (
            df.groupby('idmedicament')['qtechete']
            .transform(lambda x: x.shift(1).rolling(window, min_periods=1).mean())
        )
    
    # Écart-type mobile
    df['qtechete_rolling_std_7'] = (
        df.groupby('idmedicament')['qtechete']
        .transform(lambda x: x.shift(1).rolling(7, min_periods=1).std())
    )
    
    # Taux de rotation = demande / stock
    df['taux_rotation'] = df['qtechete'] / (df['stock_actuel'] + 1)
    
    # Ratio stock/demande
    df['stock_demand_ratio'] = df['stock_actuel'] / (df['qtechete'] + 1)
    
    # Suppression des lignes avec NaN (dû aux lags)
    df = df.dropna().reset_index(drop=True)
    
    return df, le_medicament, season_map


# ============================================================
# 2. ENTRAÎNEMENT DU MODÈLE
# ============================================================

def train_model(df):
    features = [
        'medicament_encoded', 'prix', 'month', 'day_of_week',
        'day_of_month', 'week_of_year', 'is_weekend', 'quarter',
        'season_encoded', 'jourférié', 'stock_actuel',
        'avant_jour_ferie', 'apres_jour_ferie', 'is_bridge', 
        'qtechete_lag_1', 'qtechete_lag_2', 'qtechete_lag_3', 'qtechete_lag_7',
        'qtechete_rolling_mean_3', 'qtechete_rolling_mean_7',
        'qtechete_rolling_std_7', 'taux_rotation', 'stock_demand_ratio'
    ]
    
    target = 'qtechete'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Évaluation
    y_pred = model.predict(X_test)
    
    metrics = {
        'mae': float(mean_absolute_error(y_test, y_pred)),
        'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
        'r2': float(r2_score(y_test, y_pred)),
        'feature_importance': dict(zip(features, model.feature_importances_.tolist()))
    }
    
    print("=" * 50)
    print("RÉSULTATS DU MODÈLE")
    print("=" * 50)
    print(f"MAE  : {metrics['mae']:.2f}")
    print(f"RMSE : {metrics['rmse']:.2f}")
    print(f"R²   : {metrics['r2']:.4f}")
    print("\nImportance des features :")
    for feat, imp in sorted(metrics['feature_importance'].items(), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.4f}")
    
    return model, features, metrics


# ============================================================
# 3. GÉNÉRATION DES RECOMMANDATIONS
# ============================================================

def generate_recommendations(df, model, features, le_medicament, season_map):
    """
    Pour chaque médicament, prédire la demande future
    et comparer avec le stock actuel pour recommander.
    """
    recommendations = []
    
    # Dernier état connu par médicament
    latest_data = df.sort_values('date').groupby('idmedicament').last().reset_index()
    
    for _, row in latest_data.iterrows():
        id_med = row['idmedicament']
        stock_actuel = row['stock_actuel']
        nom = row['nommedicament']
        prix = row['prix']
        
        # Construire les features pour la prédiction
        feature_values = {}
        for f in features:
            if f in row.index:
                feature_values[f] = row[f]
            else:
                feature_values[f] = 0
        
        X_pred = pd.DataFrame([feature_values])[features]
        demande_predite = model.predict(X_pred)[0]
        demande_predite = max(0, round(demande_predite))
        
        # Logique de recommandation
        stock_securite = demande_predite * 0.3  # 30% de stock de sécurité
        seuil_reappro = demande_predite + stock_securite
        
        if stock_actuel <= seuil_reappro:
            # On commande juste ce qu'il faut pour atteindre le seuil
            quantite_reappro = int(seuil_reappro - stock_actuel)
            priorite = "HAUTE" if stock_actuel < demande_predite * 0.5 else (
                "MOYENNE" if stock_actuel < demande_predite else "BASSE"
            )
            action = "RÉAPPROVISIONNER"
        else:
            quantite_reappro = 0
            priorite = "AUCUNE"
            action = "PAS DE RÉAPPRO"
        
        # Jours de couverture
        jours_couverture = round(stock_actuel / (demande_predite / 30), 1) if demande_predite > 0 else 999
        
        recommendations.append({
            'idmedicament': int(id_med),
            'nommedicament': nom,
            'prix': float(prix),
            'stock_actuel': int(stock_actuel),
            'demande_predite': int(demande_predite),
            'seuil_reappro': int(seuil_reappro),
            'quantite_reappro': max(0, quantite_reappro),
            'priorite': priorite,
            'action': action,
            'jours_couverture': jours_couverture
        })
    
    # Trier par priorité
    priorite_order = {'HAUTE': 0, 'MOYENNE': 1, 'BASSE': 2, 'AUCUNE': 3}
    recommendations.sort(key=lambda x: priorite_order.get(x['priorite'], 4))
    
    return recommendations


# ============================================================
# 4. SAUVEGARDE
# ============================================================

def save_artifacts(model, features, le_medicament, season_map, metrics, recommendations):
    os.makedirs("model_artifacts", exist_ok=True)
    
    with open("model_artifacts/model.pkl", "wb") as f:
        pickle.dump(model, f)
    
    with open("model_artifacts/features.pkl", "wb") as f:
        pickle.dump(features, f)
    
    with open("model_artifacts/label_encoder.pkl", "wb") as f:
        pickle.dump(le_medicament, f)
    
    artifacts = {
        'season_map': season_map,
        'features': features,
        'metrics': metrics
    }
    with open("model_artifacts/artifacts.json", "w") as f:
        json.dump(artifacts, f, indent=2)
    
    with open("model_artifacts/recommendations.json", "w") as f:
        json.dump(recommendations, f, indent=2)
    
    print("\n✅ Artefacts sauvegardés dans model_artifacts/")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    df, le_medicament, season_map = load_and_prepare_data("data.csv")
    print(f"Dataset préparé : {df.shape[0]} lignes, {df.shape[1]} colonnes")
    
    model, features, metrics = train_model(df)
    
    recommendations = generate_recommendations(df, model, features, le_medicament, season_map)
    
    print("\n" + "=" * 50)
    print("RECOMMANDATIONS DE RÉAPPROVISIONNEMENT")
    print("=" * 50)
    for rec in recommendations:
        print(f"\n💊 {rec['nommedicament']} (ID: {rec['idmedicament']})")
        print(f"   Stock actuel     : {rec['stock_actuel']}")
        print(f"   Demande prédite  : {rec['demande_predite']}")
        print(f"   Jours couverture : {rec['jours_couverture']}")
        print(f"   Action           : {rec['action']} (Priorité: {rec['priorite']})")
        print(f"   Qté réappro      : {rec['quantite_reappro']}")
    
    save_artifacts(model, features, le_medicament, season_map, metrics, recommendations)