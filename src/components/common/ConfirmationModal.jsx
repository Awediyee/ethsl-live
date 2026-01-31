import React from 'react';
import './ConfirmationModal.css';
import BaseModal from './BaseModal';
import { useLanguage } from '../../contexts/LanguageContext';

function ConfirmationModal({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
    type = 'warning', // 'warning', 'danger', 'info'
    isLoading = false
}) {
    const { t } = useLanguage();

    return (
        <div className="confirmation-modal-overlay">
            <div className={`confirmation-modal-content ${type}`}>
                <div className="confirmation-header">
                    <div className={`confirmation-icon ${type}`}>
                        {type === 'danger' ? '🗑️' : type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <h3>{title}</h3>
                </div>

                <div className="confirmation-body">
                    <p>{message}</p>
                </div>

                <div className="confirmation-footer">
                    <button
                        className="btn-cancel"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                        {cancelText || t('cancel') || 'Cancel'}
                    </button>
                    <button
                        className={`btn-confirm ${type}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <span className="spinner-small"></span> : (confirmText || t('confirm') || 'Confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;
