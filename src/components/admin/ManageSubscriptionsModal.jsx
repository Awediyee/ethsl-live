import { useState, useEffect } from 'react'
import BaseModal from '../common/BaseModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmationModal from '../common/ConfirmationModal'
import './ManageSubscriptionsModal.css'

function ManageSubscriptionsModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [editingPackage, setEditingPackage] = useState(null)
    const [confirmDeletePackage, setConfirmDeletePackage] = useState(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const [formData, setFormData] = useState({
        packageName: '',
        description: '',
        price: '',
        lengthOfSession: '',
        numberOfSessions: '',
        numberOfDays: '',
        historyAccess: 0,
        apiAccess: 0
    })

    const fetchPackages = async () => {
        setLoading(true)
        try {
            const [pkgResponse, analyticsData] = await Promise.all([
                ApiService.getSubscriptionPackages(),
                ApiService.getAdminAnalytics().catch(() => ({}))
            ])

            const pkgs = pkgResponse.data || pkgResponse || []

            // Map subscriber counts if available in analytics
            const packagesWithCounts = pkgs.map(pkg => ({
                ...pkg,
                subscriberCount: analyticsData.usersPerPackage?.[pkg.id] || analyticsData.packageStats?.[pkg.id] || 0
            }))

            setPackages(packagesWithCounts)
        } catch (error) {
            console.error('Detailed Subscription Fetch Error:', error)
            showToast(t('packageError'), 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPackages()
    }, [])

    const handleEdit = (pkg) => {
        console.log('📦 Editing package keys:', Object.keys(pkg));
        console.log('📦 Editing package data:', pkg);
        setEditingPackage(pkg)
        setFormData({
            packageName: pkg.package_name || pkg.packageName || '',
            description: pkg.description || '',
            price: pkg.price || '',
            lengthOfSession: pkg.lengthOfSession || pkg.length_of_session || '',
            numberOfSessions: pkg.numberOfSessions || pkg.number_of_sessions || '',
            historyAccess: (pkg.historyAccess === true || pkg.historyAccess === 1 || pkg.history_access === true || pkg.history_access === 1) ? 1 : 0,
            apiAccess: (pkg.apiAccess === true || pkg.apiAccess === 1 || pkg.api_access === true || pkg.api_access === 1) ? 1 : 0
        })
        setIsFormOpen(true)
    }

    const handleAddNew = () => {
        setEditingPackage(null)
        setFormData({
            packageName: '',
            description: '',
            price: '',
            lengthOfSession: '',
            numberOfSessions: '',
            historyAccess: 0,
            apiAccess: 0
        })
        setIsFormOpen(true)
    }

    const handleDelete = (pkg) => {
        setConfirmDeletePackage(pkg)
    }

    const performDelete = async () => {
        if (!confirmDeletePackage) return

        const pkgId = confirmDeletePackage.id || confirmDeletePackage._id
        if (!pkgId) {
            showToast(t('invalidAccountId'), 'error') // Reusing this or use a generic one
            setConfirmDeletePackage(null)
            return
        }

        setConfirmDeletePackage(null)
        try {
            await ApiService.deleteSubscriptionPackage(pkgId)
            showToast(t('packageDeleted'), 'success')
            fetchPackages()
        } catch (error) {
            console.error('Delete error:', error)

            // Check for specific "in use" error from server
            const errMsg = error.message || ''
            if (errMsg.includes('used in subscription') || error.status === 412) {
                showToast(t('packageInUse'), 'error')
            } else {
                showToast(t('packageError'), 'error')
            }
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            // Strictly following the provided sample JSON structure
            const payload = {
                packageName: String(formData.packageName || ''),
                description: String(formData.description || ''),
                price: String(formData.price || '0'),
                lengthOfSession: Number(formData.lengthOfSession) || 0,
                numberOfSessions: Number(formData.numberOfSessions) || 0,
                historyAccess: Number(formData.historyAccess) || 0,
                apiAccess: Number(formData.apiAccess) || 0
            }

            if (editingPackage) {
                await ApiService.updateSubscriptionPackage(editingPackage.id, payload)
                showToast(t('packageUpdated'), 'success')
            } else {
                await ApiService.createSubscriptionPackage(payload)
                showToast(t('packageCreated'), 'success')
            }
            setIsFormOpen(false)
            fetchPackages()
        } catch (error) {
            console.error('Error saving package:', error)
            // Extract the most descriptive error message possible
            const apiErrorMsg = error.data?.message || error.data?.error || error.message
            showToast(apiErrorMsg || t('packageError'), 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }))
    }

    return (
        <BaseModal title={t('manageSubscriptionsTitle')} onClose={onClose} maxWidth="1000px">
            <div style={{ padding: '24px' }}>
                {!isFormOpen ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                {t('manageSubscriptionsDesc')}
                            </div>
                            <button className="btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                {t('addPackage')}
                            </button>
                        </div>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                                <LoadingSpinner />
                            </div>
                        ) : (
                            <div className="subscription-grid">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="package-card">
                                        <div className="package-header">
                                            <div className="package-name">{pkg.package_name || pkg.packageName}</div>
                                            <div className="package-price">
                                                <span className="price-amount">{pkg.price}</span>
                                                <span className="price-currency">ETB</span>
                                            </div>
                                        </div>

                                        <div className="subscriber-count-badge">
                                            <span className="count-icon">👥</span>
                                            <span className="count-value">{pkg.subscriberCount || 0}</span>
                                            <span className="count-label">{t('subscribers')}</span>
                                        </div>

                                        <div className="package-description">
                                            {pkg.description}
                                        </div>
                                        <div className="package-features">
                                            <div className="feature-item">
                                                <span className="feature-icon">⏱️</span>
                                                {pkg.lengthOfSession} {t('minutes')} {t('perSession')}
                                            </div>
                                            <div className="feature-item">
                                                <span className="feature-icon">🔄</span>
                                                {pkg.numberOfSessions} {t('sessions')}
                                            </div>
                                            <div className="feature-item">
                                                <span className="feature-icon" style={{ opacity: pkg.historyAccess ? 1 : 0.3 }}>📜</span>
                                                <span style={{ opacity: pkg.historyAccess ? 1 : 0.5 }}>{t('historyAccess')}</span>
                                            </div>
                                            <div className="feature-item">
                                                <span className="feature-icon" style={{ opacity: pkg.apiAccess ? 1 : 0.3 }}>🔌</span>
                                                <span style={{ opacity: pkg.apiAccess ? 1 : 0.5 }}>{t('apiAccess')}</span>
                                            </div>
                                        </div>
                                        <div className="package-actions">
                                            <button className="btn-edit" onClick={() => handleEdit(pkg)}>
                                                <span>✏️</span> {t('edit')}
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDelete(pkg)}>
                                                <span>🗑️</span> {t('delete')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {packages.length === 0 && (
                                    <div className="empty-packages" style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                                        <h3>{t('noPackagesCreated')}</h3>
                                        <p>{t('getStartedPackage')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label>{t('packageName')}</label>
                                <input
                                    type="text"
                                    name="packageName"
                                    value={formData.packageName}
                                    onChange={handleInputChange}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('packagePrice')}</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>{t('packageDescription')}</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    required
                                    className="modal-input"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('lengthOfSession')} (min)</label>
                                <input
                                    type="number"
                                    name="lengthOfSession"
                                    value={formData.lengthOfSession}
                                    onChange={handleInputChange}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('numberOfSessions')}</label>
                                <input
                                    type="number"
                                    name="numberOfSessions"
                                    value={formData.numberOfSessions}
                                    onChange={handleInputChange}
                                    required
                                    className="modal-input"
                                />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    name="historyAccess"
                                    checked={formData.historyAccess === 1}
                                    onChange={handleInputChange}
                                    id="historyAccess"
                                />
                                <label htmlFor="historyAccess" style={{ marginBottom: 0 }}>{t('historyAccess')}</label>
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input
                                    type="checkbox"
                                    name="apiAccess"
                                    checked={formData.apiAccess === 1}
                                    onChange={handleInputChange}
                                    id="apiAccess"
                                />
                                <label htmlFor="apiAccess" style={{ marginBottom: 0 }}>{t('apiAccess')}</label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>
                                {t('cancel')}
                            </button>
                            <button type="submit" className="btn-primary" disabled={isSaving}>
                                {isSaving ? t('saving') : (editingPackage ? t('saveChanges') : t('create'))}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {confirmDeletePackage && (
                <ConfirmationModal
                    title={t('deletePackage')}
                    message={`${t('deletePackageConfirm')} (${confirmDeletePackage.package_name || confirmDeletePackage.packageName})`}
                    onConfirm={performDelete}
                    onCancel={() => setConfirmDeletePackage(null)}
                    confirmText={t('delete')}
                    type="danger"
                />
            )}
        </BaseModal>
    )
}

export default ManageSubscriptionsModal
