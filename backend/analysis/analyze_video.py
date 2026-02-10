import sys
import os
import json
import hashlib
from datetime import datetime

import cv2
import mediapipe as mp
import numpy as np


# ============================================================
# Configuration
# ============================================================

# Minimum confidence required for MediaPipe pose landmarks
# Lower values increase coverage but risk noisy detections
POSE_CONFIDENCE = 0.35

#To reduce compute cost and smooth noise, we analyze every 2nd frame instead of every frame
FRAME_SAMPLE_RATE = 2 

# Calibrated biomechanical ideals (empirically derived for piano)
# Acts as reference points, not hard rules
IDEAL_HEAD_ANGLE = 163.0
IDEAL_TORSO_ANGLE = 179.0


# ============================================================
# Utility functions
# ============================================================

def compute_angle_vertical(p1, p2) -> float:
    """
    Computes angle between vertical axis and vector p1 -> p2

    Used instead of raw slope, so the metric: 
    - Is orientation-independent
    - Works consistently across camera positions
    - Produces interpretable degrees in [0, 180]
    """
    dx = float(p1[0] - p2[0])
    dy = float(p1[1] - p2[1])

    angle = float(np.degrees(np.arctan2(dx, dy)))
    angle = abs(angle)

    if angle > 180.0:
        angle = 360.0 - angle

    return angle


def angle_deviation(angle: float, ideal: float) -> float:
    """Measures how far a posture angle deviates from a calibrated 'ideal' reference"""
    return abs(float(angle) - float(ideal))


def clamp01(x: float) -> float:
    """
    Clamps values into [0, 1] so penalties
    remain bounded and composable.
    """
    return max(0.0, min(1.0, float(x)))


def safe_div(a: float, b: float, default: float = 0.0) -> float:
    """
    Safe division helper used for coverage and duration
    to avoid runtime errors on edge cases
    """
    return float(a) / float(b) if b != 0 else float(default)


def video_id_from_path(video_path: str) -> str:
    """
    Generates a stable, deterministic ID for a video
    based on its file path
    """
    return hashlib.md5(video_path.encode()).hexdigest()


# ============================================================
# Main analysis
# ============================================================

def main():
    # Usage:
    # python analyze_video.py <video_path> <instrument> <output_json_path>

    if len(sys.argv) != 4:
        print("Invalid arguments", file=sys.stderr)
        sys.exit(1)

    video_path = sys.argv[1]
    instrument = sys.argv[2]
    output_path = sys.argv[3]

    if not os.path.exists(video_path):
        print("Video file not found", file=sys.stderr)
        sys.exit(1)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Failed to open video", file=sys.stderr)
        sys.exit(1)

    fps = cap.get(cv2.CAP_PROP_FPS) or 0.0

    # Counters
    total_frames = 0
    sampled_frames = 0
    frames_with_pose = 0

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=POSE_CONFIDENCE,
        min_tracking_confidence=POSE_CONFIDENCE,
    )

    # Per-frame measurements
    head_angles = []
    torso_angles = []

    frame_index = 0

    # ------------------------------------------------------------
    # Frame loop
    # ------------------------------------------------------------
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        total_frames += 1
        frame_index += 1
        # Skip frames based on sampling rate to reduce noise and computational load
        if frame_index % FRAME_SAMPLE_RATE != 0:
            continue

        sampled_frames += 1
        #Convert frame to RGB and run pose estimation
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = pose.process(rgb)
        #Only process frames where a valid pose was detected
        if not result.pose_landmarks:
            continue

        frames_with_pose += 1
        lm = result.pose_landmarks.landmark

        #Extract the landmarks we care about (ears, shoulders, hips)
        left_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
        left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = lm[mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = lm[mp_pose.PoseLandmark.RIGHT_HIP]

        # Head posture metric: 
        # Angle between ear -> shoulder relative to vertical
        head_angle = compute_angle_vertical(
            (left_ear.x, left_ear.y),
            (left_shoulder.x, left_shoulder.y),
        )
        head_angles.append(head_angle)

        # Torso angle (shoulder-mid → hip-mid)
        shoulder_mid = (
            (left_shoulder.x + right_shoulder.x) / 2.0,
            (left_shoulder.y + right_shoulder.y) / 2.0,
        )
        hip_mid = (
            (left_hip.x + right_hip.x) / 2.0,
            (left_hip.y + right_hip.y) / 2.0,
        )

        #Torso posture metric: 
        #Angle between midpoint of shoulders and hips
        # relative to vertical
        torso_angle = compute_angle_vertical(shoulder_mid, hip_mid)
        torso_angles.append(torso_angle)

    cap.release()
    pose.close()

    # ------------------------------------------------------------
    # Aggregate metrics
    # ------------------------------------------------------------

    # Coverage tells us how much of the video contained a usable pose
    pose_coverage = safe_div(frames_with_pose, total_frames)
    pose_coverage_sampled = safe_div(frames_with_pose, sampled_frames)
    #Session duration inferred from frame count
    duration_sec = safe_div(total_frames, fps) if fps > 0 else 0.0

    #Mean posture angles across the session
    head_mean = float(np.mean(head_angles)) if head_angles else 0.0
    head_var = float(np.var(head_angles)) if head_angles else 0.0
    torso_mean = float(np.mean(torso_angles)) if torso_angles else 0.0

    # Deviations from calibrated ideals
    head_dev = angle_deviation(head_mean, IDEAL_HEAD_ANGLE)
    torso_dev = angle_deviation(torso_mean, IDEAL_TORSO_ANGLE)

    # Stability captures how consistent posture is over time
    # (low varience = stable posture)
    if head_angles:
        devs = [angle_deviation(a, IDEAL_HEAD_ANGLE) for a in head_angles]
        stability_std = float(np.std(devs))
    else:
        stability_std = 0.0

    # ------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------
    
    #Normalize penalties so they can be weighted together
    head_penalty = clamp01(head_dev / 25.0)
    torso_penalty = clamp01(torso_dev / 20.0)
    stability_penalty = clamp01(stability_std / 10.0)
    #Weighted quality score (domain-informed weights)
    quality = 1.0 - (
        0.40 * head_penalty +
        0.35 * torso_penalty +
        0.25 * stability_penalty
    )
    quality = clamp01(quality)
    #Reduce score if pose detection was poor
    coverage_mult = clamp01((pose_coverage_sampled - 0.30) / 0.50)
    #Final score in [0, 100]
    overall_score = int(round(
        100.0 * quality * (0.60 + 0.40 * coverage_mult)
    ))
    overall_score = max(0, min(100, overall_score))

    # ------------------------------------------------------------
    # Weak label
    # ------------------------------------------------------------

    #Heuristic bucket used for quick user feedback and baseline interpretation
    if pose_coverage_sampled < 0.25:
        weak_label = "Unknown"
    elif overall_score >= 85:
        weak_label = "Excellent"
    elif overall_score >= 70:
        weak_label = "Good"
    elif overall_score >= 55:
        weak_label = "Okay"
    else:
        weak_label = "Risky"

    # ------------------------------------------------------------
    # Feature vector (for ML)
    # ------------------------------------------------------------

    #Raw, un-normalized metrics used as ML inputs. 
    # ML interprets these signals, does not replace them
    feature_vector = {
        "head_angle_mean_deg": head_mean,
        "head_angle_var": head_var,
        "torso_angle_mean_deg": torso_mean,
        "head_dev_deg": head_dev,
        "torso_dev_deg": torso_dev,
        "stability_std_dev_deg": stability_std,
        "pose_coverage": pose_coverage,
        "pose_coverage_sampled": pose_coverage_sampled,
        "session_duration_sec": duration_sec,
        "sampled_frames": float(sampled_frames),
        "frames_with_pose": float(frames_with_pose),
    }

    # ------------------------------------------------------------
    # Final output
    # ------------------------------------------------------------

    # Primary artifact consumed by frontend, stored in S3
    analysis_result = {
        "video_id": video_id_from_path(video_path),
        "instrument": instrument,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "overall_score": overall_score,
        "weak_label": weak_label,
        "feature_vector": {
            k: round(v, 6) if isinstance(v, float) else v
            for k, v in feature_vector.items()
        },
        "metrics": {
            "head_angle_mean_deg": round(head_mean, 2),
            "torso_angle_mean_deg": round(torso_mean, 2),
            "head_dev_deg": round(head_dev, 2),
            "torso_dev_deg": round(torso_dev, 2),
            "stability_std_dev_deg": round(stability_std, 3),
            "pose_coverage": round(pose_coverage, 3),
            "pose_coverage_sampled": round(pose_coverage_sampled, 3),
        },
        "feedback": [
            "Maintain neutral head alignment to reduce neck strain.",
            "Keep torso upright with relaxed shoulders.",
            "Consistent posture improves long-term comfort and performance.",
        ],
        "metadata": {
            "analysis_version": "mediapipe-calibrated-v3",
            "pose_confidence": POSE_CONFIDENCE,
            "frame_sample_rate": FRAME_SAMPLE_RATE,
            "total_frames": total_frames,
            "fps": round(float(fps), 3),
            "duration_sec": round(float(duration_sec), 3),
            "sampled_frames": sampled_frames,
            "frames_with_pose": frames_with_pose,
            "pose_detected": frames_with_pose > 0,
        },
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(analysis_result, f, indent=2)

    print("✅ Analysis complete")
    print("Score:", overall_score)
    print("Coverage(sampled):", round(pose_coverage_sampled, 3))


if __name__ == "__main__":
    main()
