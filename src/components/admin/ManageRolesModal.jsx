import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'
import './AdminModals.css' // Premium UI styles
import './AdminModals.css' // Premium UI styles
// import './UserManagement.css' // Superseded by AdminModals.css
// Let's comment out AdminConfigurationModal.css as we are replacing it.
// import './AdminConfigurationModal.css'

function ManageRolesModal({ onClose, onEditRole, onAddRole }) {
    const { t } = useLanguage()
    const [roles, setRoles] = useState([])
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
                name: r.name || r.roleName || r.title || 'Unknown Role',
                description: r.description || r.desc || '',
                original: r
            }))

            setRoles(normalizedRoles)
            setError(null)
        } catch (err) {
            console.error('Failed to fetch roles:', err)
            setError(`Failed to load roles: ${err.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const handleDelete = async (roleId, roleName) => {
        if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
            return
        }

        try {
            await ApiService.deleteRole(roleId)
            // Refresh list
            fetchRoles()
        } catch (err) {
            console.error('Failed to delete role:', err)
            alert('Failed to delete role: ' + (err.message || 'Unknown error'))
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('manageRoles') || 'Manage Roles'}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {/* Actions Toolbar */}
                    <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={onAddRole}>
                            <span>➕</span> {t('addNewRole') || 'Add New Role'}
                        </button>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                            <div className="spinner" style={{
                                display: 'inline-block',
                                width: '40px',
                                height: '40px',
                                border: '3px solid rgba(var(--primary-color-rgb), 0.1)',
                                borderRadius: '50%',
                                borderTopColor: 'var(--primary-color)',
                                animation: 'spin 1s ease-in-out infinite',
                                marginBottom: '16px'
                            }}></div>
                            <div>{t('loading') || 'Loading roles...'}</div>
                        </div>
                    ) : (
                        <div className="cards-grid">
                            {roles.length === 0 ? (
                                <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
                                    <p>{t('noRolesFound') || 'No roles found.'}</p>
                                </div>
                            ) : (
                                roles.map((role, index) => (
                                    <div key={role.id} className="user-card role-card">
                                        <div className="user-card-header">
                                            <div className="avatar" style={{
                                                background: '#fff7ed',
                                                color: '#c2410c'
                                            }}>
                                                🛡️
                                            </div>
                                            <div className="user-info">
                                                <h3>{role.name}</h3>
                                                <p style={{ fontSize: '12px', opacity: 0.8 }}>
                                                    {role.description ? (role.description.length > 50 ? role.description.substring(0, 50) + '...' : role.description) : 'No description'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="user-card-actions">
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '8px' }}>
                                                ROLE
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="icon-btn"
                                                    onClick={() => {
                                                        onClose()
                                                        onEditRole(role.original || role)
                                                    }}
                                                    title={t('edit') || 'Edit'}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="icon-btn delete"
                                                    onClick={() => handleDelete(role.id, role.name)}
                                                    title={t('delete') || 'Delete'}
                                                >
                                                    🗑️
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
                    <button className="btn btn-secondary" onClick={onClose}>{t('close') || 'Close'}</button>
                </div>
            </div>
        </div>
    )
}

export default ManageRolesModal
