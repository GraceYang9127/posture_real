import React, { useRef, useEffect } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import * as mpPose from "@mediapipe/pose";
import { checkRequiredLandmarks } from "../utils/poseUtils";

/**
 * Tunable parameters to control responsiveness vs stability of posture
 * Chosen empirically to balance noise and latency
 */
const SMOOTHING_WINDOW = 3;        // Rolling average window (~0.5s)
const GOOD_TORSO_DEVIATION = 6;    // degrees from baseline
const STATE_THRESHOLD = 1;          // Strength for posture state (good/bad)

// Landmark indices for torso angle calculation
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;


export default function LivePose({ onStream }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Buffers for smoothing torso angle (noise reduction)
  const torsoBuffer = useRef([]);
  // Baseline posture captured once the user is stable
  const baselineTorso = useRef(null);

  // Posture state memory (prevents flickering)
  const postureScore = useRef(0);
  const postureState = useRef("bad");

  useEffect(() => {
    let camera = null;
    let pose = null;

    /**
     * Initialize Mediapipe Pose
     * Kept local to this component to isolate real-time logic
     */
    pose = new Pose({
      locateFile: (file) =>
        new URL(
          `/node_modules/@mediapipe/pose/${file}`,
          window.location.origin
        ).toString(),
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    // Async callback - called once per processed frame
    pose.onResults(onResults);

    /**
     * Camera setup
     * Raw video stream is used as a data source, all rendering happens on the canvas
     */
    const startCamera = async () => {
      if (!videoRef.current) return;

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          // Guard against unitialized video frames
          if (
            !videoRef.current ||
            videoRef.current.videoWidth === 0 ||
            videoRef.current.videoHeight === 0
          ) {
            return;
          }
          // Send current frame into pose pipeline
          await pose.send({ image: videoRef.current });
        },
      });

      await camera.start();

      // Expose canvas stream (used elsewhere)
      if (canvasRef.current && onStream) {
        onStream(canvasRef.current.captureStream(30));
      }
    };

    startCamera().catch(console.error);

    /**
     * Cleanup
     * Ensures camera, pose model, media tracks are released when component unmounts
     */
    return () => {
      camera?.stop();
      pose?.close();
      const stream = videoRef.current?.srcObject;
      stream?.getTracks?.().forEach((t) => t.stop());
    };
  }, [onStream]);
  /**
   * 
   * Rolling average smoother
   * Used to stabilize posture signals before classification 
   */
  function smooth(buffer, value) {
    buffer.push(value);
    if (buffer.length > SMOOTHING_WINDOW) buffer.shift();
    return buffer.reduce((a, b) => a + b, 0) / buffer.length;
  }

  /**
   * Computes the torso lean angle relative to vertical, using midpoints of shoulders and hips to reduce asymmetry noise. 
   */
  function computeTorsoAngle(landmarks) {
    if (!landmarks || landmarks.length < 25) return null;

    const ls = landmarks[LEFT_SHOULDER];
    const rs = landmarks[RIGHT_SHOULDER];
    const lh = landmarks[LEFT_HIP];
    const rh = landmarks[RIGHT_HIP];

    if (!ls || !rs || !lh || !rh) return null;

    const shoulderMid = {
      x: (ls.x + rs.x) / 2,
      y: (ls.y + rs.y) / 2,
    };

    const hipMid = {
      x: (lh.x + rh.x) / 2,
      y: (lh.y + rh.y) / 2,
    };

    const dx = shoulderMid.x - hipMid.x;
    const dy = hipMid.y - shoulderMid.y;

    if (!isFinite(dx) || !isFinite(dy) || dy === 0) return null;

    return Math.abs((Math.atan2(dx, dy) * 180) / Math.PI);
  }

  /**
   * Main render + inference loop
   * Runs asynchronously for each processed video frame
   * Draws results and posture feedback on posture canvas, separate from raw video feed to prevent flickering
   */
  function onResults(results) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw camera image as background
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // Visualize skeleton
      drawConnectors(ctx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 4,
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });

      const valid = checkRequiredLandmarks(results.poseLandmarks);
      ctx.font = "24px Arial";
      
      // Defensive guard: partial body in frame
      if (!valid) {
        ctx.fillStyle = "yellow";
        ctx.fillText("Please have full body in view", 20, 40);
      } else {
        const rawTorso = computeTorsoAngle(results.poseLandmarks);
        if (rawTorso === null) {
          ctx.fillStyle = "yellow";
          ctx.fillText("Hold still / keep body in view", 20, 40);
          ctx.restore();
          return;
        }
        //Smoothed torso angle
        const torso = smooth(torsoBuffer.current, rawTorso);


        // Establish baseline once user is stable
        if (!baselineTorso.current && torsoBuffer.current.length === 3) {
          baselineTorso.current = torso;
        }

        let isGoodStable = false;
        let isGoodInstant = false
        if (baselineTorso.current !== null) {
          // Instantaneous signal (responsive UI)
          const deviation = Math.abs(torso - baselineTorso.current);

          const rawDeviation = Math.abs(rawTorso - baselineTorso.current);
          isGoodInstant = rawDeviation < GOOD_TORSO_DEVIATION;

          //Smoothed signal (stable classification)
          const smoothDeviation = Math.abs(torso - baselineTorso.current);
          isGoodStable = smoothDeviation < GOOD_TORSO_DEVIATION;

        }

        // Hysteresis-based state update
        //Prevents posture state from oscillating due to noise

        postureScore.current += isGoodStable ? 1 : -1;
        postureScore.current = Math.max(-3, Math.min(3, postureScore.current));

        if (postureScore.current >= STATE_THRESHOLD) postureState.current = "good";
        if (postureScore.current <= -STATE_THRESHOLD) postureState.current = "bad";
        // Render feedback based on instantaneous signal
        ctx.fillStyle = isGoodInstant ? "green" : "red";
        ctx.fillText(
          isGoodInstant ? "Good posture" : "Back bent",
          20,
          40
        );

      }
    }

    ctx.restore();
  }

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      <canvas ref={canvasRef} width={900} height={600} />
    </div>
  );
}
