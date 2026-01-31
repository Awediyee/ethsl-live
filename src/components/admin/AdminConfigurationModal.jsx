import { useState, useRef, useEffect } from 'react'
import BaseModal from '../common/BaseModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ThemeToggle from '../user/ThemeToggle'
import LanguageSelect from '../user/LanguageSelect'
import { useSignLanguageManager } from '../../hooks/useSignLanguageManager'
import { useWebSocket } from '../../contexts/WebSocketContext'
import './AdminConfigurationModal.css'

function AdminConfigurationModal({ onClose, onSave, onLogout }) {
    const { t, language, changeLanguage } = useLanguage()
    const { showToast } = useToast()
    const {
        wsUrl,
        setWsUrl,
        wsConnected,
        connectionStatus,
        connect: handleConnect,
        disconnect: handleDisconnect
    } = useWebSocket();

    useState(() => {
        // console.log("AdminConfigurationModal Loaded")
    }, [])

    const [activeTab, setActiveTab] = useState('general')
    const [config, setConfig] = useState({
        siteName: t('appTitle'),
        websocketUrl: localStorage.getItem('websocket_url') || 'ws://localhost:8000',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        autoBackup: false
    })

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Auto-save WebSocket URL to localStorage when changed
        if (name === 'websocketUrl') {
            localStorage.setItem('websocket_url', value)
            setWsUrl(value)
        }
    }

    const handleSave = () => {
        // WebSocket URL is already saved in localStorage via context

        // TODO: API call to save other config
        console.log('Saving config:', config)
        onSave && onSave(config)
        onClose()
    }

    const onConnect = () => {
        handleConnect(config.websocketUrl)
    }



    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-config-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>{t('systemSettings')}</h2>
                    <button className="admin-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="admin-modal-body">
                    <div className="admin-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span className="tab-btn-text">{t('general')}</span>
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                            onClick={() => setActiveTab('features')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                            <span className="tab-btn-text">{t('features')}</span>
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span className="tab-btn-text">{t('security')}</span>
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14" />
                                <line x1="4" y1="10" x2="4" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12" y2="3" />
                                <line x1="20" y1="21" x2="20" y2="16" />
                                <line x1="20" y1="12" x2="20" y2="3" />
                                <line x1="1" y1="14" x2="7" y2="14" />
                                <line x1="9" y1="8" x2="15" y2="8" />
                                <line x1="17" y1="16" x2="23" y2="16" />
                            </svg>
                            <span className="tab-btn-text">{t('preferences')}</span>
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'general' && (
                            <div className="config-section">
                                <div className="form-group">
                                    <label>{t('siteName')}</label>
                                    <input
                                        type="text"
                                        name="siteName"
                                        value={config.siteName}
                                        onChange={handleChange}
                                        className="modal-input"
                                    />
                                </div>

                                <div className="form-group" style={{ marginTop: '20px' }}>
                                    <label>{t('websocketUrl')}</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            name="websocketUrl"
                                            value={config.websocketUrl}
                                            onChange={handleChange}
                                            className="modal-input"
                                            placeholder="ws://localhost:8000"
                                            disabled={wsConnected}
                                            style={{ flex: 1 }}
                                        />
                                        {!wsConnected ? (
                                            <button
                                                className="btn-upload"
                                                onClick={onConnect}
                                                style={{ padding: '10px 20px', background: '#4CAF50', whiteSpace: 'nowrap' }}
                                            >
                                                {t('connect')}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-upload"
                                                onClick={handleDisconnect}
                                                style={{ padding: '10px 20px', background: '#ff4444', whiteSpace: 'nowrap' }}
                                            >
                                                {t('disconnect')}
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                        <span
                                            style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: wsConnected ? '#52c41a' : '#ff4d4f',
                                                display: 'inline-block'
                                            }}
                                        ></span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {wsConnected ? t('connected') : connectionStatus || t('notConnected')}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                        {t('websocketUrlDesc')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="config-section">
                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <span>{t('maintenanceMode')}</span>
                                        <input
                                            type="checkbox"
                                            name="maintenanceMode"
                                            checked={config.maintenanceMode}
                                            onChange={handleChange}
                                        />
                                        <span className="toggle-switch"></span>
                                    </label>
                                    <p className="toggle-desc">{t('maintenanceModeDesc')}</p>
                                </div>

                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <span>{t('allowRegistration')}</span>
                                        <input
                                            type="checkbox"
                                            name="allowRegistration"
                                            checked={config.allowRegistration}
                                            onChange={handleChange}
                                        />
                                        <span className="toggle-switch"></span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="config-section">
                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <span>{t('emailNotifications')}</span>
                                        <input
                                            type="checkbox"
                                            name="emailNotifications"
                                            checked={config.emailNotifications}
                                            onChange={handleChange}
                                        />
                                        <span className="toggle-switch"></span>
                                    </label>
                                </div>
                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <span>{t('autoBackup')}</span>
                                        <input
                                            type="checkbox"
                                            name="autoBackup"
                                            checked={config.autoBackup}
                                            onChange={handleChange}
                                        />
                                        <span className="toggle-switch"></span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="config-section">
                                {/* Theme Setting */}
                                <div className="settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-primary)', borderRadius: '12px', marginBottom: '16px' }}>
                                    <div className="settings-row-label">
                                        <span className="settings-label-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('theme')}</span>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                {/* Language Setting */}
                                <div className="settings-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'var(--bg-primary)', borderRadius: '12px', marginBottom: '16px' }}>
                                    <div className="settings-row-label">
                                        <span className="settings-label-text" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('language')}</span>
                                    </div>
                                    <LanguageSelect />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                    <button
                        className="admin-btn-danger"
                        onClick={() => {
                            onClose()
                            onLogout && onLogout()
                        }}
                        style={{
                            background: 'none',
                            color: '#ff4d4f',
                            border: 'none',
                            padding: '10px 0',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        {t('signOut')}
                    </button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="cancel-btn" onClick={onClose}>{t('close')}</button>
                        <button className="save-btn" onClick={handleSave}>{t('save')}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminConfigurationModal
