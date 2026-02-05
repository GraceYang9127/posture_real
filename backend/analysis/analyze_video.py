import sys
import os
import json
import hashlib
from datetime import datetime

import cv2
import mediapipe as mp
import numpy as np


# -------------------------
# Configuration
# -------------------------

POSE_CONFIDENCE = 0.5
FRAME_SAMPLE_RATE = 2 #analyze every 2nd frame


# -------------------------
# Utility functions
# -------------------------

def compute_angle(p1, p2):
    """
    Angle between vertical axis and vector p1 -> p2
    """
    dx = p1[0] - p2[0]
    dy = p1[1] - p2[1]
    angle = np.degrees(np.arctan2(dx, dy))
    return abs(angle)


def video_id_from_path(video_path):
    return hashlib.md5(video_path.encode()).hexdigest()


# -------------------------
# Main analysis
# -------------------------

def main():
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

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=POSE_CONFIDENCE,
        min_tracking_confidence=POSE_CONFIDENCE,
    )

    head_angles = []
    torso_angles = []
    frames_with_pose = 0
    total_frames = 0

    frame_index = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        total_frames += 1
        frame_index += 1

        if frame_index % FRAME_SAMPLE_RATE != 0:
            continue

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = pose.process(rgb)

        if not result.pose_landmarks:
            continue

        frames_with_pose += 1
        lm = result.pose_landmarks.landmark

        # mp landmarks
        left_ear = lm[mp_pose.PoseLandmark.LEFT_EAR]
        left_shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = lm[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        left_hip = lm[mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = lm[mp_pose.PoseLandmark.RIGHT_HIP]

        # Head forward angle
        head_angle = compute_angle(
            (left_ear.x, left_ear.y),
            (left_shoulder.x, left_shoulder.y),
        )
        head_angles.append(head_angle)

        # Torso lean angle
        shoulder_mid = (
            (left_shoulder.x + right_shoulder.x) / 2,
            (left_shoulder.y + right_shoulder.y) / 2,
        )
        hip_mid = (
            (left_hip.x + right_hip.x) / 2,
            (left_hip.y + right_hip.y) / 2,
        )
        torso_angle = compute_angle(shoulder_mid, hip_mid)
        torso_angles.append(torso_angle)

    cap.release()
    pose.close()

    # -------------------------
    # Aggregate metrics
    # -------------------------

    pose_coverage = frames_with_pose / max(total_frames, 1)

    head_forward_mean = float(np.mean(head_angles)) if head_angles else 0.0
    head_forward_var = float(np.var(head_angles)) if head_angles else 0.0
    torso_lean_mean = float(np.mean(torso_angles)) if torso_angles else 0.0

    # Normalize the "penalties" per metric
    head_penalty = min(head_forward_mean / 40.0, 1.0)
    torso_penalty = min(torso_lean_mean / 30.0, 1.0)
    stability_penalty = min(head_forward_var / 100.0, 1.0)

    overall_score = int(
        100 * (1 - (0.45 * head_penalty + 0.35 * torso_penalty + 0.20 * stability_penalty))
    )

    overall_score = max(0, min(100, overall_score))

    # -------------------------
    # Final output
    # -------------------------

    analysis_result = {
        "video_id": video_id_from_path(video_path),
        "instrument": instrument,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "overall_score": overall_score,
        "metrics": {
            "head_forward_mean_deg": round(head_forward_mean, 2),
            "torso_lean_mean_deg": round(torso_lean_mean, 2),
            "head_stability_variance": round(head_forward_var, 3),
            "pose_coverage": round(pose_coverage, 3),
        },
        "feedback": [
            "Forward head posture detected intermittently during the performance.",
            "Torso alignment varies slightly over time.",
            "Improved posture consistency may reduce strain."
        ],
        "metadata": {
            "analysis_version": "mediapipe-heuristic-v1",
            "frame_sample_rate": FRAME_SAMPLE_RATE,
            "total_frames": total_frames,
        }
    }

    with open(output_path, "w") as f:
        json.dump(analysis_result, f, indent=2)

    print("Analysis complete")


if __name__ == "__main__":
    main()
