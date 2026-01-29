import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export function useWebSocket() {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
}

export function WebSocketProvider({ children }) {
    const [wsUrl, setWsUrl] = useState(localStorage.getItem('websocket_url') || 'ws://localhost:8000');
    const [wsConnected, setWsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const { showToast } = useToast();
    const { isLoggedIn } = useAuth();
    const socketRef = useRef(null);
    const onMessageCallbacks = useRef(new Set());
    const pendingToastRef = useRef(false);

    const connect = useCallback((url = wsUrl) => {
        // If already connecting or connected, don't start another one
        if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        setConnectionStatus('Connecting...');
        pendingToastRef.current = true;

        try {
            const socket = new WebSocket(url);

            socket.onopen = () => {
                setWsConnected(true);
                setConnectionStatus('Connected');
                if (pendingToastRef.current) {
                    showToast('WebSocket server is now connected and ready.', 'success');
                    pendingToastRef.current = false;
                }
            };

            socket.onclose = (event) => {
                setWsConnected(false);
                setConnectionStatus('Disconnected');
                pendingToastRef.current = false;
            };

            socket.onerror = (error) => {
                setWsConnected(false);
                setConnectionStatus('Connection error');
                if (pendingToastRef.current) {
                    showToast('Unable to connect to WebSocket server. Please check the URL.', 'error');
                    pendingToastRef.current = false;
                }
            };

            socket.onmessage = (event) => {
                onMessageCallbacks.current.forEach(callback => callback(event.data));
            };

            socketRef.current = socket;
        } catch (error) {
            setConnectionStatus('Connection error');
            if (pendingToastRef.current) {
                showToast('Unable to connect to WebSocket server. Please check the URL.', 'error');
                pendingToastRef.current = false;
            }
        }
    }, [wsUrl, showToast]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
    }, []);

    const send = useCallback((data) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify(data));
        }
    }, []);

    const registerOnMessage = useCallback((callback) => {
        onMessageCallbacks.current.add(callback);
        return () => onMessageCallbacks.current.delete(callback);
    }, []);

    // Connect on mount or when login status becomes true
    useEffect(() => {
        if (isLoggedIn) {
            // Delay to ensure auth and toast systems are settled
            const timer = setTimeout(() => {
                connect();
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, connect]);

    // Update localStorage when wsUrl changes
    useEffect(() => {
        localStorage.setItem('websocket_url', wsUrl);
    }, [wsUrl]);

    return (
        <WebSocketContext.Provider value={{
            wsUrl,
            setWsUrl,
            wsConnected,
            connectionStatus,
            connect,
            disconnect,
            send,
            registerOnMessage
        }}>
            {children}
        </WebSocketContext.Provider>
    );
}
