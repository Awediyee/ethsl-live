import { useState, useEffect, useCallback } from 'react'
import './ApiKeysModal.css'
import BaseModal from '../common/BaseModal'
import LoadingSpinner from '../common/LoadingSpinner'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import { useModal } from '../../contexts/ModalContext'
import ApiService from '../../services/api'

function ApiKeysModal({ onClose }) {
    const { t } = useLanguage()
    const { showToast } = useToast()
    const { actions: modalActions } = useModal()

    const [apiKeys, setApiKeys] = useState([])
    const [loading, setLoading] = useState(true)
    const [isFree, setIsFree] = useState(false)
    const [pagination, setPagination] = useState({
        current_page: 1,
        total_page: 1,
        total: 0
    })

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [createdKey, setCreatedKey] = useState(null)
    const [copyFeedback, setCopyFeedback] = useState(null)

    const [confirmDeleteId, setConfirmDeleteId] = useState(null)
    const [editingKey, setEditingKey] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const loadApiKeys = useCallback(async (page = 1) => {
        try {
            setLoading(true)

            // Check subscription first
            const subRes = await ApiService.getUserCurrentSubscription()
            const subIsFree = !subRes || subRes.isFree ||
                (subRes.data?.package?.package_name || '').toLowerCase() === 'free' ||
                (subRes.data?.package?.packageName || '').toLowerCase() === 'free'

            if (subIsFree && subRes?.status !== 'error') {
                setIsFree(true)
                setLoading(false)
                return
            }

            const response = await ApiService.getApiKeys(12, page)
            if (response.status === 'success') {
                setApiKeys(response.data.data || [])
                setPagination({
                    current_page: response.data.current_page,
                    total_page: response.data.total_page,
                    total: response.data.total
                })
            }
        } catch (error) {
            console.error('Failed to load API keys:', error)
            showToast(t('failedToLoadKeys'), 'error')
        } finally {
            setLoading(false)
        }
    }, [t, showToast])

    useEffect(() => {
        loadApiKeys()
    }, [loadApiKeys])

    const handleDelete = async () => {
        if (confirmDeleteId) {
            setIsProcessing(true)
            try {
                await ApiService.deleteApiKey(confirmDeleteId)
                showToast(t('apiKeyDeleted'), 'success')
                loadApiKeys(pagination.current_page)
                setConfirmDeleteId(null)
            } catch (error) {
                showToast(error.message || t('deleteKeyError'), 'error')
            } finally {
                setIsProcessing(false)
            }
        }
    }

    const handleEditSave = async (e) => {
        e.preventDefault()
        if (editingKey && editingKey.name.trim()) {
            setIsProcessing(true)
            try {
                await ApiService.updateApiKey(editingKey.id, editingKey.name)
                showToast(t('apiKeyUpdated'), 'success')
                loadApiKeys(pagination.current_page)
                setEditingKey(null)
            } catch (error) {
                showToast(error.message || t('updateKeyError'), 'error')
            } finally {
                setIsProcessing(false)
            }
        }
    }

    const handleCreateSubmit = async (e) => {
        e.preventDefault()
        if (!newKeyName.trim()) return

        setIsProcessing(true)
        try {
            const response = await ApiService.createApiKey(newKeyName)
            if (response.status === 'success') {
                showToast(t('apiKeyCreated'), 'success')
                // The response might contain the actual clear token only once
                if (response.data && response.data.token) {
                    setCreatedKey(response.data.token)
                }
                loadApiKeys(1) // Go to first page to see new key
                setShowCreateForm(false)
                setNewKeyName('')
            }
        } catch (error) {
            showToast(error.message || t('createKeyError'), 'error')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleToggleStatus = async (id) => {
        try {
            await ApiService.toggleApiKeyStatus(id)
            showToast(t('statusUpdated'), 'success')
            loadApiKeys(pagination.current_page)
        } catch (error) {
            showToast(error.message || t('statusUpdateError'), 'error')
        }
    }

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyFeedback(id)
            setTimeout(() => setCopyFeedback(null), 2000)
        })
    }

    return (
        <BaseModal title={t('apiKeysTitle')} onClose={onClose}>
            <div className="api-keys-body">
                {isFree ? (
                    <div className="key-action-view" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
                        <h3 className="view-subtitle">{t('apiAccessDenied')}</h3>
                        <p className="view-desc">{t('apiKeysDesc')}</p>
                        <button
                            className="submit-btn"
                            style={{ marginTop: '20px', width: 'auto', padding: '12px 32px' }}
                            onClick={() => {
                                modalActions.setActiveModal('Subscription')
                            }}
                        >
                            {t('upgradeToPro')}
                        </button>
                    </div>
                ) : createdKey ? (
                    <div className="key-action-view">
                        <h3 className="view-subtitle">{t('newKeyCreatedTitle')}</h3>
                        <p className="view-desc">{t('newKeyCreatedDesc')}</p>
                        <div className="key-display-box">
                            <code className="secret-key">{createdKey}</code>
                            <button
                                className="copy-btn-large"
                                onClick={() => handleCopy(createdKey, 'created')}
                            >
                                {copyFeedback === 'created' ? '✓' : '📋'} {t('copyKey')}
                            </button>
                        </div>
                        <button className="done-btn" onClick={() => setCreatedKey(null)}>
                            {t('done')}
                        </button>
                    </div>
                ) : showCreateForm ? (
                    <div className="key-action-view">
                        <h3 className="view-subtitle">{t('createNewApiKey')}</h3>
                        <form onSubmit={handleCreateSubmit} className="action-form">
                            <div className="form-group">
                                <label htmlFor="keyName">{t('apiKeyName')}</label>
                                <input
                                    id="keyName"
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder={t('keyNamePlaceholder')}
                                    autoFocus
                                    required
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)} disabled={isProcessing}>
                                    {t('cancelBtn')}
                                </button>
                                <button type="submit" className="submit-btn" disabled={!newKeyName.trim() || isProcessing}>
                                    {isProcessing ? <LoadingSpinner size="small" /> : t('createBtn')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : confirmDeleteId ? (
                    <div className="key-action-view delete-confirm">
                        <h3 className="view-subtitle warning">{t('confirmDeleteTitle')}</h3>
                        <p className="view-desc">{t('confirmDeleteDesc')}</p>
                        <div className="form-actions">
                            <button className="cancel-btn" onClick={() => setConfirmDeleteId(null)} disabled={isProcessing}>
                                {t('cancelBtn')}
                            </button>
                            <button className="submit-btn danger" onClick={handleDelete} disabled={isProcessing}>
                                {isProcessing ? <LoadingSpinner size="small" /> : t('delete')}
                            </button>
                        </div>
                    </div>
                ) : editingKey ? (
                    <div className="key-action-view">
                        <h3 className="view-subtitle">{t('editKeyName')}</h3>
                        <form onSubmit={handleEditSave} className="action-form">
                            <div className="form-group">
                                <label htmlFor="editName">{t('apiKeyName')}</label>
                                <input
                                    id="editName"
                                    type="text"
                                    value={editingKey.name}
                                    onChange={(e) => setEditingKey({ ...editingKey, name: e.target.value })}
                                    autoFocus
                                    required
                                    disabled={isProcessing}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setEditingKey(null)} disabled={isProcessing}>
                                    {t('cancelBtn')}
                                </button>
                                <button type="submit" className="submit-btn" disabled={!editingKey.name.trim() || isProcessing}>
                                    {isProcessing ? <LoadingSpinner size="small" /> : t('saveBtn')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <p className="api-keys-description">
                            {t('apiKeysDesc')}
                        </p>

                        <div className="api-keys-table-container">
                            {loading ? (
                                <div className="loading-container" style={{ padding: '40px', textAlign: 'center' }}>
                                    <LoadingSpinner size="large" />
                                    <p style={{ marginTop: '10px' }}>{t('loading')}</p>
                                </div>
                            ) : (
                                <table className="api-keys-table">
                                    <thead>
                                        <tr>
                                            <th>{t('apiKeyName')}</th>
                                            <th>{t('apiKeyKey')}</th>
                                            <th>{t('status')}</th>
                                            <th>{t('apiKeyCreated')}</th>
                                            <th>{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {apiKeys.length > 0 ? (
                                            apiKeys.map((key) => (
                                                <tr key={key.id}>
                                                    <td>{key.name}</td>
                                                    <td className="key-cell">
                                                        <code>{key.token}</code>
                                                        <button
                                                            className="copy-icon-btn"
                                                            onClick={() => handleCopy(key.token, key.id)}
                                                            title={t('copyKey')}
                                                        >
                                                            {copyFeedback === key.id ? '✓' : '📋'}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`status-badge ${key.status === 'active' ? 'active' : 'inactive'}`}
                                                            onClick={() => handleToggleStatus(key.id)}
                                                            style={{ cursor: 'pointer' }}
                                                            title={t('toggleStatus')}
                                                        >
                                                            {key.status === 'active' ? t('activeLabel') : t('inactiveLabel')}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(key.created_at).toLocaleDateString()}</td>
                                                    <td className="actions-cell">
                                                        <button
                                                            className="action-icon-btn"
                                                            onClick={() => setEditingKey({ id: key.id, name: key.name })}
                                                            title={t('edit')}
                                                        >
                                                            <span className="icon">✎</span>
                                                        </button>
                                                        <button
                                                            className="action-icon-btn delete"
                                                            onClick={() => setConfirmDeleteId(key.id)}
                                                            title={t('delete')}
                                                        >
                                                            <span className="icon">🗑️</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="no-data">{t('noApiKeys')}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {pagination.total_page > 1 && (
                            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                                <button
                                    className="p-btn"
                                    disabled={pagination.current_page === 1}
                                    onClick={() => loadApiKeys(pagination.current_page - 1)}
                                >
                                    {t('prevPage')}
                                </button>
                                <span className="p-info">
                                    {t('pageOf').replace('{current}', pagination.current_page).replace('{total}', pagination.total_page)}
                                </span>
                                <button
                                    className="p-btn"
                                    disabled={pagination.current_page === pagination.total_page}
                                    onClick={() => loadApiKeys(pagination.current_page + 1)}
                                >
                                    {t('nextPage')}
                                </button>
                            </div>
                        )}

                        <div className="modal-footer-actions" style={{ marginTop: '20px' }}>
                            <button className="create-api-key-btn" onClick={() => setShowCreateForm(true)}>
                                {t('createNewApiKey')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </BaseModal>
    )
}

export default ApiKeysModal
