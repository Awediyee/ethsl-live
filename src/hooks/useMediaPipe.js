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
    const videoLoopFrameIdRef = useRef(null);
    const isVideoModeRef = useRef(false);
    const isVideoPlayingRef = useRef(false);

    const pipelineRef = useRef({
        isProcessingFrame: false,
        awaitingServer: false,
        awaitingServerDeadlineMs: 0,
        awaitingServerTimeoutMs: 250,
        maxSendFps: 15,
        lastSendMs: 0,
        lastResults: null,
    });

    const uiStateRef = useRef({
        lastStatusText: '',
        lastPredictionAtMs: 0,
    });

    // Initialize letterbox canvas
    useEffect(() => {
        const letterboxCanvas = document.createElement('canvas');
        letterboxCanvas.width = VIDEO_SIZE;
        letterboxCanvas.height = VIDEO_SIZE;
        letterboxCanvasRef.current = letterboxCanvas;
        letterboxCtxRef.current = letterboxCanvas.getContext('2d');
    }, []);

    const setStatus = useCallback((text) => {
        if (text === uiStateRef.current.lastStatusText) return;
        uiStateRef.current.lastStatusText = text;
        if (onStatusUpdate) {
            onStatusUpdate({ statusText: text });
        }
    }, [onStatusUpdate]);

    const updateFps = useCallback(() => {
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
    }, [onStatusUpdate]);

    const toNumber = (value, defaultValue = 0.0) => {
        const num = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    };

    const createZeroArray = useCallback((rows, cols) => {
        const arr = [];
        for (let i = 0; i < rows; i++) {
            arr.push(new Array(cols).fill(0.0));
        }
        return arr;
    }, []);

    const buildPayload = useCallback((results) => {
        let pose_4d = createZeroArray(15, 4);
        let face_3d = createZeroArray(25, 3);
        let lh_3d = createZeroArray(21, 3);
        let rh_3d = createZeroArray(21, 3);

        if (results.poseLandmarks && Array.isArray(results.poseLandmarks)) {
            const fullPose = results.poseLandmarks;
            for (let i = 0; i < SELECTED_POSE.length; i++) {
                const idx = SELECTED_POSE[i];
                if (fullPose[idx]) {
                    pose_4d[i] = [
                        toNumber(fullPose[idx].x),
                        toNumber(fullPose[idx].y),
                        toNumber(fullPose[idx].z),
                        toNumber(fullPose[idx].visibility, 0.0)
                    ];
                }
            }
        }

        if (results.faceLandmarks && Array.isArray(results.faceLandmarks)) {
            const fullFace = results.faceLandmarks;
            for (let i = 0; i < SELECTED_FACE.length; i++) {
                const idx = SELECTED_FACE[i];
                if (fullFace[idx]) {
                    face_3d[i] = [
                        toNumber(fullFace[idx].x),
                        toNumber(fullFace[idx].y),
                        toNumber(fullFace[idx].z)
                    ];
                }
            }
        }

        if (results.leftHandLandmarks && Array.isArray(results.leftHandLandmarks)) {
            for (let i = 0; i < results.leftHandLandmarks.length; i++) {
                const lm = results.leftHandLandmarks[i];
                if (lm) lh_3d[i] = [toNumber(lm.x), toNumber(lm.y), toNumber(lm.z)];
            }
        }

        if (results.rightHandLandmarks && Array.isArray(results.rightHandLandmarks)) {
            for (let i = 0; i < results.rightHandLandmarks.length; i++) {
                const lm = results.rightHandLandmarks[i];
                if (lm) rh_3d[i] = [toNumber(lm.x), toNumber(lm.y), toNumber(lm.z)];
            }
        }

        if (!results.poseLandmarks) return null;

        return {
            pose_4d: pose_4d,
            face_3d: face_3d,
            lh_3d: lh_3d,
            rh_3d: rh_3d
        };
    }, [createZeroArray]);

    const onResults = useCallback((results) => {
        if (!canvasRef.current) return;

        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

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

        pipelineRef.current.lastResults = results;

        const now = performance.now();
        if (sendWebSocketData) {
            // Handl backpressure and throttling
            if (pipelineRef.current.awaitingServer) {
                if (pipelineRef.current.awaitingServerDeadlineMs && now > pipelineRef.current.awaitingServerDeadlineMs) {
                    pipelineRef.current.awaitingServer = false;
                    pipelineRef.current.awaitingServerDeadlineMs = 0;
                } else {
                    if (now - uiStateRef.current.lastPredictionAtMs > 500) {
                        setStatus('Waiting for server...');
                    }
                    return;
                }
            }

            const minIntervalMs = pipelineRef.current.maxSendFps ? (1000 / pipelineRef.current.maxSendFps) : 0;
            if (minIntervalMs > 0 && (now - pipelineRef.current.lastSendMs) < minIntervalMs) {
                return;
            }

            const payload = buildPayload(results);
            if (payload) {
                try {
                    sendWebSocketData(payload);
                    pipelineRef.current.lastSendMs = now;
                    pipelineRef.current.awaitingServer = true;
                    pipelineRef.current.awaitingServerDeadlineMs = now + pipelineRef.current.awaitingServerTimeoutMs;
                } catch (err) {
                    console.error('WebSocket send failed:', err);
                    setStatus('Send failed: ' + (err?.message || String(err)));
                }
            } else if (now - uiStateRef.current.lastPredictionAtMs > 500) {
                setStatus('No pose detected (not sending)');
            }
        }
    }, [canvasRef, buildPayload, setStatus, sendWebSocketData]);

    const processFrame = useCallback(async () => {
        if (pipelineRef.current.isProcessingFrame) return;
        pipelineRef.current.isProcessingFrame = true;

        if (!holisticRef.current) {
            pipelineRef.current.isProcessingFrame = false;
            return;
        }

        const video = videoRef.current;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            pipelineRef.current.isProcessingFrame = false;
            return;
        }

        const iw = video.videoWidth;
        const ih = video.videoHeight;
        const w = VIDEO_SIZE;
        const h = VIDEO_SIZE;
        const scale = Math.min(w / iw, h / ih);
        const nw = Math.floor(iw * scale);
        const nh = Math.floor(ih * scale);
        const dx = Math.floor((w - nw) / 2);
        const dy = Math.floor((h - nh) / 2);

        letterboxCtxRef.current.fillStyle = '#808080';
        letterboxCtxRef.current.fillRect(0, 0, w, h);
        letterboxCtxRef.current.drawImage(video, 0, 0, iw, ih, dx, dy, nw, nh);

        try {
            await holisticRef.current.send({ image: letterboxCanvasRef.current });
            updateFps();
        } catch (err) {
            console.error('MediaPipe holistic.send failed:', err);
            setStatus('MediaPipe error: ' + (err?.message || String(err)));
        } finally {
            pipelineRef.current.isProcessingFrame = false;
        }
    }, [videoRef, updateFps, setStatus]);

    const initHolistic = useCallback(async () => {
        if (holisticRef.current) return true;
        if (!window.Holistic) {
            console.error('MediaPipe Holistic not loaded');
            return false;
        }

        try {
            const holistic = new window.Holistic({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
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
            return true;
        } catch (err) {
            console.error('Error initializing MediaPipe:', err);
            return false;
        }
    }, [onResults]);

    const startCamera = useCallback(async () => {
        await initHolistic();
        isVideoModeRef.current = false;
        if (cameraRef.current) await cameraRef.current.stop();

        if (videoRef.current) {
            const camera = new window.Camera(videoRef.current, {
                onFrame: processFrame,
                width: 640,
                height: 480
            });
            cameraRef.current = camera;
            await camera.start();
            setStatus('Camera running');
        }
    }, [initHolistic, processFrame, videoRef, setStatus]);

    const videoLoop = useCallback(() => {
        if (!isVideoModeRef.current || !isVideoPlayingRef.current) return;

        processFrame().finally(() => {
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended && isVideoModeRef.current && isVideoPlayingRef.current) {
                if ('requestVideoFrameCallback' in videoRef.current) {
                    videoRef.current.requestVideoFrameCallback(videoLoop);
                } else {
                    videoLoopFrameIdRef.current = requestAnimationFrame(videoLoop);
                }
            }
        });
    }, [processFrame, videoRef]);

    const startVideoFile = useCallback(async (file) => {
        if (!file) return;
        await initHolistic();
        isVideoModeRef.current = true;
        isVideoPlayingRef.current = false;

        if (cameraRef.current) {
            await cameraRef.current.stop();
            cameraRef.current = null;
        }

        if (videoLoopFrameIdRef.current) {
            cancelAnimationFrame(videoLoopFrameIdRef.current);
            videoLoopFrameIdRef.current = null;
        }

        if (videoRef.current) {
            if (videoRef.current.src && videoRef.current.src.startsWith('blob:')) {
                URL.revokeObjectURL(videoRef.current.src);
            }
            videoRef.current.src = URL.createObjectURL(file);
            videoRef.current.load();
            setStatus('Video loaded');
        }
    }, [initHolistic, videoRef, setStatus]);

    const playVideo = useCallback(() => {
        if (!isVideoModeRef.current || !videoRef.current) return;
        videoRef.current.play().then(() => {
            isVideoPlayingRef.current = true;
            setStatus('Video playing');
            if ('requestVideoFrameCallback' in videoRef.current) {
                videoRef.current.requestVideoFrameCallback(videoLoop);
            } else {
                videoLoopFrameIdRef.current = requestAnimationFrame(videoLoop);
            }
        });
    }, [videoLoop, videoRef, setStatus]);

    const pauseVideo = useCallback(() => {
        if (!isVideoModeRef.current || !videoRef.current) return;
        videoRef.current.pause();
        isVideoPlayingRef.current = false;
        setStatus('Video paused');
    }, [videoRef, setStatus]);

    const stopVideo = useCallback(() => {
        if (!isVideoModeRef.current || !videoRef.current) return;
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        isVideoPlayingRef.current = false;
        setStatus('Video stopped');
    }, [videoRef, setStatus]);

    const restartVideo = useCallback(() => {
        if (!isVideoModeRef.current || !videoRef.current) return;
        videoRef.current.currentTime = 0;
        playVideo();
    }, [playVideo, videoRef]);

    const cleanup = useCallback(() => {
        if (cameraRef.current) {
            cameraRef.current.stop();
            cameraRef.current = null;
        }
        if (holisticRef.current) {
            holisticRef.current.close();
            holisticRef.current = null;
        }
        if (videoLoopFrameIdRef.current) {
            cancelAnimationFrame(videoLoopFrameIdRef.current);
            videoLoopFrameIdRef.current = null;
        }
    }, []);

    const releaseBackpressure = useCallback(() => {
        pipelineRef.current.awaitingServer = false;
        pipelineRef.current.awaitingServerDeadlineMs = 0;
        uiStateRef.current.lastPredictionAtMs = performance.now();
    }, []);

    return {
        initializeMediaPipe: initHolistic,
        startCamera,
        startVideoFile,
        playVideo,
        pauseVideo,
        stopVideo,
        restartVideo,
        cleanup,
        releaseBackpressure
    };
};
