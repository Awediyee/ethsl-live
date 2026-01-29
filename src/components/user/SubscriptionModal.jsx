import { useState, useEffect } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import BaseModal from '../common/BaseModal'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import './SubscriptionModal.css'

function SubscriptionModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const [packages, setPackages] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentSubscription, setCurrentSubscription] = useState(null)
    const [isUpgrading, setIsUpgrading] = useState(null) // Stores packageId being upgraded

    useEffect(() => {
        const loadSubscriptionData = async () => {
            try {
                // 1. Fetch current status
                let statusData = null
                try {
                    statusData = await ApiService.getUserCurrentSubscription()
                } catch (statusError) {
                    // Check for 404 status or specific "No active subscription found" strings
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

                // 2. Fetch available packages from the main packages endpoint
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
        }
        loadSubscriptionData()
    }, [showToast, t])

    const isCurrentPlan = (pkg) => {
        if (!currentSubscription) return false
        return (pkg.packageName === currentSubscription.packageName) || (pkg.package_name === currentSubscription.packageName)
    }

    const handleUpgrade = async (pkgId) => {
        setIsUpgrading(pkgId)
        try {
            // Updated payload structure as per user requirement
            const payload = {
                packageId: pkgId,
                numberOfDays: 30,
                // returnURL is likely required as indicated by the validation error 'returnURL' object crash
                returnURL: window.location.origin + '/me'
            }

            const response = await ApiService.initializeSubscription(payload)

            // Log full response for debugging
            console.log('Upgrade response:', response)

            // Handling the specific nested response structure: data.data.checkout_url
            const checkoutUrl = response.data?.data?.checkout_url || response.checkoutURL

            if (checkoutUrl) {
                window.location.href = checkoutUrl
            } else if (response.status === 'success' || response.success) {
                showToast(t('packageUpdated') || 'Subscription started successfully', 'success')
                setTimeout(onClose, 1500)
            } else {
                showToast(t('packageError') || 'Upgrade initialization failed', 'error')
            }
        } catch (error) {
            console.error('Upgrade error:', error)

            // Extract a readable message, ensuring it's not an object (to avoid React child crash)
            let errorMsg = error.data?.message || error.message || t('packageError')

            if (typeof errorMsg === 'object') {
                // If it's a validation object like { returnURL: '...' }, stringify its first value or the whole thing
                errorMsg = JSON.stringify(errorMsg)
            }

            showToast(errorMsg, 'error')
        } finally {
            setIsUpgrading(null)
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
                        {/* Always show Free Plan as the default tier */}
                        {(() => {
                            // If no subscription found (null/404) or name is "Free", it's the current plan
                            const isFreeActive = !currentSubscription ||
                                currentSubscription.packageName === 'Free' ||
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
                                    <ul className="features-list">
                                        <li className="feature-tick">
                                            <span className="tick-icon">✓</span>
                                            {t('basicTranslation') || 'Basic Translation'}
                                        </li>
                                        <li className="feature-tick">
                                            <span className="tick-icon">✕</span>
                                            <span style={{ opacity: 0.6 }}>{t('noApiAccess') || 'No API Access'}</span>
                                        </li>
                                    </ul>
                                    <button className="upgrade-btn" disabled>
                                        {isFreeActive ? (t('currentPlan') || 'Current Plan') : (t('freeTier') || 'Free')}
                                    </button>
                                </div>
                            )
                        })()}

                        {/* Available Packages from Server (Filtering out duplicates) */}
                        {packages && packages
                            .filter(pkg => {
                                const name = (pkg.packageName || pkg.package_name || '').toLowerCase()
                                return name !== 'free' && name !== 'base'
                            })
                            .map((pkg, index) => {
                                const isCurrent = isCurrentPlan(pkg)
                                // We treat the first index in the filtered list as the "featured" plan if it's not the current one
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

                                        <ul className="features-list">
                                            <li className="feature-tick">
                                                <span className="tick-icon">✓</span>
                                                <strong>{pkg.numberOfSessions}</strong> {t('sessions') || 'Sessions'}
                                            </li>
                                            <li className="feature-tick">
                                                <span className="tick-icon">✓</span>
                                                <strong>{pkg.lengthOfSession}</strong> {t('minutesPerSession') || 'Min / Session'}
                                            </li>
                                            {pkg.historyAccess ? (
                                                <li className="feature-tick">
                                                    <span className="tick-icon">✓</span>
                                                    {t('historyAccess')}
                                                </li>
                                            ) : null}
                                            {pkg.apiAccess ? (
                                                <li className="feature-tick">
                                                    <span className="tick-icon">✓</span>
                                                    {t('apiAccess')}
                                                </li>
                                            ) : null}
                                        </ul>

                                        <button
                                            className="upgrade-btn"
                                            onClick={() => handleUpgrade(pkg.id)}
                                            disabled={isUpgrading !== null || isCurrent}
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
        </BaseModal>
    )
}

export default SubscriptionModal
