import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'
import './AdminModals.css' // Premium UI styles
// import './AdminConfigurationModal.css'

function ManageAdminModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()

    const [admins, setAdmins] = useState([])
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [roleId, setRoleId] = useState(null)
    const [error, setError] = useState(null)
    const LIMIT = 10

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const response = await ApiService.getRoles()
                const roles = Array.isArray(response) ? response : (response.data || [])
                // Try to find 'admin' role, or 'super_admin' if preferred? Assuming 'admin' for now.
                const adminRole = roles.find(r => r.name.toLowerCase() === 'admin')
                if (adminRole) {
                    setRoleId(adminRole.id || adminRole._id)
                } else {
                    setError('Admin role not found')
                }
            } catch (err) {
                console.error('Failed to fetch roles:', err)
                setError(t('failedToLoadRoles'))
            }
        }
        fetchRole()
    }, [])

    // Helper to map API data to UI structure
    const mapAdminData = (apiData) => {
        if (!apiData) return []
        // The API returns pagination data, the array is in apiData.data
        const list = Array.isArray(apiData) ? apiData : (apiData.data || [])

        return list.map(item => ({
            id: item.account?.account_id || item.accountInfo_id || Math.random(),
            accountId: item.account?.account_id, // Explicitly store account ID
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || t('unknownAdmin'),
            email: item.account?.email || 'N/A',
            role: 'Admin', // Static label since we filter by Admin role
            roleId: item.account?.role, // Keep original ID (e.g. 2)
            status: item.account?.status || 'active', // Assuming active if not specified
            ...item
        }))
    }

    useEffect(() => {
        if (!roleId) return

        const fetchAdmins = async () => {
            setLoading(true)
            try {
                const response = await ApiService.getAccounts(LIMIT, roleId, 1)
                const rawData = response.data || {}
                const newAdmins = mapAdminData(rawData)
                setAdmins(newAdmins)
                setPage(1)
                setHasMore(newAdmins.length === LIMIT)
            } catch (err) {
                console.error('Failed to fetch admins:', err)
                setError(t('failedToLoadAdmins'))
            } finally {
                setLoading(false)
            }
        }

        fetchAdmins()
    }, [roleId])

    const loadMore = async () => {
        if (loading || !hasMore || !roleId) return

        setLoading(true)
        try {
            const nextPage = page + 1
            const response = await ApiService.getAccounts(LIMIT, roleId, nextPage)
            const rawData = response.data || {}
            const newAdmins = mapAdminData(rawData)

            if (newAdmins.length === 0) {
                setHasMore(false)
            } else {
                setAdmins(prev => {
                    const existingIds = new Set(prev.map(a => a.id))
                    const uniqueNew = newAdmins.filter(a => !existingIds.has(a.id))
                    return [...prev, ...uniqueNew]
                })
                setPage(nextPage)
                setHasMore(newAdmins.length === LIMIT)
            }
        } catch (err) {
            console.error('Failed to load more admins:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (admin) => {
        const accId = admin.accountId || admin.id;
        if (!accId) {
            showToast(t('invalidAccountId'), 'error');
            return;
        }

        try {
            await ApiService.toggleAccountStatus(accId)
            setAdmins(prev => prev.map(a => {
                if (a.id === admin.id) {
                    return { ...a, status: a.status === 'active' ? 'inactive' : 'active' }
                }
                return a
            }))
        } catch (err) {
            console.error('Failed to toggle admin status:', err)
            showToast(`${t('failedToToggleStatus')}: ${err.message || 'Unknown error'}`, 'error')
        }
    }

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMore()
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('manageAdmin')}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body" onScroll={handleScroll}>
                    {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

                    {/* Loading Indicator */}
                    {loading && admins.length === 0 && (
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
                            <div>{t('loading')}</div>
                        </div>
                    )}

                    <div className="cards-grid">
                        {admins.map((admin, index) => (
                            <div key={admin.id} className="user-card">
                                <div className="user-card-header">
                                    <div className="avatar" style={{
                                        background: '#ecfdf5',
                                        color: '#047857'
                                    }}>
                                        {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <div className="user-info">
                                        <h3>{admin.name}</h3>
                                        <p>{admin.email}</p>
                                    </div>
                                </div>

                                <div className="user-card-actions">
                                    <span className={`badge ${admin.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                                        {admin.status === 'active' ? t('activeLabel') : t('inactiveLabel')}
                                    </span>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '8px' }}>
                                            {t('adminLabel')}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStatus(admin);
                                            }}
                                            className="icon-btn"
                                            title={admin.status === 'active' ? t('deactivate') : t('activate')}
                                            style={{ opacity: admin.status === 'active' ? 1 : 0.6 }}
                                        >
                                            {admin.status === 'active' ? '⏸️' : '▶️'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>{t('close')}</button>
                </div>
            </div>
        </div>
    )
}

export default ManageAdminModal
