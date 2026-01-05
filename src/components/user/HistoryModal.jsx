import { useLanguage } from '../../contexts/LanguageContext'
import BaseModal from '../common/BaseModal'

function HistoryModal({ onClose }) {
    const { t } = useLanguage()

    return (
        <BaseModal title={t('historyTitle') || "Translation History"} onClose={onClose}>
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📜</div>
                <h3>{t('noHistory')}</h3>
                <p>{t('historyDesc')}</p>
            </div>
        </BaseModal>
    )
}

export default HistoryModal
