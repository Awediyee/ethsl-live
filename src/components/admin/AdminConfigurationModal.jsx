import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import ThemeToggle from '../user/ThemeToggle'
import './AdminConfigurationModal.css'

function AdminConfigurationModal({ onClose, onSave, onLogout }) {
    const { t, language, changeLanguage } = useLanguage()

    // Force reload debug
    useState(() => {
        console.log("AdminConfigurationModal Loaded - Version 3 (Simple Button + Translations)")
    }, [])

    const [activeTab, setActiveTab] = useState('general')
    const [config, setConfig] = useState({
        siteName: 'Amharic Sign Language Translate',
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
    }

    const handleSave = () => {
        // TODO: API call to save config
        console.log('Saving config:', config)
        onSave && onSave(config)
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-config-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>{t('systemSettings') || 'System Configuration'}</h2>
                    <button className="admin-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="admin-modal-body">
                    <div className="admin-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            {t('general') || 'General'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                            onClick={() => setActiveTab('features')}
                        >
                            {t('features') || 'Features'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            {t('security') || 'Security'}
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            {t('preferences') || 'Preferences'}
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'general' && (
                            <div className="config-section">
                                <div className="form-group">
                                    <label>{t('siteName') || 'Site Name'}</label>
                                    <input
                                        type="text"
                                        name="siteName"
                                        value={config.siteName}
                                        onChange={handleChange}
                                        className="modal-input"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="config-section">
                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <span>{t('maintenanceMode') || 'Maintenance Mode'}</span>
                                        <input
                                            type="checkbox"
                                            name="maintenanceMode"
                                            checked={config.maintenanceMode}
                                            onChange={handleChange}
                                        />
                                        <span className="toggle-switch"></span>
                                    </label>
                                    <p className="toggle-desc">{t('maintenanceModeDesc') || 'Put the site in maintenance mode. Only admins can access.'}</p>
                                </div>

                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <span>{t('allowRegistration') || 'Allow User Registration'}</span>
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
                                        <span>{t('emailNotifications') || 'Email Notifications'}</span>
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
                                        <span>{t('autoBackup') || 'Auto Backup System'}</span>
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
                                <div className="toggle-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{t('theme') || 'Application Theme'}</span>
                                    <ThemeToggle />
                                </div>

                                <div className="form-group">
                                    <label>{t('language') || 'Language'}</label>
                                    <select
                                        value={language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        className="modal-select"
                                    >
                                        <option value="en">English</option>
                                        <option value="am">አማርኛ (Amharic)</option>
                                    </select>
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
                        <span>🚪</span> {t('signOut') || 'Sign Out'}
                    </button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="cancel-btn" onClick={onClose}>{t('close') || 'Close'}</button>
                        <button className="save-btn" onClick={handleSave}>{t('save') || 'Save Changes'}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminConfigurationModal
