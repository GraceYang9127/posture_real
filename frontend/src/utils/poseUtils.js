import { POSE_LANDMARKS } from "@mediapipe/pose";

/**
 * Landmark groups used to verify visibility
 * Allows either side of the body to be sufficient
 */
const leftSideLandmarks = [
  POSE_LANDMARKS.LEFT_HIP,
  POSE_LANDMARKS.LEFT_SHOULDER,
  POSE_LANDMARKS.LEFT_KNEE
];

const rightSideLandmarks = [
  POSE_LANDMARKS.RIGHT_HIP,
  POSE_LANDMARKS.RIGHT_SHOULDER,
  POSE_LANDMARKS.RIGHT_KNEE
];

/**
 * Checks whether all required landmarks on one side are visible
 * Uses MediaPipe visibility confidence to reject partial frames
 */
function isSideVisible(landmarks, sideLandmarks) {
  return sideLandmarks.every(index => {
    const lm = landmarks[index];
    return lm && lm.visibility !== undefined && lm.visibility > 0.25;
  });
}

/**
 * Validates pose completeness
 * Requires at least one full side of the body
 */
export function checkRequiredLandmarks(landmarks) {
  if (!landmarks) return false;

  const leftVisible = isSideVisible(landmarks, leftSideLandmarks);
  const rightVisible = isSideVisible(landmarks, rightSideLandmarks);

  return leftVisible || rightVisible;
}


function angleBetweenPoints(A, B, C) {
  const AB = { x: B.x - A.x, y: B.y - A.y };
  const BC = { x: C.x - B.x, y: C.y - B.y };

  const dot = AB.x * BC.x + AB.y * BC.y;
  const magAB = Math.sqrt(AB.x * AB.x + AB.y * AB.y);
  const magBC = Math.sqrt(BC.x * BC.x + BC.y * BC.y);

  const cosineAngle = dot / (magAB * magBC);
  return Math.acos(cosineAngle) * (180 / Math.PI);
}


function isBackStraightByAngle(landmarks){
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];

    if (!leftShoulder || !leftHip || !leftKnee) return false;

    const torsoAngle = angleBetweenPoints(leftShoulder, leftHip, leftKnee);
    return torsoAngle >= 160 && torsoAngle <= 185;
}

function isBackStraight(landmarks) {
    const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    if (!lHip || !lShoulder || !rHip || !rShoulder) return false;

    const lSlope = Math.abs(lShoulder.y - lHip.y);
    const rSlope = Math.abs(rShoulder.y - rHip.y);
    const dx = Math.abs(lShoulder.x - lHip.x);
    return dx < 0.05;
}

export function checkBackPosture(landmarks){

    const verticalCheck = isBackStraight(landmarks);
    const angleCheck = isBackStraightByAngle(landmarks);
    return verticalCheck && angleCheck;
}
function isHeadAligned(landmarks){
  const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

  if (!leftEar || !leftShoulder) return false;

  const earX = leftEar.x || rightEar?.x;
  const shoulderX = leftShoulder.x || rightShoulder?.x;

  if (!earX || !shoulderX) return false;

  const dx = Math.abs(earX - shoulderX);

  return dx < 0.06; // threshold for forward head
}
