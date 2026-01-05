import { useLanguage } from '../../contexts/LanguageContext'
import BaseModal from '../common/BaseModal'

function AboutModal({ onClose }) {
    const { t } = useLanguage()

    return (
        <BaseModal title={t('aboutTitle') || "About EthSLT"} onClose={onClose}>
            <div style={{ maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px', textAlign: 'center' }}>
                    {t('aboutHeader')}
                </h2>

                <p style={{ marginBottom: '15px', textAlign: 'justify' }}>
                    {t('aboutDescription')}
                </p>
            </div>
        </BaseModal>
    )
}

export default AboutModal
