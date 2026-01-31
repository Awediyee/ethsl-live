import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import './AdminModals.css'

function ManageRolePermissionsModal({ role, onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const [allPermissions, setAllPermissions] = useState([])
    const [assignedPermissionIds, setAssignedPermissionIds] = useState([])
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(null) // ID of permission being toggled

    const fetchData = async () => {
        setLoading(true)
        try {
            const [allRes, assignedRes] = await Promise.all([
                ApiService.getPermissions(),
                ApiService.getRolePermissions(role.id)
            ])

            if (allRes.status === 'success') {
                setAllPermissions(allRes.data || [])
            }

            if (assignedRes.status === 'success' && assignedRes.data) {
                setAssignedPermissionIds(assignedRes.data.permissions_ids || [])
            }
        } catch (err) {
            console.error('Failed to fetch permissions:', err)
            showToast(t('failedToLoadPermissions') || 'Failed to load permissions', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [role.id])

    const handleToggle = async (permissionId) => {
        setToggling(permissionId)
        try {
            const response = await ApiService.toggleRolePermission(role.id, permissionId)
            if (response.status === 'success') {
                // Update local state
                setAssignedPermissionIds(prev => {
                    if (prev.includes(permissionId)) {
                        return prev.filter(id => id !== permissionId)
                    } else {
                        return [...prev, permissionId]
                    }
                })
                showToast(t('permissionUpdated') || 'Permission updated successfully', 'success')
            }
        } catch (err) {
            console.error('Failed to toggle permission:', err)
            showToast(t('failedToUpdatePermission') || 'Failed to update permission', 'error')
        } finally {
            setToggling(null)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 style={{ marginBottom: '4px' }}>{t('managePermissions') || 'Manage Permissions'}</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                            {t('role') || 'Role'}: <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{role.name}</span>
                        </p>
                    </div>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <LoadingSpinner />
                            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{t('loading')}</p>
                        </div>
                    ) : (
                        <div className="permissions-list">
                            {allPermissions.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('noPermissionsFound') || 'No permissions found.'}</p>
                            ) : (
                                allPermissions.map(perm => (
                                    <div key={perm.id} className="permission-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        background: 'var(--bg-secondary)',
                                        marginBottom: '8px',
                                        border: '1px solid var(--border-color)',
                                        opacity: toggling === perm.id ? 0.7 : 1,
                                        transition: 'all 0.2s ease'
                                    }}>
                                        <div style={{ flex: 1, marginRight: '16px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{perm.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{perm.description}</div>
                                        </div>
                                        <div className="permission-toggle">
                                            <label className="toggle-label" style={{ margin: 0 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={assignedPermissionIds.includes(perm.id)}
                                                    onChange={() => handleToggle(perm.id)}
                                                    disabled={toggling === perm.id}
                                                />
                                                <span className="toggle-switch"></span>
                                            </label>
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
        </div>
    )
}

export default ManageRolePermissionsModal
