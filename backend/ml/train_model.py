import os
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
import joblib

DATASET = os.path.join("..", "data", "posture_dataset.csv")
MODEL_OUT = os.path.join("..", "models", "posture_model.joblib")

# ---- Posture-quality features ONLY ----
FEATURES = [
    "head_dev_deg",
    "torso_dev_deg",
]

TARGET = "label"

df = pd.read_csv(DATASET)

X = df[FEATURES]
y = df[TARGET]

# Small dataset: keep deterministic (no split)
X_train = X
y_train = y

model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", LogisticRegression(
        max_iter=2000,
        class_weight="balanced"
    ))
])

model.fit(X_train, y_train)

# ---- Feature importance (logistic regression coefficients) ----
clf = model.named_steps["clf"]
coefs = clf.coef_
classes = clf.classes_

print("\n=== Feature Weights (per class) ===")
for i, c in enumerate(classes):
    weights = sorted(
        zip(FEATURES, coefs[i]),
        key=lambda t: abs(t[1]),
        reverse=True
    )
    print(f"\nClass: {c}")
    for feat, w in weights:
        print(f"  {feat:15s} {w:+.4f}")

os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
joblib.dump(model, MODEL_OUT)
print(f"\nSaved model to {MODEL_OUT}")
