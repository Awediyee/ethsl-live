import { createContext, useContext, useState, useCallback } from 'react'
import Toast from '../components/common/Toast'

const ToastContext = createContext()

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((message, type = 'info', title = null) => {
        const id = Date.now()
        // To remove the "mess", we clear previous toasts and only show the latest
        setToasts([{ id, message, type, title }])
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
                {toasts.map(toast => {
                    return (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            title={toast.title}
                            onClose={() => removeToast(toast.id)}
                        />
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}
