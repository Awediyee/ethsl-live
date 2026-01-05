import { useLanguage } from '../../contexts/LanguageContext'
import BaseModal from '../common/BaseModal'

function SubscriptionModal({ onClose }) {
    const { t } = useLanguage()

    return (
        <BaseModal title={t('subscriptionTitle') || "Subscription"} onClose={onClose}>
            <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* Free Plan */}
                <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '20px',
                    width: '250px',
                    textAlign: 'center',
                    background: 'var(--bg-primary)'
                }}>
                    <h3>{t('freeTier')}</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '15px 0' }}>$0<span style={{ fontSize: '14px' }}>{t('months')}</span></div>
                    <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '20px', color: 'var(--text-secondary)' }}>
                        <li>✓ {t('basicTrans')}</li>
                        <li>✓ {t('requests')}</li>
                        <li>✓ {t('standardSupport')}</li>
                    </ul>
                    <button disabled style={{ width: '100%', padding: '10px', background: 'var(--text-secondary)', color: 'white', border: 'none', borderRadius: '4px' }}>{t('currentPlan')}</button>
                </div>

                {/* Pro Plan */}
                <div style={{
                    border: '1px solid var(--primary-color)',
                    borderRadius: '8px',
                    padding: '20px',
                    width: '250px',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ color: 'var(--primary-color)' }}>{t('proTier')}</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '15px 0' }}>$9.99<span style={{ fontSize: '14px' }}>{t('months')}</span></div>
                    <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '20px', color: 'var(--text-primary)' }}>
                        <li>✓ {t('unlimitedTrans')}</li>
                        <li>✓ {t('apiAccess')}</li>
                        <li>✓ {t('prioritySupport')}</li>
                    </ul>
                    <button style={{ width: '100%', padding: '10px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{t('upgrade')}</button>
                </div>
            </div>
        </BaseModal>
    )
}

export default SubscriptionModal
