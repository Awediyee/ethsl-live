import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmationModal from '../common/ConfirmationModal'
import SecurityUtils from '../../utils/security'
import './AdminConfigurationModal.css'
import './AdminModals.css' // Premium UI styles
// import './UserManagement.css' // Superseded // Import modern styles

function ManageUsersModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const { user: currentUser } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)

    // State for users (Mock data for now)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [roleId, setRoleId] = useState(null)
    const [error, setError] = useState(null)
    const LIMIT = 10
    // Add User Flow States
    const [isAddingUser, setIsAddingUser] = useState(false)
    const [addUserStep, setAddUserStep] = useState(1)
    const [addUserForm, setAddUserForm] = useState({
        email: '',
        password: '',
        role_id: '',
        otp: ''
    })
    const [availableRoles, setAvailableRoles] = useState([])
    const [addingLoading, setAddingLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    // Fetch Role ID for 'user' and available roles
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await ApiService.getRoles()
                const roles = Array.isArray(response) ? response : (response.data || [])
                setAvailableRoles(roles)

                const userRole = roles.find(r => r.name.toLowerCase() === 'user')
                if (userRole) {
                    setRoleId(userRole.id || userRole._id)
                } else {
                    setError(t('userRoleNotFound'))
                }
            } catch (err) {
                console.error('Failed to fetch roles:', err)
                setError(t('failedToLoadRoles'))
            }
        }
        fetchInitialData()
    }, [])

    const refreshUsers = async () => {
        if (!roleId) return
        setLoading(true)
        try {
            const response = await ApiService.getAccounts(LIMIT, roleId, 1)
            const rawData = response.data || {}
            const mappedUsers = mapUserData(rawData)
            const finalUsers = await fetchUserSubscriptions(mappedUsers)
            setUsers(finalUsers)
            setPage(1)
            setHasMore(mappedUsers.length === LIMIT)
        } catch (err) {
            console.error('Failed to refresh users:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSendOtp = async () => {
        const sanitizedEmail = SecurityUtils.sanitizeInput(addUserForm.email)

        if (!sanitizedEmail || !addUserForm.password) {
            showToast(t('fillAllFields'), 'error')
            return
        }

        if (!SecurityUtils.isValidEmail(sanitizedEmail)) {
            showToast(t('invalidEmail'), 'error')
            return
        }

        if (addUserForm.password.length < 6) {
            showToast(t('passwordLength'), 'error')
            return
        }
        setAddingLoading(true)
        try {
            await ApiService.register(sanitizedEmail, addUserForm.password)
            showToast(t('otpSent'), 'success')
            setAddUserStep(2)
        } catch (err) {
            showToast(err.message || t('toastError'), 'error')
        } finally {
            setAddingLoading(false)
        }
    }

    const handleVerifyAndCreate = async () => {
        if (!addUserForm.otp || !addUserForm.role_id) {
            showToast(t('fillAllFields'), 'error')
            return
        }
        setAddingLoading(true)
        try {
            await ApiService.verifyAccount(addUserForm)
            showToast(t('userCreated'), 'success')
            setIsAddingUser(false)
            setAddUserForm({ email: '', password: '', role_id: '', otp: '' })
            setAddUserStep(1)
            refreshUsers()
        } catch (err) {
            showToast(err.message || t('failedToCreateUser'), 'error')
        } finally {
            setAddingLoading(false)
        }
    }

    // Helper to map API data to UI structure
    const mapUserData = (apiData) => {
        if (!apiData) return []
        // The API returns the array inside response.data.data
        // If we passed the array directly, use it.
        const list = Array.isArray(apiData) ? apiData : (apiData.data || [])

        return list.map(item => ({
            id: item.account?.account_id || item.accountInfo_id || Math.random(),
            accountId: item.account?.account_id, // Explicitly store account ID for API calls
            name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || t('unknownUser'),
            email: item.account?.email || 'N/A', // Correctly access nested email
            role: 'User', // Since we are in Manage Users and filtering by User role, display 'User'
            roleId: item.account?.role, // Keep the numeric ID if needed
            status: item.account?.status || 'active',
            subscriptionName:
                item.subscription?.package?.package_name ||
                item.subscription?.package_name ||
                item.subscription?.packageName ||
                item.account?.subscription?.package?.package_name ||
                item.account?.subscription?.package_name ||
                item.account?.subscription?.packageName ||
                'Free',
            ...item
        }))
    }

    // Helper to fetch subscriptions for a list of users
    const fetchUserSubscriptions = async (mappedUsers) => {
        try {
            const usersWithSubs = await Promise.all(mappedUsers.map(async (user) => {
                if (!user.accountId) return user;
                try {
                    const subResponse = await ApiService.getAccountSubscription(user.accountId);
                    // Standardize finding the name from nested data
                    const pkg = subResponse?.data?.package || subResponse?.package;
                    const subName = pkg?.package_name || pkg?.packageName || 'Free';
                    return { ...user, subscriptionName: subName };
                } catch (subErr) {
                    console.warn(`Could not fetch sub for ${user.email}:`, subErr);
                    return user; // Fallback to existing (likely 'Free')
                }
            }));
            return usersWithSubs;
        } catch (error) {
            console.error('Error fetching batch subscriptions:', error);
            return mappedUsers;
        }
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
                const mappedUsers = mapUserData(rawData)

                // Fetch actual subscriptions for each user in parallel
                const finalUsers = await fetchUserSubscriptions(mappedUsers)

                setUsers(finalUsers)
                setPage(1)
                setHasMore(mappedUsers.length === LIMIT)
                console.log('Fetched users with subs:', finalUsers)
            } catch (err) {
                console.error('Failed to fetch users:', err)
                setError(t('failedToLoadUsers'))
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
            const mappedUsers = mapUserData(rawData)

            if (mappedUsers.length === 0) {
                setHasMore(false)
            } else {
                // Fetch actual subscriptions for each user in parallel
                const finalUsers = await fetchUserSubscriptions(mappedUsers)

                setUsers(prev => {
                    // Filter duplicates just in case
                    const existingIds = new Set(prev.map(u => u.id))
                    const uniqueNew = finalUsers.filter(u => !existingIds.has(u.id))
                    return [...prev, ...uniqueNew]
                })
                setPage(nextPage)
                setHasMore(mappedUsers.length === LIMIT)
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
            showToast(t('invalidAccountId'), 'error');
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
            showToast(`${t('failedToToggleStatus')}: ${err.message || 'Unknown error'}`, 'error')
        }
    }

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            loadMore()
        }
    }

    const handleDelete = (user) => {
        setConfirmDeleteUser(user)
    }

    const performDelete = () => {
        if (confirmDeleteUser) {
            setUsers(users.filter(u => u.id !== confirmDeleteUser.id))
            setConfirmDeleteUser(null)
            showToast(t('toastSuccess'), 'success') // Or a more specific one
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
                    <h2>{t('manageUsers')}</h2>
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
                                placeholder={t('searchUsers')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={() => setIsAddingUser(!isAddingUser)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {t('addUser')}
                        </button>
                    </div>

                    {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}

                    {/* Add User Form */}
                    {isAddingUser && (
                        <div className="add-user-container">
                            <div className="add-user-header">
                                <h3>{t('addUser')}</h3>
                                <button className="close-button" onClick={() => setIsAddingUser(false)}>&times;</button>
                            </div>

                            <div className="add-user-steps">
                                <div className={`step-indicator ${addUserStep >= 1 ? 'active' : ''}`}></div>
                                <div className={`step-indicator ${addUserStep >= 2 ? 'active' : ''}`}></div>
                                <div className={`step-indicator ${addUserStep >= 3 ? 'active' : ''}`}></div>
                            </div>

                            {addUserStep === 1 && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('emailLabel')}</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="user@example.com"
                                            value={addUserForm.email}
                                            onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('password')}</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control"
                                                placeholder="••••••••"
                                                value={addUserForm.password}
                                                onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                                            />
                                            <button
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                                type="button"
                                                tabIndex="-1"
                                            >
                                                {showPassword ? (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                                                    </svg>
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="form-actions" style={{ alignSelf: 'flex-end' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSendOtp}
                                            disabled={addingLoading}
                                        >
                                            {addingLoading ? t('loading') : t('sendOtp')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {addUserStep === 2 && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('enterOtp')}</label>
                                        <div className="otp-input-wrapper">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                className="form-control otp-control"
                                                placeholder="••••••"
                                                maxLength="6"
                                                value={addUserForm.otp}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '')
                                                    setAddUserForm({ ...addUserForm, otp: val })
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-actions" style={{ alignSelf: 'flex-end' }}>
                                        <button className="btn btn-secondary" onClick={() => setAddUserStep(1)}>{t('back')}</button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setAddUserStep(3)}
                                            disabled={addUserForm.otp.length !== 6}
                                        >
                                            {t('next')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {addUserStep === 3 && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{t('selectRole')}</label>
                                        <select
                                            className="form-control"
                                            value={addUserForm.role_id}
                                            onChange={(e) => setAddUserForm({ ...addUserForm, role_id: e.target.value })}
                                        >
                                            <option value="">{t('selectRole')}</option>
                                            {availableRoles.map(role => (
                                                <option key={role.id || role._id} value={role.id || role._id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-actions" style={{ alignSelf: 'flex-end' }}>
                                        <button className="btn btn-secondary" onClick={() => setAddUserStep(2)}>{t('back')}</button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleVerifyAndCreate}
                                            disabled={addingLoading || !addUserForm.role_id}
                                        >
                                            {addingLoading ? t('loading') : t('createUser')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Loading Initial */}
                    {loading && users.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px' }}>
                            <LoadingSpinner size="large" />
                            <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{t('loading')}</div>
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
                                <p>{t('noUsersFound')}</p>
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
                                                {user.status === 'active' ? t('activeLabel') : t('inactiveLabel')}
                                            </span>
                                            <span className="badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                                                {user.subscriptionName === 'Free' ? t('freeLabel') : user.subscriptionName}
                                            </span>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '8px' }}>
                                                {t('userLabel')}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {!(user.id === currentUser?.id || user.accountId === currentUser?.id || user.accountId === currentUser?.account_id) && (
                                                <>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className="icon-btn"
                                                        title={user.status === 'active' ? t('deactivate') : t('activate')}
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
                                                        onClick={() => handleDelete(user)}
                                                        title={t('delete')}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>{t('close')}</button>
                </div>
            </div>

            {confirmDeleteUser && (
                <ConfirmationModal
                    title={t('deleteUser')}
                    message={`${t('confirmDelete')} (${confirmDeleteUser.name})`}
                    onConfirm={performDelete}
                    onCancel={() => setConfirmDeleteUser(null)}
                    confirmText={t('delete')}
                    type="danger"
                />
            )}
        </div>
    )
}

export default ManageUsersModal
