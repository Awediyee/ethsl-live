import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import './AdminConfigurationModal.css'
import './AdminModals.css' // Premium UI styles
// import './UserManagement.css' // Superseded // Import modern styles

function ManageUsersModal({ onClose }) {
    const { t } = useLanguage()
    const [searchTerm, setSearchTerm] = useState('')

    // State for users (Mock data for now)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [roleId, setRoleId] = useState(null)
    const [error, setError] = useState(null)
    const LIMIT = 10

    // Fetch Role ID for 'user'
    useEffect(() => {
        const fetchRole = async () => {
            try {
                const response = await ApiService.getRoles()
                const roles = Array.isArray(response) ? response : (response.data || [])
                const userRole = roles.find(r => r.name.toLowerCase() === 'user')
                if (userRole) {
                    setRoleId(userRole.id || userRole._id)
                } else {
                    setError('User role not found')
                }
            } catch (err) {
                console.error('Failed to fetch roles:', err)
                setError('Failed to initialize: could not load roles')
            }
        }
        fetchRole()
    }, [])

    // Helper to map API data to UI structure
    const mapUserData = (apiData) => {
        if (!apiData) return []
        // The API returns the array inside response.data.data
        // If we passed the array directly, use it.
        const list = Array.isArray(apiData) ? apiData : (apiData.data || [])

        return list.map(item => ({
            id: item.account?.account_id || item.accountInfo_id || Math.random(),
            accountId: item.account?.account_id, // Explicitly store account ID for API calls
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown User',
            email: item.account?.email || 'N/A', // Correctly access nested email
            role: 'User', // Since we are in Manage Users and filtering by User role, display 'User'
            roleId: item.account?.role, // Keep the numeric ID if needed
            status: item.account?.status || 'active',
            subscriptionName: item.subscription?.packageName || item.account?.subscription?.packageName || 'Free',
            ...item
        }))
    }

    // Fetch Users when roleId is set
    useEffect(() => {
        if (!roleId) return

        const fetchUsers = async () => {
            setLoading(true)
            try {
                // Determine page to fetch. If it's initial load, page 1.
                // Actually, we should probably just fetch page 1 on roleId change.
                const response = await ApiService.getAccounts(LIMIT, roleId, 1)
                // New structure: response.data has pagination metadata, response.data.data has the list
                const rawData = response.data || {}
                const newUsers = mapUserData(rawData)

                setUsers(newUsers)
                setPage(1)
                setHasMore(newUsers.length === LIMIT) // Assuming LIMIT determines if more exist
                console.log('Fetched users:', newUsers)
            } catch (err) {
                console.error('Failed to fetch users:', err)
                setError('Failed to load users')
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [roleId])

    const loadMore = async () => {
        if (loading || !hasMore || !roleId) return

        setLoading(true)
        try {
            const nextPage = page + 1
            const response = await ApiService.getAccounts(LIMIT, roleId, nextPage)
            const rawData = response.data || {}
            const newUsers = mapUserData(rawData)

            if (newUsers.length === 0) {
                setHasMore(false)
            } else {
                setUsers(prev => {
                    // Filter duplicates just in case
                    const existingIds = new Set(prev.map(u => u.id))
                    const uniqueNew = newUsers.filter(u => !existingIds.has(u.id))
                    return [...prev, ...uniqueNew]
                })
                setPage(nextPage)
                setHasMore(newUsers.length === LIMIT)
            }
        } catch (err) {
            console.error('Failed to load more users:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (user) => {
        const accId = user.accountId || user.id; // Try explicit accountId first
        if (!accId || typeof accId !== 'string') {
            alert('Error: Invalid Account ID');
            return;
        }

        try {
            await ApiService.toggleAccountStatus(accId)
            // Optimistic update
            setUsers(prev => prev.map(u => {
                if (u.id === user.id) {
                    return { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
                }
                return u
            }))
        } catch (err) {
            console.error('Failed to toggle status:', err)
            // Show meaningful error
            alert(`Failed to toggle status: ${err.message || 'Unknown error'}`)
        }
    }

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMore()
        }
    }

    const handleDelete = (userId) => {
        if (window.confirm(t('confirmDelete') || 'Are you sure you want to delete this user?')) {
            setUsers(users.filter(user => user.id !== userId))
        }
    }

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    // Filter Logic
    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    // Display all loaded users (paginated), let backend handle full search if needed eventually,
    // but for now we filter what we have loaded.
    const displayedUsers = filteredUsers
    const hasHiddenUsers = !searchTerm && filteredUsers.length > 3

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('manageUsers') || 'Manage Users'}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body" onScroll={handleScroll}>
                    {/* Toolbar */}
                    <div className="toolbar">
                        <div className="search-bar">
                            <span className="search-icon">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder={t('searchUsers') || 'Search users...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        {/* Filter Buttons could go here */}
                    </div>

                    {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

                    {/* Loading Initial */}
                    {loading && users.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <LoadingSpinner size="large" />
                            <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{t('loading') || 'Loading users...'}</div>
                        </div>
                    )}

                    {/* Users Grid */}
                    <div className="cards-grid">
                        {!loading && displayedUsers.length === 0 ? (
                            <div className="empty-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                                <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M9 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><circle cx="17" cy="7" r="4" />
                                    </svg>
                                </div>
                                <p>{t('noUsersFound') || 'No users found matching your search.'}</p>
                            </div>
                        ) : (
                            displayedUsers.map((user, index) => (
                                <div key={user.id} className="user-card">
                                    <div className="user-card-header">
                                        <div className={`avatar`} style={{
                                            background: index % 2 === 0 ? '#eff6ff' : '#f5f3ff',
                                            color: index % 2 === 0 ? '#1e40af' : '#5b21b6'
                                        }}>
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <div className="user-info">
                                            <h3>{user.name}</h3>
                                            <p>{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="user-card-actions">
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span className={`badge ${user.status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                                                {user.status || 'Active'}
                                            </span>
                                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                                                {user.subscriptionName || 'Free'}
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '8px' }}>
                                                USER
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className="icon-btn"
                                                title={user.status === 'active' ? (t('deactivate') || 'Deactivate') : (t('activate') || 'Activate')}
                                                style={{ opacity: user.status === 'active' ? 1 : 0.6 }}
                                            >
                                                {user.status === 'active' ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                                                    </svg>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="5 3 19 12 5 21 5 3" />
                                                    </svg>
                                                )}
                                            </button>

                                            <button
                                                className="icon-btn delete"
                                                title={t('delete') || 'Delete'}
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
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('close') || 'Close'}</button>
                </div>
            </div>
        </div>
    )
}

export default ManageUsersModal
