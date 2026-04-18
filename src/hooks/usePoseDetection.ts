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
    elbowRaised: false,
    shouldFlap: false,
    restartTrigger: 0,
  });

  const wasRaisedRef = useRef(false);
  const wasSingleElbowRef = useRef(false);

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
        minPoseDetectionConfidence: 0.15, // Düşürüldü (0.25 → 0.15)
        minTrackingConfidence: 0.15, // Düşürüldü (0.25 → 0.15)
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
      console.log('Starting webcam...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }, // Düşük çözünürlük = daha hızlı
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load metadata before playing
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Video metadata loaded, video ready');
          videoRef.current?.play().catch(err => {
            console.error('Play error:', err);
            setError('Failed to play video stream');
          });
        };

        // Timeout fallback in case metadata doesn't load
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState === 0) {
            console.warn('⚠️ Video metadata not loaded after 3s, attempting play anyway...');
            videoRef.current.play().catch(err => {
              console.error('Play error:', err);
              setError('Failed to play video stream');
            });
          }
        }, 3000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to access webcam';
      setError(errorMsg);
      console.error('❌ Webcam error:', errorMsg);
    }
  }, []);

  const detectPose = useCallback(() => {
    if (!videoRef.current || !landmarkerRef.current) return;

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    try {
      const results = landmarkerRef.current.detectForVideo(video, performance.now());

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftElbow = landmarks[13];
        const rightElbow = landmarks[14];

        // Check if elbows are raised above shoulders
        // y: 0 = top, 1 = bottom. Elbow above shoulder = smaller y value
        // Threshold: elbow.y < shoulder.y - 0.05 means elbow is about 5% above shoulder
        const leftElbowRaised = leftElbow.y < leftShoulder.y - 0.05;
        const rightElbowRaised = rightElbow.y < rightShoulder.y - 0.05;

        console.log(`L elbow:${leftElbowRaised?'↑':'.'} diff:${(leftElbow.y-leftShoulder.y).toFixed(3)} R elbow:${rightElbowRaised?'↑':'.'} diff:${(rightElbow.y-rightShoulder.y).toFixed(3)}`);

        // Both elbows raised = flap
        const bothRaised = leftElbowRaised && rightElbowRaised;
        const shouldFlap = bothRaised && !wasRaisedRef.current;
        
        // Single elbow raised = restart
        const singleElbowRaised = (leftElbowRaised && !rightElbowRaised) || (rightElbowRaised && !leftElbowRaised);
        const restartTrigger = singleElbowRaised && !wasSingleElbowRef.current ? 1 : 0;
        wasSingleElbowRef.current = singleElbowRaised;
        
        wasRaisedRef.current = bothRaised;

        setPoseResult({
          elbowRaised: bothRaised,
          shouldFlap,
          restartTrigger,
          landmarks,
        });
      } else {
        setPoseResult({
          elbowRaised: false,
          shouldFlap: false,
          restartTrigger: 0,
        });
      }
    } catch (err) {
      console.error('Pose detection error:', err);
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