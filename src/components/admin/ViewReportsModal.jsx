import { useLanguage } from '../../contexts/LanguageContext'
import './AdminConfigurationModal.css'

function ViewReportsModal({ onClose }) {
    const { t } = useLanguage()

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-config-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>{t('viewReports') || 'View Reports'}</h2>
                    <button className="admin-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="admin-modal-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div style={{
                            background: 'var(--bg-primary)',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '32px', color: 'var(--primary-color)', marginBottom: '10px' }}>📊</div>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>User Growth</h3>
                            <div style={{ height: '100px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'end', justifyContent: 'center', paddingBottom: '10px', color: 'var(--text-secondary)' }}>
                                [Chart Placeholder]
                            </div>
                        </div>

                        <div style={{
                            background: 'var(--bg-primary)',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '32px', color: '#4caf50', marginBottom: '10px' }}>🌍</div>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Traffic</h3>
                            <div style={{ height: '100px', background: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'end', justifyContent: 'center', paddingBottom: '10px', color: 'var(--text-secondary)' }}>
                                [Map Placeholder]
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Monthly Summary</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Total translations increased by <strong>15%</strong> this month. User engagement is at an all-time high.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('close') || 'Close'}</button>
                </div>
            </div>
        </div>
    )
}

export default ViewReportsModal
