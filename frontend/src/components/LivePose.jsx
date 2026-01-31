import React, { useRef, useEffect } from "react";
import { Pose } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import * as mpPose from "@mediapipe/pose";
import { checkBackPosture, checkRequiredLandmarks } from "../utils/poseUtils";

export default function LivePose({ onStream }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let camera;

    const pose = new Pose({
      locateFile: (file) => {
        if (!file) return undefined;

        return new URL(
          `/node_modules/@mediapipe/pose/${file}`,
          window.location.origin
        ).toString();
      },
    });


    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);

    const startCamera = async () => {
      if (!videoRef.current) return;

      camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await pose.send({ image: videoRef.current });
        },
        width: 900,
        height: 600,
      });

      await camera.start();

      /**
       * IMPORTANT:
       * Instead of exposing the raw webcam stream,
       * we expose the CANVAS stream so recordings include:
       * - camera image
       * - pose skeleton
       * - posture text
       */
      const canvas = canvasRef.current;
      if (canvas && onStream) {
        const canvasStream = canvas.captureStream(30); // 30 FPS
        onStream(canvasStream);
      }
    };

    startCamera().catch((e) =>
      console.error("Failed to start camera:", e)
    );

    return () => {
      try {
        const stream = videoRef.current?.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, [onStream]);

  function onResults(results) {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const canvasCtx = canvasElement.getContext("2d");

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the camera image onto the canvas
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    if (results.poseLandmarks) {
      drawConnectors(
        canvasCtx,
        results.poseLandmarks,
        mpPose.POSE_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 4,
        }
      );

      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });

      const hasAllLandmarks = checkRequiredLandmarks(
        results.poseLandmarks
      );

      canvasCtx.font = "24px Arial";

      if (!hasAllLandmarks) {
        canvasCtx.fillStyle = "yellow";
        canvasCtx.fillText(
          "Please have full body in picture",
          20,
          40
        );
      } else {
        const backStraight = checkBackPosture(
          results.poseLandmarks
        );

        canvasCtx.fillStyle = backStraight ? "green" : "red";
        canvasCtx.fillText(
          backStraight ? "Back straight" : "Back bent",
          20,
          40
        );
      }
    }

    canvasCtx.restore();
  }

  return (
    <div>
      {/* Hidden video is ONLY used as MediaPipe input */}
      <video ref={videoRef} style={{ display: "none" }} playsInline />

      {/* Canvas is the final visual output AND what gets recorded */}
      <canvas ref={canvasRef} width={900} height={600} />
    </div>
  );
}
