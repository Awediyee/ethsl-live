import { useLanguage } from '../../contexts/LanguageContext'
import './AdminConfigurationModal.css'

function ActivityLogsModal({ onClose }) {
    const { t } = useLanguage()

    const logs = [
        { id: 1, action: t('actionLogin'), user: 'abebe@example.com', time: '2 mins ago', icon: '🔑' },
        { id: 2, action: t('actionTranslation'), user: 'guest_user', time: '5 mins ago', icon: '🔤' },
        { id: 3, action: t('actionBackup'), user: 'System', time: '1 hour ago', icon: '💾' },
        { id: 4, action: t('actionFailedLogin'), user: 'unknown', time: '2 hours ago', icon: '⚠️' },
    ]

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-config-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>{t('activityLogs') || 'Activity Logs'}</h2>
                    <button className="admin-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="admin-modal-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {logs.map((log, index) => (
                            <div key={log.id} style={{
                                padding: '15px',
                                borderBottom: index < logs.length - 1 ? '1px solid var(--border-color)' : 'none',
                                display: 'flex',
                                gap: '15px',
                                alignItems: 'start'
                            }}>
                                <span style={{ fontSize: '18px' }}>{log.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.action}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.time}</span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        {t('userLabel')} <span style={{ color: 'var(--primary-color)' }}>{log.user}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('close') || 'Close'}</button>
                </div>
            </div>
        </div>
    )
}

export default ActivityLogsModal
