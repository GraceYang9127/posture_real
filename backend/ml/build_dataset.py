import os
import json
import csv

# Folder with your downloaded analysis JSONs
ANALYSIS_DIR = os.path.join("..", "data", "analyses")   # <- you said data/analysis
OUTPUT_CSV = os.path.join("..", "data", "posture_dataset.csv")

# Use the calibrated, explainable features
FEATURE_KEYS = [
    "head_dev_deg",
    "torso_dev_deg",
    "stability_std_dev_deg",
    "pose_coverage_sampled",
    "session_duration_sec",
]

def normalize_label(raw: str):
    """
    Collapse labels into stable classes.
    We keep it simple: Good / Okay / Risky.
    """
    if not raw:
        return None
    raw = raw.strip().lower()
    if raw in ("excellent", "good"):
        return "Good"
    if raw in ("okay", "average"):
        return "Okay"
    if raw in ("risky",):
        return "Risky"
    return None  # Unknown or anything else

rows = []

for fname in os.listdir(ANALYSIS_DIR):
    if not fname.endswith(".json"):
        continue

    path = os.path.join(ANALYSIS_DIR, fname)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    fv = data.get("feature_vector", {})
    label = normalize_label(data.get("weak_label"))

    # Skip Unknown/invalid labels (shouldn't be any with your 8)
    if label is None:
        continue

    row = {k: float(fv.get(k, 0.0)) for k in FEATURE_KEYS}
    row["label"] = label
    row["source_file"] = fname
    row["overall_score"] = float(data.get("overall_score", 0.0))
    rows.append(row)

print(f"Loaded {len(rows)} samples from {ANALYSIS_DIR}")

os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=FEATURE_KEYS + ["label", "source_file", "overall_score"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Saved dataset to {OUTPUT_CSV}")
