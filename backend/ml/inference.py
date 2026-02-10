import os
import joblib
import pandas as pd

# Load once at import time (important for performance)
MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "models",
    "posture_model.joblib"
)

_model = None


def load_model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_posture(feature_vector: dict):
    """
    Runs ML prediction using posture-quality features only.

    IMPORTANT:
    - This model classifies posture quality (Good / Okay / Bad)
    - It does NOT measure confidence or data reliability
    """

    model = load_model()

    # ---- Posture-quality features ONLY ----
    FEATURE_COLUMNS = [
        "head_dev_deg",
        "torso_dev_deg",
    ]

    row = {
        col: feature_vector.get(col, 0.0)
        for col in FEATURE_COLUMNS
    }

    features = pd.DataFrame([row], columns=FEATURE_COLUMNS)

    label = model.predict(features)[0]
    probs = model.predict_proba(features)[0]

    classes = list(model.classes_)
    prob_map = {
        cls: float(prob)
        for cls, prob in zip(classes, probs)
    }

    return {
        "label": label,
        "confidence": float(max(probs)),
        "probabilities": prob_map,
        "features_used": FEATURE_COLUMNS,
    }
