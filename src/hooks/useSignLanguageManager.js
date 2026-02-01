import { useState, useEffect, useCallback } from 'react';
import { useMediaPipe } from './useMediaPipe';
import { useWebSocket } from '../contexts/WebSocketContext';

export const useSignLanguageManager = (videoRef, canvasRef, onTranslationReceived) => {
    const {
        wsUrl,
        setWsUrl,
        wsConnected,
        connectionStatus,
        connect,
        disconnect,
        send,
        registerOnMessage
    } = useWebSocket();

    // MediaPipe state
    const [mediaPipeInitialized, setMediaPipeInitialized] = useState(false);
    const [fps, setFps] = useState(0);
    const [currentPrediction, setCurrentPrediction] = useState(null);

    // Callbacks for the core MediaPipe hook
    const handleTranslationUpdate = useCallback((data) => {
        setCurrentPrediction(data);
        if (data.sequence && onTranslationReceived) {
            onTranslationReceived(data.sequence);
        }
    }, [onTranslationReceived]);

    const handleStatusUpdate = useCallback((status) => {
        if (status.fps !== undefined) {
            setFps(status.fps);
        }
        if (status.statusText !== undefined) {
            // we could potentially expose statusText to the UI
            console.log('MediaPipe Status:', status.statusText);
        }
    }, []);

    // Initialize core MediaPipe hook
    const {
        initializeMediaPipe,
        startCamera: coreStartCamera,
        startVideoFile: coreStartVideoFile,
        playVideo,
        pauseVideo,
        stopVideo: coreStopVideo,
        restartVideo,
        cleanup,
        releaseBackpressure
    } = useMediaPipe(videoRef, canvasRef, handleTranslationUpdate, handleStatusUpdate, send);

    // Handle WebSocket messages for translations
    useEffect(() => {
        const cleanup = registerOnMessage((dataString) => {
            try {
                // Signal that the server has responded to release backpressure
                releaseBackpressure();

                const data = JSON.parse(dataString);
                if (data.prediction) {
                    handleTranslationUpdate({
                        label: data.prediction.label,
                        confidence: data.prediction.confidence,
                        sequence: data.prediction.sequence
                    });
                }
            } catch (e) {
                console.error('Error parsing server response:', e);
            }
        });
        return cleanup;
    }, [registerOnMessage, handleTranslationUpdate, releaseBackpressure]);

    // Helpers
    const handleConnect = useCallback(() => {
        return connect(wsUrl);
    }, [wsUrl, connect]);

    const handleDisconnect = useCallback(() => {
        disconnect();
    }, [disconnect]);

    const ensureInitialized = useCallback(async () => {
        if (!mediaPipeInitialized) {
            const initialized = await initializeMediaPipe();
            setMediaPipeInitialized(initialized);
            return initialized;
        }
        return true;
    }, [mediaPipeInitialized, initializeMediaPipe]);

    const startCamera = useCallback(async () => {
        // Automatically connect to WebSocket when camera starts
        await connect(wsUrl);
        return coreStartCamera();
    }, [connect, wsUrl, coreStartCamera]);

    const startVideoFile = useCallback(async (file) => {
        // Automatically connect to WebSocket when video file is uploaded/started
        await connect(wsUrl);
        return coreStartVideoFile(file);
    }, [connect, wsUrl, coreStartVideoFile]);

    const stopVideo = useCallback(() => {
        // Automatically disconnect from WebSocket when video/camera stops
        coreStopVideo();
        disconnect();
    }, [coreStopVideo, disconnect]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        state: {
            wsUrl,
            setWsUrl,
            wsConnected,
            connectionStatus,
            mediaPipeInitialized,
            fps,
            currentPrediction
        },
        actions: {
            handleConnect,
            handleDisconnect,
            ensureInitialized,
            startCamera,
            startVideoFile,
            playVideo,
            pauseVideo,
            stopVideo,
            restartVideo
        }
    };
};
