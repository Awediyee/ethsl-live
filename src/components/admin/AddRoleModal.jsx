import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../services/api'
import SecurityUtils from '../../utils/security'
import './AdminConfigurationModal.css' // Reuse similar styles

function AddRoleModal({ onClose, onSave, initialData = null }) {
    const { t } = useLanguage()
    const [roleData, setRoleData] = useState({
        name: '',
        permissions: [],
        ...initialData
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        const sanitizedValue = name === 'name' ? SecurityUtils.sanitizeInput(value) : value
        setRoleData(prev => ({
            ...prev,
            [name]: sanitizedValue
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            const rolePayload = {
                name: roleData.name
            }

            if (initialData && (initialData._id || initialData.id)) {
                // Update
                const roleId = initialData._id || initialData.id
                await api.updateRole(roleId, rolePayload)
            } else {
                // Create
                await api.createRole(rolePayload)
            }

            onSave && onSave(roleData)
            onClose()
        } catch (err) {
            console.error('Failed to save role:', err)
            setError(err.message || t('packageError'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-config-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>{initialData ? t('editRole') : t('addRole')}</h2>
                    <button className="admin-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="admin-modal-body">
                    <div className="config-section">
                        <div className="form-group">
                            <label>{t('roleName')}</label>
                            <input
                                type="text"
                                name="name"
                                value={roleData.name}
                                onChange={handleChange}
                                className="modal-input"
                                placeholder={t('moderatorExample')}
                            />
                        </div>


                        <div className="form-group">
                            <label>{t('permissions')}</label>
                            <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                                    {/* Placeholder for permissions checklist */}
                                    {t('basicPermissionsDefault')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('close')}</button>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? t('saving') : (initialData ? t('updateRole') : t('createRole'))}
                    </button>
                    {error && <p style={{ color: 'red', marginTop: '10px', width: '100%', textAlign: 'center' }}>{error}</p>}
                </div>
            </div>
        </div>
    )
}

export default AddRoleModal
