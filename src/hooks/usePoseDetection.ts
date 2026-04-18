import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FilesetResolver,
  PoseLandmarker,
} from '@mediapipe/tasks-vision';
import type { PoseResult } from '../game/types';

export function usePoseDetection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseResult>({
    leftRaised: false,
    rightRaised: false,
    shouldFlap: false,
    restartTrigger: 0,
  });

  const wasRaisedRef = useRef(false);
  const wasSingleRaisedRef = useRef(false);

  const initPoseDetector = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.25,
        minTrackingConfidence: 0.25,
        outputSegmentationMasks: false,
      });

      landmarkerRef.current = landmarker;
      setIsReady(true);
      console.log('✅ Pose detector initialized');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize pose detection');
      console.error('Pose detection init error:', err);
    }
  }, []);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access webcam');
      console.error('Webcam error:', err);
    }
  }, []);

  const detectPose = useCallback(() => {
    if (!videoRef.current || !landmarkerRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const results = landmarkerRef.current.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      const leftWrist = landmarks[15];
      const rightWrist = landmarks[16];

      // y: 0 = yukarı, 1 = aşağı. Bilek omuzdan yukarıda = daha küçük y
      const leftRaised = leftWrist.y < leftShoulder.y + 0.08;
      const rightRaised = rightWrist.y < rightShoulder.y + 0.08;

      console.log(`L:${leftRaised?'↑':'.'} diff:${(leftWrist.y-leftShoulder.y).toFixed(3)} R:${rightRaised?'↑':'.'} diff:${(rightWrist.y-rightShoulder.y).toFixed(3)}`);

      const raiseNow = leftRaised || rightRaised;
      const shouldFlap = raiseNow && !wasRaisedRef.current;
      
      const singleRaised = (leftRaised && !rightRaised) || (rightRaised && !leftRaised);
      const restartTrigger = singleRaised && !wasSingleRaisedRef.current ? 1 : 0;
      wasSingleRaisedRef.current = singleRaised;
      
      wasRaisedRef.current = raiseNow;

      setPoseResult({
        leftRaised,
        rightRaised,
        shouldFlap,
        restartTrigger,
        landmarks,
      });
    } else {
      setPoseResult({
        leftRaised: false,
        rightRaised: false,
        shouldFlap: false,
        restartTrigger: 0,
      });
    }

    animationRef.current = requestAnimationFrame(detectPose);
  }, []);

  useEffect(() => {
    initPoseDetector().then(() => {
      startWebcam().then(() => {
        animationRef.current = requestAnimationFrame(detectPose);
      });
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      landmarkerRef.current?.close();
    };
  }, [initPoseDetector, startWebcam, detectPose]);

  return {
    videoRef,
    isReady,
    error,
    poseResult,
  };
}