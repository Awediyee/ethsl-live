import { useRef, useCallback, useEffect } from 'react';

// Configuration Constants
const SELECTED_POSE = [0, 2, 5, 7, 8, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22];
const SELECTED_FACE = [
    1, 78, 191, 80, 13, 310, 415, 308, 324, 318, 14, 88, 95,
    107, 69, 105, 52, 159, 145, 336, 299, 334, 282, 386, 374
];
const VIDEO_SIZE = 480;

export const useMediaPipe = (videoRef, canvasRef, onTranslationUpdate, onStatusUpdate, sendWebSocketData) => {
    const holisticRef = useRef(null);
    const cameraRef = useRef(null);
    const letterboxCanvasRef = useRef(null);
    const letterboxCtxRef = useRef(null);
    const frameCountRef = useRef(0);
    const lastFpsTimeRef = useRef(0);
    const isProcessingRef = useRef(false);

    // Initialize letterbox canvas
    useEffect(() => {
        const letterboxCanvas = document.createElement('canvas');
        letterboxCanvas.width = VIDEO_SIZE;
        letterboxCanvas.height = VIDEO_SIZE;
        letterboxCanvasRef.current = letterboxCanvas;
        letterboxCtxRef.current = letterboxCanvas.getContext('2d');
    }, []);

    // Create zero array helper
    const createZeroArray = useCallback((rows, cols) => {
        const arr = [];
        for (let i = 0; i < rows; i++) {
            arr.push(new Array(cols).fill(0.0));
        }
        return arr;
    }, []);

    // Build payload from MediaPipe results
    const buildPayload = useCallback((results) => {
        let pose_4d = createZeroArray(15, 4);
        let face_3d = createZeroArray(25, 3);
        let lh_3d = createZeroArray(21, 3);
        let rh_3d = createZeroArray(21, 3);

        // Fill Pose
        if (results.poseLandmarks) {
            const fullPose = results.poseLandmarks;
            for (let i = 0; i < SELECTED_POSE.length; i++) {
                const idx = SELECTED_POSE[i];
                if (fullPose[idx]) {
                    pose_4d[i] = [
                        fullPose[idx].x,
                        fullPose[idx].y,
                        fullPose[idx].z,
                        fullPose[idx].visibility !== undefined ? fullPose[idx].visibility : 0.0
                    ];
                }
            }
        }

        // Fill Face
        if (results.faceLandmarks) {
            const fullFace = results.faceLandmarks;
            for (let i = 0; i < SELECTED_FACE.length; i++) {
                const idx = SELECTED_FACE[i];
                if (fullFace[idx]) {
                    face_3d[i] = [
                        fullFace[idx].x,
                        fullFace[idx].y,
                        fullFace[idx].z
                    ];
                }
            }
        }

        // Fill Left Hand
        if (results.leftHandLandmarks) {
            for (let i = 0; i < results.leftHandLandmarks.length; i++) {
                const lm = results.leftHandLandmarks[i];
                lh_3d[i] = [lm.x, lm.y, lm.z];
            }
        }

        // Fill Right Hand
        if (results.rightHandLandmarks) {
            for (let i = 0; i < results.rightHandLandmarks.length; i++) {
                const lm = results.rightHandLandmarks[i];
                rh_3d[i] = [lm.x, lm.y, lm.z];
            }
        }

        // Check if pose is detected
        if (!results.poseLandmarks) {
            return null;
        }

        return {
            pose_4d: pose_4d,
            face_3d: face_3d,
            lh_3d: lh_3d,
            rh_3d: rh_3d
        };
    }, [createZeroArray]);

    // Handle MediaPipe results
    const onResults = useCallback((results) => {
        if (!canvasRef.current) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw landmarks using MediaPipe drawing utils (if available)
        if (window.drawConnectors && window.drawLandmarks) {
            if (results.poseLandmarks) {
                window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
                window.drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 1 });
            }
            if (results.faceLandmarks) {
                window.drawConnectors(canvasCtx, results.faceLandmarks, window.FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            }
            if (results.leftHandLandmarks) {
                window.drawConnectors(canvasCtx, results.leftHandLandmarks, window.HAND_CONNECTIONS, { color: '#CC0000', lineWidth: 2 });
            }
            if (results.rightHandLandmarks) {
                window.drawConnectors(canvasCtx, results.rightHandLandmarks, window.HAND_CONNECTIONS, { color: '#00CC00', lineWidth: 2 });
            }
        }
        canvasCtx.restore();

        // Send to WebSocket if provided
        if (sendWebSocketData) {
            const payload = buildPayload(results);
            if (payload) {
                sendWebSocketData(payload);
            }
        }

        // Update FPS
        frameCountRef.current++;
        const now = performance.now();
        if (now - lastFpsTimeRef.current >= 1000) {
            const fps = frameCountRef.current;
            frameCountRef.current = 0;
            lastFpsTimeRef.current = now;
            if (onStatusUpdate) {
                onStatusUpdate({ fps });
            }
        }
    }, [canvasRef, buildPayload, onStatusUpdate]);

    // Initialize MediaPipe
    const initializeMediaPipe = useCallback(async () => {
        if (!window.Holistic || !window.Camera) {
            console.error('MediaPipe libraries not loaded');
            return false;
        }

        try {
            // Initialize Holistic
            const holistic = new window.Holistic({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
                }
            });

            holistic.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                refineFaceLandmarks: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            holistic.onResults(onResults);
            holisticRef.current = holistic;

            // Initialize Camera
            if (videoRef.current) {
                const camera = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        if (!isProcessingRef.current || !videoRef.current || !letterboxCanvasRef.current) return;

                        const iw = videoRef.current.videoWidth;
                        const ih = videoRef.current.videoHeight;

                        if (iw === 0 || ih === 0) return;

                        const w = VIDEO_SIZE;
                        const h = VIDEO_SIZE;
                        const scale = Math.min(w / iw, h / ih);
                        const nw = Math.floor(iw * scale);
                        const nh = Math.floor(ih * scale);
                        const dx = Math.floor((w - nw) / 2);
                        const dy = Math.floor((h - nh) / 2);

                        // Fill with gray 128
                        letterboxCtxRef.current.fillStyle = '#808080';
                        letterboxCtxRef.current.fillRect(0, 0, w, h);

                        // Draw resized video
                        letterboxCtxRef.current.drawImage(videoRef.current, 0, 0, iw, ih, dx, dy, nw, nh);

                        // Send to MediaPipe
                        await holistic.send({ image: letterboxCanvasRef.current });
                    },
                    width: 640,
                    height: 480
                });

                cameraRef.current = camera;
                await camera.start();
            }

            return true;
        } catch (error) {
            console.error('Error initializing MediaPipe:', error);
            return false;
        }
    }, [videoRef, onResults]);

    // Start processing
    const startProcessing = useCallback(() => {
        isProcessingRef.current = true;
    }, []);

    // Stop processing
    const stopProcessing = useCallback(() => {
        isProcessingRef.current = false;
    }, []);



    // Process uploaded video file
    const processVideoFile = useCallback(async (videoElement, onProgress) => {
        if (!holisticRef.current) {
            console.error('MediaPipe not initialized');
            return false;
        }

        return new Promise((resolve) => {
            let frameCount = 0;
            const processFrame = async () => {
                if (!videoElement || videoElement.paused || videoElement.ended) {
                    resolve(true);
                    return;
                }

                const iw = videoElement.videoWidth;
                const ih = videoElement.videoHeight;

                if (iw === 0 || ih === 0) {
                    requestAnimationFrame(processFrame);
                    return;
                }

                // Create letterbox canvas for this frame
                const w = VIDEO_SIZE;
                const h = VIDEO_SIZE;
                const scale = Math.min(w / iw, h / ih);
                const nw = Math.floor(iw * scale);
                const nh = Math.floor(ih * scale);
                const dx = Math.floor((w - nw) / 2);
                const dy = Math.floor((h - nh) / 2);

                // Fill with gray 128
                letterboxCtxRef.current.fillStyle = '#808080';
                letterboxCtxRef.current.fillRect(0, 0, w, h);

                // Draw resized video frame
                letterboxCtxRef.current.drawImage(videoElement, 0, 0, iw, ih, dx, dy, nw, nh);

                // Send to MediaPipe
                await holisticRef.current.send({ image: letterboxCanvasRef.current });

                frameCount++;
                if (onProgress && frameCount % 10 === 0) {
                    const progress = (videoElement.currentTime / videoElement.duration) * 100;
                    onProgress(progress);
                }

                // Process next frame
                requestAnimationFrame(processFrame);
            };

            videoElement.play().then(() => {
                processFrame();
            }).catch(err => {
                console.error('Error playing video:', err);
                resolve(false);
            });
        });
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        stopProcessing();
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        if (holisticRef.current) {
            holisticRef.current.close();
            holisticRef.current = null;
        }
    }, [stopProcessing]);

    return {
        initializeMediaPipe,
        startProcessing,
        stopProcessing,
        processVideoFile,
        cleanup
    };
};
