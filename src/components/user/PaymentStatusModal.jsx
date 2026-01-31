import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'
import './PaymentStatusModal.css'

function PaymentStatusModal({ txRef, onClose, onRefresh }) {
    const { t } = useLanguage()
    const [status, setStatus] = useState('verifying') // verifying, success, error
    const [message, setMessage] = useState('')

    const hasVerified = useRef(false)
    const verificationRef = useRef(null)

    useEffect(() => {
        console.log('💳 PaymentStatusModal mounted with txRef:', txRef)

        const verifyPayment = async () => {
            if (hasVerified.current && verificationRef.current === txRef) {
                console.log('⏭️ Already verified or verifying this transactionId, skipping.')
                return
            }
            hasVerified.current = true
            verificationRef.current = txRef

            try {
                console.log('🔍 Starting payment verification for txRef:', txRef)
                const response = await ApiService.checkPaymentStatus(txRef)
                console.log('✅ Payment verification response:', response)

                // Assuming status 1 means success as per sample JSON
                if (response?.data?.status === 1 || response?.status === 'success') {
                    console.log('🎉 Payment verified successfully!')
                    setStatus('success')
                    setMessage(response?.message || t('paymentSuccess') || 'Payment status respond successfully.')

                    // Automatically trigger a data refresh in the parent if provided
                    if (onRefresh) {
                        setTimeout(onRefresh, 1000)
                    }
                } else {
                    console.log('❌ Payment verification failed - status not 1')
                    setStatus('error')
                    setMessage(t('paymentFailed') || 'Verification failed. Please contact support.')
                }
            } catch (error) {
                console.error('❌ Payment verification error:', error)
                setStatus('error')
                setMessage(error.data?.message || error.message || t('paymentError') || 'An error occurred during verification.')
            }
        }

        if (txRef) {
            verifyPayment()
        } else {
            console.warn('⚠️ PaymentStatusModal mounted but no txRef provided')
        }
    }, [txRef, t, onRefresh])

    const renderContent = () => {
        switch (status) {
            case 'verifying':
                return (
                    <div className="status-container verifying">
                        <LoadingSpinner size="large" />
                        <h3>{t('verifyingPayment') || 'Verifying Your Payment...'}</h3>
                        <p>{t('donotClose') || 'Please stay on this page while we confirm your transaction.'}</p>
                    </div>
                )
            case 'success':
                return (
                    <div className="status-container success">
                        <div className="status-icon success-icon">🎉</div>
                        <h3 style={{ color: '#10b981', fontSize: '28px' }}>
                            {t('paymentSuccessful') || 'Payment Successful!'}
                        </h3>
                        <p className="status-message" style={{ fontSize: '18px', fontWeight: '600' }}>
                            {t('congratulations') || 'Congratulations! Your payment has been confirmed.'}
                        </p>
                        <p className="status-sub">
                            {t('planUpgraded') || 'Your subscription plan has been upgraded successfully.'}
                        </p>
                        <div style={{
                            background: '#d1fae5',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginTop: '16px',
                            border: '1px solid #10b981'
                        }}>
                            <p style={{ margin: 0, color: '#065f46', fontSize: '14px', fontWeight: '500' }}>
                                ✓ {t('transactionComplete') || 'Transaction completed successfully'}
                            </p>
                        </div>
                        <button className="status-btn success" onClick={onClose}>
                            {t('getStarted') || 'Get Started'} →
                        </button>
                    </div>
                )
            case 'error':
                return (
                    <div className="status-container error">
                        <div className="status-icon error-icon">⚠️</div>
                        <h3 style={{ color: '#ef4444', fontSize: '28px' }}>
                            {t('paymentFailed') || 'Payment Failed'}
                        </h3>
                        <p className="status-message" style={{ fontSize: '18px', fontWeight: '600' }}>
                            {t('paymentNotCompleted') || 'Your payment could not be completed.'}
                        </p>
                        <div style={{
                            background: '#fee2e2',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            marginTop: '16px',
                            border: '1px solid #ef4444'
                        }}>
                            <p style={{ margin: 0, color: '#991b1b', fontSize: '14px', fontWeight: '500' }}>
                                {message || t('contactSupport') || 'Please try again or contact support.'}
                            </p>
                        </div>
                        <div className="status-actions">
                            <button className="status-btn error-btn" onClick={onClose}>
                                {t('close') || 'Close'}
                            </button>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="payment-status-overlay">
            <div className={`payment-status-content ${status}`}>
                {renderContent()}
            </div>
        </div>
    )
}

export default PaymentStatusModal
