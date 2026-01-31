import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmationModal from '../common/ConfirmationModal'
import ManageRolePermissionsModal from './ManageRolePermissionsModal'
import './AdminModals.css' // Premium UI styles
import './AdminModals.css' // Premium UI styles
// import './UserManagement.css' // Superseded by AdminModals.css
// Let's comment out AdminConfigurationModal.css as we are replacing it.
// import './AdminConfigurationModal.css'

function ManageRolesModal({ onClose, onEditRole, onAddRole }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const [roles, setRoles] = useState([])
    const [confirmDeleteRole, setConfirmDeleteRole] = useState(null)
    const [permissionsRole, setPermissionsRole] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchRoles = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getRoles()
            console.log('Roles API Request:', response)

            let rolesList = []
            if (Array.isArray(response)) {
                rolesList = response
            } else if (response && Array.isArray(response.data)) {
                rolesList = response.data
            } else if (response && Array.isArray(response.roles)) {
                rolesList = response.roles
            } else {
                console.warn('Unexpected roles response format:', response)
                rolesList = []
            }

            // Normalize and fallback data
            const normalizedRoles = rolesList.map(r => ({
                id: r.id || r._id || Math.random(),
                name: r.name || r.roleName || r.title || t('unknownRole'),
                original: r
            }))

            setRoles(normalizedRoles)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch roles:', err)
            setError(`${t('failedToLoadRoles')}: ${err.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const handleDelete = (role) => {
        setConfirmDeleteRole(role)
    }

    const performDelete = async () => {
        if (!confirmDeleteRole) return

        const roleId = confirmDeleteRole.id
        setConfirmDeleteRole(null) // Close modal immediately for better UX

        try {
            await ApiService.deleteRole(roleId)
            // Refresh list
            fetchRoles()
        } catch (err) {
            console.error('Failed to delete role:', err)
            showToast('Failed to delete role: ' + (err.message || 'Unknown error'), 'error')
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('manageRoles')}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Actions Toolbar */}
                    <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={onAddRole}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {t('addNewRole')}
                        </button>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <LoadingSpinner size="large" />
                            <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
                        </div>
                    ) : (
                        <div className="cards-grid">
                            {roles.length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                    <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                    </div>
                                    <p>{t('noRolesFound')}</p>
                                </div>
                            ) : (
                                roles.map((role, index) => (
                                    <div key={role.id} className="user-card role-card">
                                        <div className="user-card-header">
                                            <div className="avatar" style={{
                                                background: '#fff7ed',
                                                color: '#c2410c'
                                            }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                </svg>
                                            </div>
                                            <div className="user-info">
                                                <h3>{role.name}</h3>
                                            </div>
                                        </div>

                                        <div className="user-card-actions">
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '8px' }}>
                                                {t('roleLabel')}
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="icon-btn"
                                                    style={{ color: 'var(--accent-color)' }}
                                                    onClick={() => setPermissionsRole(role)}
                                                    title={t('managePermissions')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                                        <path d="M12 8v4" /><path d="M12 16h.01" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="icon-btn"
                                                    onClick={() => {
                                                        onClose()
                                                        onEditRole(role.original || role)
                                                    }}
                                                    title={t('edit')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    className="icon-btn delete"
                                                    onClick={() => handleDelete(role)}
                                                    title={t('delete')}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
                </div>
            </div>

            {confirmDeleteRole && (
                <ConfirmationModal
                    title={t('deleteRole')}
                    message={`${t('confirmDeleteRole')} "${confirmDeleteRole.name}"?`}
                    onConfirm={performDelete}
                    onCancel={() => setConfirmDeleteRole(null)}
                    confirmText={t('delete')}
                    type="danger"
                />
            )}

            {permissionsRole && (
                <ManageRolePermissionsModal
                    role={permissionsRole}
                    onClose={() => setPermissionsRole(null)}
                />
            )}
        </div>
    )
}

export default ManageRolesModal
