import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import BaseModal from '../common/BaseModal'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import ConfirmationModal from '../common/ConfirmationModal'
import PaymentStatusModal from './PaymentStatusModal'
import './SubscriptionModal.css'

function SubscriptionModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentSubscription, setCurrentSubscription] = useState(null)
    const [isUpgrading, setIsUpgrading] = useState(null) // Stores packageId being upgraded
    const [isCancelling, setIsCancelling] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [txRef, setTxRef] = useState(() => {
        const params = new URLSearchParams(window.location.search)
        return params.get('transactionid') || params.get('tx_ref')
    })
    const isInitialized = useRef(false)

    const loadSubscriptionData = useCallback(async () => {
        try {
            setLoading(true)
            // 1. Fetch current status
            let statusData = null
            try {
                const response = await ApiService.getUserCurrentSubscription()
                if (response?.data?.package) {
                    statusData = {
                        ...response.data,
                        packageName: response.data.package.package_name || response.data.package.packageName,
                        isFree: false
                    }
                } else {
                    statusData = response
                }
            } catch (statusError) {
                const isNotFound = statusError.status === 404 ||
                    statusError.message?.includes('No active subscription found') ||
                    statusError.message?.includes('This resource does not exist')

                if (isNotFound) {
                    console.log('ℹ️ Treating 404/Not Found as Free tier status')
                    statusData = { packageName: 'Free', isFree: true }
                } else {
                    throw statusError
                }
            }
            setCurrentSubscription(statusData)

            // 2. Fetch available packages
            const packagesResponse = await ApiService.getSubscriptionPackages()
            const data = packagesResponse.data || packagesResponse || []
            setPackages(Array.isArray(data) ? data : [])

        } catch (error) {
            console.error('❌ Error loading subscription data:', error)
            const apiErrorMsg = error.data?.message || error.message || t('packageError')
            showToast(apiErrorMsg, 'error')
        } finally {
            setLoading(false)
        }
    }, [t, showToast])

    useEffect(() => {
        if (isInitialized.current) return
        isInitialized.current = true
        loadSubscriptionData()

        // Check if there's a pending transaction from a previous payment
        const pendingTxId = localStorage.getItem('pendingTransactionId')
        if (pendingTxId) {
            console.log('🔍 Found pending transaction ID from localStorage:', pendingTxId)
            localStorage.removeItem('pendingTransactionId')
            setTxRef(pendingTxId)
        }
    }, [loadSubscriptionData])

    const handleClearTxRef = () => {
        setTxRef(null)
        const newUrl = window.location.pathname + window.location.search
            .replace(/[?&]tx_ref=[^&]+/, '')
            .replace(/[?&]transactionid=[^&]+/, '')
            .replace(/^&/, '?')
        window.history.replaceState({}, '', newUrl)
    }

    const isCurrentPlan = (pkg) => {
        if (!currentSubscription) return false
        const currentName = (currentSubscription.packageName || currentSubscription.package_name || '').toLowerCase()
        const pkgName = (pkg.packageName || pkg.package_name || '').toLowerCase()
        return currentName !== '' && pkgName !== '' && currentName === pkgName
    }

    const handleUpgrade = async (pkgId) => {
        setIsUpgrading(pkgId)
        try {
            const payload = {
                packageId: pkgId,
                numberOfDays: 30,
                returnURL: window.location.origin
            }

            const response = await ApiService.initializeSubscription(payload)
            console.log('🔍 Upgrade response:', response)

            const checkoutUrl = response.data?.data?.checkout_url || response.data?.checkout_url || response.checkoutURL
            const transactionId =
                response.data?.transactionId ||
                response.transactionId ||
                response.data?.data?.transactionId ||
                response.data?.id ||
                response.data?.tx_ref

            if (checkoutUrl) {
                console.log('🌐 Redirecting to checkout URL:', checkoutUrl)
                if (transactionId) {
                    localStorage.setItem('pendingTransactionId', transactionId)
                }
                window.location.href = checkoutUrl;
                return;
            } else if (transactionId) {
                console.log('💎 Starting immediate verification:', transactionId)
                setTxRef(transactionId)
            } else if (response.status === 'success' || response.success) {
                showToast(t('packageUpdated') || 'Subscription started successfully', 'success')
                setTimeout(onClose, 1500)
            } else {
                showToast(t('packageError') || 'Upgrade initialization failed', 'error')
            }
        } catch (error) {
            console.error('Upgrade error:', error)
            let errorMsg = error.data?.message || error.message || t('packageError')
            if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg)
            showToast(errorMsg, 'error')
        } finally {
            setIsUpgrading(null)
        }
    }

    const handleCancelSubscription = async () => {
        setShowCancelConfirm(false)
        setIsCancelling(true)
        try {
            await ApiService.cancelSubscription()
            showToast(t('subscriptionCancelled') || 'Subscription cancelled successfully', 'success')
            await loadSubscriptionData()
        } catch (error) {
            console.error('Cancellation error:', error)
            const errorMsg = error.data?.message || error.message || t('packageError')
            showToast(errorMsg, 'error')
        } finally {
            setIsCancelling(false)
        }
    }

    return (
        <BaseModal title={t('subscriptionTitle') || "Choose Your Plan"} onClose={onClose} maxWidth="1200px">
            <div className="subscription-container">
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                        <LoadingSpinner size="large" />
                        <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('loadingPlans') || 'Loading the best plans for you...'}</p>
                    </div>
                ) : (
                    <div className="subscription-grid">
                        {/* Always show Free Plan */}
                        {(() => {
                            const isFreeActive = !currentSubscription ||
                                (currentSubscription.packageName || '').toLowerCase() === 'free' ||
                                (currentSubscription.package_name || '').toLowerCase() === 'free' ||
                                currentSubscription.isFree

                            return (
                                <div className={`subscription-card ${isFreeActive ? 'current' : ''}`}>
                                    {isFreeActive && <div className="badge-featured" style={{ background: '#10b981' }}>{t('active') || 'Active'}</div>}
                                    <div className="card-header">
                                        <h3 className="package-title">{t('freeTier') || 'Free'}</h3>
                                        <div className="package-price">
                                            <span className="price-val">0</span>
                                            <span className="price-unit">ETB/mo</span>
                                        </div>
                                    </div>
                                    <p className="package-desc">{t('freeDesc') || 'Get started with basic Amharic sign language translation features.'}</p>
                                    <div className="features-container">
                                        <div className="features-label">{t('features') || 'Included Features'}</div>
                                        <ul className="features-list">
                                            <li className="feature-tick">
                                                <div className="tick-icon">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                </div>
                                                {t('basicTranslation') || 'Basic Translation'}
                                            </li>
                                            <li className="feature-tick disabled">
                                                <div className="tick-icon close">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                </div>
                                                <span style={{ opacity: 0.6 }}>{t('noApiAccess') || 'No API Access'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <button className="upgrade-btn" disabled>
                                        {isFreeActive ? (t('currentPlan') || 'Current Plan') : (t('freeTier') || 'Free')}
                                    </button>
                                </div>
                            )
                        })()}

                        {/* Available Packages */}
                        {packages && packages
                            .filter(pkg => {
                                const name = (pkg.packageName || pkg.package_name || '').toLowerCase()
                                return name !== 'free' && name !== 'base' && name !== 'free_plan'
                            })
                            .map((pkg, index) => {
                                const isCurrent = isCurrentPlan(pkg)
                                const isFeatured = index === 0 && !isCurrent

                                return (
                                    <div key={pkg.id || index} className={`subscription-card ${isFeatured ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}>
                                        {isFeatured && <div className="badge-featured">{t('mostPopular') || 'Popular'}</div>}
                                        {isCurrent && <div className="badge-featured" style={{ background: '#10b981' }}>{t('active') || 'Active'}</div>}

                                        <div className="card-header">
                                            <h3 className="package-title">{pkg.packageName || pkg.package_name}</h3>
                                            <div className="package-price">
                                                <span className="price-val">{pkg.price}</span>
                                                <span className="price-unit">ETB/mo</span>
                                            </div>
                                        </div>

                                        <p className="package-desc">{pkg.description}</p>

                                        <div className="features-container">
                                            <div className="features-label">{t('features') || 'Included Features'}</div>
                                            <ul className="features-list">
                                                <li className="feature-tick">
                                                    <div className="tick-icon">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                    <span><strong>{pkg.numberOfSessions}</strong> {t('sessions') || 'Sessions'}</span>
                                                </li>
                                                <li className="feature-tick">
                                                    <div className="tick-icon">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    </div>
                                                    <span><strong>{pkg.lengthOfSession}</strong> {t('minutesPerSession') || 'Min / Session'}</span>
                                                </li>
                                                {pkg.historyAccess && (
                                                    <li className="feature-tick">
                                                        <div className="tick-icon">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </div>
                                                        {t('historyAccess')}
                                                    </li>
                                                )}
                                                {pkg.apiAccess && (
                                                    <li className="feature-tick">
                                                        <div className="tick-icon">
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </div>
                                                        {t('apiAccess')}
                                                    </li>
                                                )}
                                            </ul>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                            <button
                                                className="upgrade-btn"
                                                onClick={() => handleUpgrade(pkg.id)}
                                                disabled={isUpgrading !== null || isCancelling || isCurrent}
                                            >
                                                {isUpgrading === pkg.id ? (
                                                    <LoadingSpinner size="small" />
                                                ) : isCurrent ? (
                                                    t('currentPlan') || 'Current Plan'
                                                ) : (
                                                    <>
                                                        <span>🚀</span> {t('upgradeNow') || 'Upgrade Now'}
                                                    </>
                                                )}
                                            </button>

                                            {isCurrent && (
                                                <button
                                                    className="upgrade-btn cancel-btn"
                                                    onClick={() => setShowCancelConfirm(true)}
                                                    disabled={isCancelling || isUpgrading !== null}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid #ef4444',
                                                        color: '#ef4444',
                                                        marginTop: '4px'
                                                    }}
                                                >
                                                    {isCancelling ? <LoadingSpinner size="small" /> : (t('cancelSubscription') || 'Cancel Subscription')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                        {!loading && packages.length === 0 && !currentSubscription?.isFree && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🎐</div>
                                <h3 style={{ color: 'var(--text-primary)' }}>{t('noPlans') || 'No plans available'}</h3>
                                <p>{t('checkBackLater') || 'Please check back later for new subscription offerings.'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {txRef && (
                <PaymentStatusModal
                    txRef={txRef}
                    onClose={handleClearTxRef}
                    onRefresh={loadSubscriptionData}
                />
            )}

            {showCancelConfirm && (
                <ConfirmationModal
                    title={t('cancelSubscription') || "Cancel Subscription"}
                    message={t('cancelConfirm') || "Are you sure you want to cancel your current subscription?"}
                    onConfirm={handleCancelSubscription}
                    onCancel={() => setShowCancelConfirm(false)}
                    confirmText={t('confirm') || "Yes, Cancel"}
                    cancelText={t('back') || "No, Keep It"}
                    type="danger"
                    isLoading={isCancelling}
                />
            )}
        </BaseModal>
    )
}

export default SubscriptionModal
