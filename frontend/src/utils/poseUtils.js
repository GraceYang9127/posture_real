import { POSE_LANDMARKS } from "@mediapipe/pose";

const requiredLandmarks = [
    'leftHip',
    'rightHip',
    'leftShoulder',
    'rightShoulder',
    'leftKnee',
    'rightKnee'
];

export function checkRequiredLandmarks(landmarks) {
  if (!landmarks) return false;

  return requiredLandmarks.every(index => {
    const lm = landmarks[index];
    return lm && lm.visibility !== undefined;
  });
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
    return torsoAngle >= 90 && torsoAngle <= 100;
}

function isBackStraight(landmarks) {
    const lHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
    const lShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
    const rHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];
    const rShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];

    if (!lHip || !lShoulder || !rHip || !rShoulder) return false;

    const lSlope = Math.abs(lShoulder.y - lHip.y);
    const rSlope = Math.abs(rShoulder.y - rHip.y);
    return lSlope < 0.5 && rSlope < 0.5;
}

export function checkBackPosture(landmarks){

    const verticalCheck = isBackStraight(landmarks);
    const angleCheck = isBackStraightByAngle(landmarks);
    return verticalCheck && angleCheck;
}



