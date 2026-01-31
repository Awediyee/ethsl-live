import { useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import './Toast.css'

function Toast({ message, type = 'info', title, onClose }) {
    const { t } = useLanguage()

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
                return t('toastSuccess')
            case 'error':
                return t('toastError')
            case 'warning':
                return t('toastWarning')
            case 'info':
            default:
                return t('toastInfo')
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
