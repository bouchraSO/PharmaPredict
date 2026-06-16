import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)

# ============================================================
# 1. DÉFINITION DES 60 MÉDICAMENTS
# ============================================================
medicaments = [
    # --- Antidouleurs / Fièvre (Fort impact Hiver) ---
    {"id": 1, "nom": "Doliprane", "prix": 11.00, "base_demande": 50, "saison_effect": {"Winter": 1.8, "Spring": 1.0, "Summer": 0.8, "Autumn": 1.3}},
    {"id": 2, "nom": "Ibuprofène", "prix": 12.00, "base_demande": 40, "saison_effect": {"Winter": 1.6, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.2}},
    {"id": 3, "nom": "Paracétamol", "prix": 10.00, "base_demande": 55, "saison_effect": {"Winter": 1.7, "Spring": 1.0, "Summer": 0.8, "Autumn": 1.3}},
    {"id": 4, "nom": "Dafalgan", "prix": 12.50, "base_demande": 35, "saison_effect": {"Winter": 1.5, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.2}},
    {"id": 5, "nom": "Aspirine", "prix": 10.00, "base_demande": 25, "saison_effect": {"Winter": 1.4, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.1}},
    {"id": 6, "nom": "Efferalgan", "prix": 13.20, "base_demande": 30, "saison_effect": {"Winter": 1.6, "Spring": 1.0, "Summer": 0.8, "Autumn": 1.2}},
    {"id": 7, "nom": "Nurofen", "prix": 13.00, "base_demande": 32, "saison_effect": {"Winter": 1.5, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.2}},
    {"id": 8, "nom": "Aspegic", "prix": 15.75, "base_demande": 18, "saison_effect": {"Winter": 1.4, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.1}},
    {"id": 9, "nom": "Tramadol", "prix": 80.00, "base_demande": 7, "saison_effect": {"Winter": 1.1, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 10, "nom": "Codeine", "prix": 65.00, "base_demande": 8, "saison_effect": {"Winter": 1.3, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.1}},
    
    # --- Rhume / Toux / ORL (Fort impact Hiver/Automne) ---
    {"id": 11, "nom": "Fervex", "prix": 18.50, "base_demande": 25, "saison_effect": {"Winter": 2.2, "Spring": 0.8, "Summer": 0.3, "Autumn": 1.5}},
    {"id": 12, "nom": "Humex", "prix": 16.90, "base_demande": 19, "saison_effect": {"Winter": 2.0, "Spring": 0.9, "Summer": 0.4, "Autumn": 1.4}},
    {"id": 13, "nom": "Maxilase", "prix": 16.00, "base_demande": 17, "saison_effect": {"Winter": 2.0, "Spring": 0.9, "Summer": 0.4, "Autumn": 1.3}},
    {"id": 14, "nom": "Lysopaïne", "prix": 10.50, "base_demande": 30, "saison_effect": {"Winter": 2.0, "Spring": 1.0, "Summer": 0.5, "Autumn": 1.4}},
    {"id": 15, "nom": "Exomuc", "prix": 26.00, "base_demande": 17, "saison_effect": {"Winter": 2.0, "Spring": 0.9, "Summer": 0.5, "Autumn": 1.3}},
    {"id": 16, "nom": "Mucomyst", "prix": 25.00, "base_demande": 16, "saison_effect": {"Winter": 1.8, "Spring": 1.0, "Summer": 0.6, "Autumn": 1.3}},
    
    # --- Allergie / Asthme (Fort impact Printemps/Été) ---
    {"id": 17, "nom": "Zyrtec", "prix": 20.00, "base_demande": 26, "saison_effect": {"Winter": 0.5, "Spring": 1.8, "Summer": 2.0, "Autumn": 1.0}},
    {"id": 18, "nom": "Aerius", "prix": 45.20, "base_demande": 12, "saison_effect": {"Winter": 0.4, "Spring": 1.9, "Summer": 2.1, "Autumn": 0.9}},
    {"id": 19, "nom": "Claritine", "prix": 28.00, "base_demande": 16, "saison_effect": {"Winter": 0.5, "Spring": 1.7, "Summer": 1.9, "Autumn": 0.9}},
    {"id": 20, "nom": "Ventoline", "prix": 65.00, "base_demande": 9, "saison_effect": {"Winter": 1.3, "Spring": 1.5, "Summer": 1.2, "Autumn": 1.4}},
    {"id": 21, "nom": "Flixotide", "prix": 75.00, "base_demande": 6, "saison_effect": {"Winter": 1.4, "Spring": 1.4, "Summer": 1.0, "Autumn": 1.5}},
    
    # --- Antibiotiques (Légèrement plus élevé en Hiver/Printemps) ---
    {"id": 22, "nom": "Amoxicilline", "prix": 25.00, "base_demande": 20, "saison_effect": {"Winter": 1.5, "Spring": 1.2, "Summer": 0.7, "Autumn": 1.2}},
    {"id": 23, "nom": "Augmentin", "prix": 60.00, "base_demande": 14, "saison_effect": {"Winter": 1.4, "Spring": 1.1, "Summer": 0.7, "Autumn": 1.1}},
    {"id": 24, "nom": "Azithromycine", "prix": 70.25, "base_demande": 9, "saison_effect": {"Winter": 1.3, "Spring": 1.0, "Summer": 0.8, "Autumn": 1.0}},
    {"id": 25, "nom": "Bactrim", "prix": 35.00, "base_demande": 10, "saison_effect": {"Winter": 1.2, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.0}},
    {"id": 26, "nom": "Ciprofloxacine", "prix": 40.00, "base_demande": 8, "saison_effect": {"Winter": 1.1, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.0}},
    {"id": 27, "nom": "Doxycycline", "prix": 22.00, "base_demande": 12, "saison_effect": {"Winter": 1.2, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.0}},
    {"id": 28, "nom": "Orken", "prix": 28.00, "base_demande": 11, "saison_effect": {"Winter": 1.3, "Spring": 1.1, "Summer": 0.8, "Autumn": 1.0}},
    
    # --- Gastro / Digestif (Stable, pic estival lié à la chaleur) ---
    {"id": 29, "nom": "Smecta", "prix": 12.50, "base_demande": 35, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.4, "Autumn": 1.0}},
    {"id": 30, "nom": "Spasfon", "prix": 11.80, "base_demande": 33, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.3, "Autumn": 1.0}},
    {"id": 31, "nom": "Imodium", "prix": 21.50, "base_demande": 14, "saison_effect": {"Winter": 0.9, "Spring": 1.0, "Summer": 1.4, "Autumn": 1.0}},
    {"id": 32, "nom": "Debridat", "prix": 22.30, "base_demande": 19, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.2, "Autumn": 1.0}},
    {"id": 33, "nom": "Météospasmyl", "prix": 18.00, "base_demande": 19, "saison_effect": {"Winter": 0.9, "Spring": 1.0, "Summer": 1.3, "Autumn": 1.0}},
    {"id": 34, "nom": "Gaviscon", "prix": 14.00, "base_demande": 22, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.1, "Autumn": 1.0}},
    {"id": 35, "nom": "Maalox", "prix": 14.20, "base_demande": 22, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.1, "Autumn": 1.0}},
    {"id": 36, "nom": "Tiorfan", "prix": 24.00, "base_demande": 20, "saison_effect": {"Winter": 0.9, "Spring": 1.0, "Summer": 1.4, "Autumn": 1.0}},
    {"id": 37, "nom": "Forlax", "prix": 20.00, "base_demande": 18, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.1, "Autumn": 1.0}},
    {"id": 38, "nom": "Dulcolax", "prix": 17.80, "base_demande": 15, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.1, "Autumn": 1.0}},
    {"id": 39, "nom": "Lopéramide", "prix": 15.00, "base_demande": 18, "saison_effect": {"Winter": 0.9, "Spring": 1.0, "Summer": 1.3, "Autumn": 1.0}},
    
    # --- Chronique / Cardio / Diabète (Très stable toute l'année) ---
    {"id": 40, "nom": "Levothyrox", "prix": 19.00, "base_demande": 22, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 41, "nom": "Metformine", "prix": 22.00, "base_demande": 25, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 42, "nom": "Kardegic", "prix": 33.00, "base_demande": 12, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 43, "nom": "Tahor", "prix": 52.00, "base_demande": 10, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 44, "nom": "Atorvastatine", "prix": 55.90, "base_demande": 10, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 45, "nom": "Ramipril", "prix": 29.00, "base_demande": 18, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 46, "nom": "Xarelto", "prix": 90.00, "base_demande": 10, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 47, "nom": "Oméprazole", "prix": 45.00, "base_demande": 14, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 48, "nom": "Inexium", "prix": 50.00, "base_demande": 10, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 49, "nom": "Pantoprazole", "prix": 46.00, "base_demande": 13, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 50, "nom": "Insuline", "prix": 120.00, "base_demande": 5, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    
    # --- Psycho / Anxiété / Sommeil ---
    {"id": 51, "nom": "Lexomil", "prix": 48.00, "base_demande": 9, "saison_effect": {"Winter": 1.1, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.0}},
    {"id": 52, "nom": "Alprazolam", "prix": 30.50, "base_demande": 8, "saison_effect": {"Winter": 1.1, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.0}},
    {"id": 53, "nom": "Xanax", "prix": 75.00, "base_demande": 8, "saison_effect": {"Winter": 1.1, "Spring": 1.0, "Summer": 0.9, "Autumn": 1.0}},
    {"id": 54, "nom": "Prozac", "prix": 60.00, "base_demande": 8, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 55, "nom": "Seroplex", "prix": 55.00, "base_demande": 10, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.0, "Autumn": 1.0}},
    {"id": 56, "nom": "Stilnox", "prix": 70.00, "base_demande": 6, "saison_effect": {"Winter": 1.2, "Spring": 1.0, "Summer": 0.8, "Autumn": 1.1}},
    
    # --- Divers / Premiers soins / Corticoïdes ---
    {"id": 57, "nom": "Biafine", "prix": 35.10, "base_demande": 30, "saison_effect": {"Winter": 0.5, "Spring": 0.8, "Summer": 2.2, "Autumn": 0.7}},
    {"id": 58, "nom": "Bétadine", "prix": 18.40, "base_demande": 22, "saison_effect": {"Winter": 0.8, "Spring": 1.0, "Summer": 1.4, "Autumn": 1.0}},
    {"id": 59, "nom": "Cortisone", "prix": 40.00, "base_demande": 13, "saison_effect": {"Winter": 1.2, "Spring": 1.3, "Summer": 1.0, "Autumn": 1.1}},
    {"id": 60, "nom": "Vogalène", "prix": 18.00, "base_demande": 21, "saison_effect": {"Winter": 1.0, "Spring": 1.0, "Summer": 1.3, "Autumn": 1.0}},
]

# ============================================================
# 2. JOURS FÉRIÉS DU MAROC (2024 & 2025)
# ============================================================
jours_feries = [
    # --- 2024 ---
    "2024-01-01", # 1er Janvier
    "2024-01-11", # Manifeste de l'indépendance
    "2024-04-10", # Eid al-Fitr (1er jour - estimé)
    "2024-05-01", # Fête du Travail
    "2024-06-16", # Eid al-Adha (1er jour - estimé)
    "2024-07-08", # 1er Muharram (Nouvel an islamique - estimé)
    "2024-07-30", # Fête du Trône
    "2024-08-14", # Journée de Oued Ed-Dahab
    "2024-08-20", # Fête de la Révolution
    "2024-08-21", # Fête de la Jeunesse
    "2024-09-15", # Aïd al-Mawlid (Anniversaire du Prophète - estimé)
    "2024-11-06", # Journée de la Marche Verte
    "2024-11-18", # Fête de l'Indépendance
    
    # --- 2025 ---
    "2025-01-01", # 1er Janvier
    "2025-01-11", # Manifeste de l'indépendance
    "2025-03-30", # Eid al-Fitr (1er jour - estimé)
    "2025-05-01", # Fête du Travail
    "2025-06-06", # Eid al-Adha (1er jour - estimé)
    "2025-06-26", # 1er Muharram (Nouvel an islamique - estimé)
    "2025-07-30", # Fête du Trône
    "2025-08-14", # Journée de Oued Ed-Dahab
    "2025-08-20", # Fête de la Révolution
    "2025-08-21", # Fête de la Jeunesse
    "2025-09-05", # Aïd al-Mawlid (Anniversaire du Prophète - estimé)
    "2025-11-06", # Journée de la Marche Verte
    "2025-11-18", # Fête de l'Indépendance
]
jours_feries_set = set(pd.to_datetime(jours_feries))

def get_season(date):
    if date.month in [12, 1, 2]: return "Winter"
    if date.month in [3, 4, 5]: return "Spring"
    if date.month in [6, 7, 8]: return "Summer"
    return "Autumn"

# ============================================================
# 3. GÉNÉRATION DES DONNÉES
# ============================================================
data = []
start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 12, 31)

for med in medicaments:
    stock = np.random.randint(150, 400)
    
    current_date = start_date
    while current_date <= end_date:
        season = get_season(current_date)
        is_holiday = 1 if current_date in jours_feries_set else 0
        is_weekend = 1 if current_date.weekday() >= 5 else 0
        is_day_before_holiday = 1 if (current_date + timedelta(days=1)) in jours_feries_set else 0
        
        # Calcul de la demande
        demande = med["base_demande"] * med["saison_effect"][season]
        demande *= (1 + np.random.normal(0, 0.15))  # Bruit aléatoire
        
        if is_holiday: demande *= 0.5          # Baisse forte si férié
        if is_day_before_holiday: demande *= 1.3  # Hausse anticipation
        if is_weekend: demande *= 1.15          # Léger effet week-end
        
        qtechete = max(0, int(demande))
        
        # Gestion dynamique du stock
        stock -= qtechete
        if stock < med["base_demande"] * 1.5:  # Seuil de réapprovisionnement
            stock += np.random.randint(150, 300)
            
        data.append({
            "idmedicament": med["id"],
            "nommedicament": med["nom"],
            "prix": med["prix"],
            "qtechete": qtechete,
            "date": current_date.strftime("%Y-%m-%d"),
            "season": season,
            "jourférié": is_holiday,
            "stock_actuel": max(0, stock)
        })
        
        current_date += timedelta(days=1)

df = pd.DataFrame(data)
df = df.sample(frac=1).reset_index(drop=True)
df.to_csv("data.csv", index=False)
print(f"✅ Dataset générée avec succès : {df.shape[0]} lignes sauvegardées dans data.csv")