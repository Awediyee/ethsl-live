import React from 'react';
import './BaseModal.css';

const BaseModal = ({ title, onClose, children, maxWidth = '900px' }) => {
    return (
        <div className="base-modal-overlay" onClick={onClose}>
            <div className="base-modal-content" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
                <div className="base-modal-header">
                    <div className="base-modal-title">{title}</div>
                    <button className="base-modal-close" onClick={onClose}>
                        ✕
                    </button>
                </div>
                <div className="base-modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BaseModal;
