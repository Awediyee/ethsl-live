import { useEffect } from 'react'
import './Toast.css'

function Toast({ message, type = 'info', title, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, 3000) // Auto-dismiss after 3 seconds

        return () => clearTimeout(timer)
    }, [onClose])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓'
            case 'error':
                return '✕'
            case 'warning':
                return '!'
            case 'info':
            default:
                return 'i'
        }
    }

    const getTitle = () => {
        if (title) return title
        switch (type) {
            case 'success':
                return 'Success'
            case 'error':
                return 'Error'
            case 'warning':
                return 'Warning'
            case 'info':
            default:
                return 'Info'
        }
    }

    return (
        <div className={`toast toast-${type} toast-enter`}>
            <div className="toast-content">
                <span className="toast-icon">
                    {getIcon()}
                </span>
                <div className="toast-message">
                    <strong>{getTitle()}</strong>
                    {message}
                </div>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Close">
                ✕
            </button>
        </div>
    )
}

export default Toast
