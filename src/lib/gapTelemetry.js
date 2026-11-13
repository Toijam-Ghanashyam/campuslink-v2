// src/lib/gapTelemetry.js
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

export async function createProctoringLandmarker() {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 2,
    });
  } catch (err) {
    console.warn('MediaPipe initialization fallback:', err);
    return null;
  }
}

export function createAudioKeystrokeDetector(mediaStream) {
  if (!mediaStream) return null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(mediaStream);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.2;
    source.connect(analyser);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    let clickTimestamps = [];

    return {
      checkRhythmicTyping() {
        analyser.getByteFrequencyData(freqData);

        // High-frequency transient band (~2.1kHz - 6.8kHz) typical of keyboard switches
        let highFreqEnergy = 0;
        for (let i = 25; i < 80; i++) highFreqEnergy += freqData[i];
        const avgHighFreq = highFreqEnergy / 55;

        // Human voice fundamental band (~170Hz - 1kHz)
        let voiceEnergy = 0;
        for (let i = 2; i < 12; i++) voiceEnergy += freqData[i];
        const avgVoice = voiceEnergy / 10;

        const now = performance.now();
        if (avgHighFreq > 95 && avgVoice < 70) {
          if (
            clickTimestamps.length === 0 ||
            now - clickTimestamps[clickTimestamps.length - 1] > 120
          ) {
            clickTimestamps.push(now);
          }
        }

        clickTimestamps = clickTimestamps.filter((t) => now - t < 4000);
        if (clickTimestamps.length >= 4) {
          clickTimestamps = [];
          return true;
        }
        return false;
      },
      cleanup() {
        audioCtx.close().catch(() => {});
      },
    };
  } catch {
    return null;
  }
}

export function checkEyeAndHeadGaze(landmarker, videoEl) {
  if (!landmarker || !videoEl || videoEl.readyState < 2) return null;

  try {
    const result = landmarker.detectForVideo(videoEl, performance.now());
    const faces = result.faceLandmarks || [];

    if (faces.length === 0) {
      return { type: 'NO_FACE', detail: 'Candidate left camera frame' };
    }
    if (faces.length > 1) {
      return { type: 'MULTIPLE_FACES', detail: 'Multiple individuals detected in frame' };
    }

    // Head Yaw check using Nose (1) vs Left/Right cheek boundaries (234, 454)
    const lm = faces[0];
    const faceWidth = Math.abs(lm[454].x - lm[234].x) || 0.001;
    const yawRatio = (lm[1].x - lm[234].x) / faceWidth;
    if (yawRatio < 0.27 || yawRatio > 0.73) {
      return { type: 'HEAD_TURNED', detail: 'Head turned away from primary monitor' };
    }

    // Eye Blendshape check for horizontal off-screen reading
    const shapes = result.faceBlendshapes?.[0]?.categories || [];
    const getScore = (name) =>
      shapes.find((s) => s.categoryName === name)?.score || 0;

    const maxHorizontalGaze = Math.max(
      getScore('eyeLookOutLeft'),
      getScore('eyeLookInLeft'),
      getScore('eyeLookOutRight'),
      getScore('eyeLookInRight')
    );

    if (maxHorizontalGaze > 0.58) {
      return {
        type: 'OFF_SCREEN_GAZE',
        detail: `Off-screen horizontal eye gaze (${Math.round(maxHorizontalGaze * 100)}%)`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

