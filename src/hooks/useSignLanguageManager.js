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
    }, []);

    // Handle WebSocket messages for translations
    useEffect(() => {
        const cleanup = registerOnMessage((dataString) => {
            try {
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
    }, [registerOnMessage, handleTranslationUpdate]);

    // Initialize core MediaPipe hook
    const {
        initializeMediaPipe,
        startProcessing,
        stopProcessing,
        processVideoFile,
        cleanup
    } = useMediaPipe(videoRef, canvasRef, handleTranslationUpdate, handleStatusUpdate, send);

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
            startProcessing,
            stopProcessing,
            processVideoFile
        }
    };
};
