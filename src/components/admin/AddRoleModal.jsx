import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import api from '../../services/api'
import './AdminConfigurationModal.css' // Reuse similar styles

function AddRoleModal({ onClose, onSave, initialData = null }) {
    const { t } = useLanguage()
    const [roleData, setRoleData] = useState({
        name: '',
        description: '',
        permissions: [],
        ...initialData
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setRoleData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        try {
            if (initialData && (initialData._id || initialData.id)) {
                // Update
                const updatePayload = {
                    id: initialData._id || initialData.id,
                    ...roleData
                }
                await api.updateRole(updatePayload)
            } else {
                // Create
                await api.createRole(roleData)
            }

            onSave && onSave(roleData)
            onClose()
        } catch (err) {
            console.error('Failed to save role:', err)
            setError(err.message || 'Failed to save role')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-config-modal" onClick={e => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>{initialData ? (t('editRole') || 'Edit Role') : (t('addRole') || 'Add Role')}</h2>
                    <button className="admin-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="admin-modal-body">
                    <div className="config-section">
                        <div className="form-group">
                            <label>{t('roleName') || 'Role Name'}</label>
                            <input
                                type="text"
                                name="name"
                                value={roleData.name}
                                onChange={handleChange}
                                className="modal-input"
                                placeholder="e.g. Moderator"
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('roleDescription') || 'Description'}</label>
                            <textarea
                                name="description"
                                value={roleData.description}
                                onChange={handleChange}
                                className="modal-input"
                                rows="3"
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('permissions') || 'Permissions'}</label>
                            <div style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                                    {/* Placeholder for permissions checklist */}
                                    Basic permissions selected by default.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('close') || 'Close'}</button>
                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                        {saving ? (t('saving') || 'Saving...') : (initialData ? (t('updateRole') || 'Update Role') : (t('createRole') || 'Create Role'))}
                    </button>
                    {error && <p style={{ color: 'red', marginTop: '10px', width: '100%', textAlign: 'center' }}>{error}</p>}
                </div>
            </div>
        </div>
    )
}

export default AddRoleModal
