import { useRef, useCallback } from 'react';
import type { PlankMetrics } from '../game/types';
import { PLANK_ANGLE_TOLERANCE, PLANK_WARNING_INTERVAL } from '../game/constants';

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export function usePlankDetection() {
  const plankMetricsRef = useRef<PlankMetrics>({
    isStraight: true,
    angle: 0,
    confidence: 0,
    lastWarningTime: 0,
  });

  const calculateAngle = useCallback(
    (landmarks: readonly Landmark[] | undefined): PlankMetrics => {
      if (!landmarks || landmarks.length < 28) {
        return {
          isStraight: true,
          angle: 0,
          confidence: 0,
          lastWarningTime: plankMetricsRef.current.lastWarningTime,
        };
      }

      // MediaPipe landmarks indices:
      // 11 = Right Shoulder, 12 = Left Shoulder
      // 23 = Right Hip, 24 = Left Hip
      // 27 = Right Ankle, 28 = Left Ankle

      const rightShoulder = landmarks[11];
      const leftShoulder = landmarks[12];
      const rightHip = landmarks[23];
      const leftHip = landmarks[24];
      const rightAnkle = landmarks[27];
      const leftAnkle = landmarks[28];

      // Check visibility
      const minVisibility = 0.3;
      if (
        !rightShoulder?.visibility ||
        !leftShoulder?.visibility ||
        !rightHip?.visibility ||
        !leftHip?.visibility ||
        !rightAnkle?.visibility ||
        !leftAnkle?.visibility ||
        rightShoulder.visibility < minVisibility ||
        leftShoulder.visibility < minVisibility ||
        rightHip.visibility < minVisibility ||
        leftHip.visibility < minVisibility ||
        rightAnkle.visibility < minVisibility ||
        leftAnkle.visibility < minVisibility
      ) {
        return {
          isStraight: true,
          angle: 0,
          confidence: 0,
          lastWarningTime: plankMetricsRef.current.lastWarningTime,
        };
      }

      // Calculate center points
      const shoulderCenter = {
        x: (rightShoulder.x + leftShoulder.x) / 2,
        y: (rightShoulder.y + leftShoulder.y) / 2,
      };

      const hipCenter = {
        x: (rightHip.x + leftHip.x) / 2,
        y: (rightHip.y + leftHip.y) / 2,
      };

      const ankleCenter = {
        x: (rightAnkle.x + leftAnkle.x) / 2,
        y: (rightAnkle.y + leftAnkle.y) / 2,
      };

      // Vector from shoulder to hip
      const v1 = {
        x: hipCenter.x - shoulderCenter.x,
        y: hipCenter.y - shoulderCenter.y,
      };

      // Vector from hip to ankle
      const v2 = {
        x: ankleCenter.x - hipCenter.x,
        y: ankleCenter.y - hipCenter.y,
      };

      // Calculate angle between vectors using dot product
      const dotProduct = v1.x * v2.x + v1.y * v2.y;
      const magnitude1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const magnitude2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      if (magnitude1 === 0 || magnitude2 === 0) {
        return {
          isStraight: true,
          angle: 0,
          confidence: 0,
          lastWarningTime: plankMetricsRef.current.lastWarningTime,
        };
      }

      const cosAngle = dotProduct / (magnitude1 * magnitude2);
      const clampedCos = Math.max(-1, Math.min(1, cosAngle));
      const angleRad = Math.acos(clampedCos);
      const angleDeg = (angleRad * 180) / Math.PI;

      // The angle should be ~180 degrees for a straight line
      // Deviation from 180 indicates bending
      const deviation = Math.abs(180 - angleDeg);

      const confidence =
        (rightShoulder.visibility! +
          leftShoulder.visibility! +
          rightHip.visibility! +
          leftHip.visibility! +
          rightAnkle.visibility! +
          leftAnkle.visibility!) /
        6;

      const isStraight = deviation <= PLANK_ANGLE_TOLERANCE;
      const now = Date.now();

      const metrics: PlankMetrics = {
        isStraight,
        angle: deviation,
        confidence,
        lastWarningTime: plankMetricsRef.current.lastWarningTime,
      };

      // Update warning time if needed
      if (
        !isStraight &&
        now - plankMetricsRef.current.lastWarningTime > PLANK_WARNING_INTERVAL
      ) {
        metrics.lastWarningTime = now;
      }

      plankMetricsRef.current = metrics;
      return metrics;
    },
    []
  );

  return { calculateAngle, plankMetricsRef };
}
