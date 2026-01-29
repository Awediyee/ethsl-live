import { useState, useEffect } from 'react'
import './ApiKeysModal.css'
import BaseModal from '../common/BaseModal'
import { useLanguage } from '../../contexts/LanguageContext'

function ApiKeysModal({ onClose }) {
    const { t } = useLanguage()

    // Initialize API keys from localStorage or use a default one
    const [apiKeys, setApiKeys] = useState(() => {
        const savedKeys = localStorage.getItem('ethsl_api_keys')
        if (savedKeys) {
            try {
                return JSON.parse(savedKeys)
            } catch (e) {
                console.error('Failed to parse saved API keys:', e)
            }
        }
        return [
            {
                id: 1,
                name: 'd',
                key: 'sk-ffe81**************************2080',
                created: '2026-01-22',
                lastUsed: '-'
            }
        ]
    })

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newKeyName, setNewKeyName] = useState('')
    const [createdKey, setCreatedKey] = useState(null)
    const [copyFeedback, setCopyFeedback] = useState(null)

    const [confirmDeleteId, setConfirmDeleteId] = useState(null)
    const [editingKey, setEditingKey] = useState(null)

    // Save to localStorage whenever apiKeys changes
    useEffect(() => {
        localStorage.setItem('ethsl_api_keys', JSON.stringify(apiKeys))
    }, [apiKeys])

    const handleDelete = () => {
        if (confirmDeleteId) {
            setApiKeys(apiKeys.filter(key => key.id !== confirmDeleteId))
            setConfirmDeleteId(null)
        }
    }

    const handleEditSave = (e) => {
        e.preventDefault()
        if (editingKey && editingKey.name.trim()) {
            setApiKeys(apiKeys.map(key =>
                key.id === editingKey.id ? { ...key, name: editingKey.name } : key
            ))
            setEditingKey(null)
        }
    }

    const handleCreateSubmit = (e) => {
        e.preventDefault()
        if (!newKeyName.trim()) return

        const actualKey = `sk-${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`

        const newKey = {
            id: Date.now(),
            name: newKeyName,
            key: `${actualKey.substring(0, 8)}**************************${actualKey.substring(actualKey.length - 4)}`,
            created: new Date().toISOString().split('T')[0],
            lastUsed: '-'
        }

        setApiKeys([...apiKeys, newKey])
        setCreatedKey(actualKey)
        setShowCreateForm(false)
        setNewKeyName('')
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
                {createdKey ? (
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
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                                    {t('cancelBtn')}
                                </button>
                                <button type="submit" className="submit-btn" disabled={!newKeyName.trim()}>
                                    {t('createBtn')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : confirmDeleteId ? (
                    <div className="key-action-view delete-confirm">
                        <h3 className="view-subtitle warning">{t('confirmDeleteTitle')}</h3>
                        <p className="view-desc">{t('confirmDeleteDesc')}</p>
                        <div className="form-actions">
                            <button className="cancel-btn" onClick={() => setConfirmDeleteId(null)}>
                                {t('cancelBtn')}
                            </button>
                            <button className="submit-btn danger" onClick={handleDelete}>
                                {t('delete')}
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
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setEditingKey(null)}>
                                    {t('cancelBtn')}
                                </button>
                                <button type="submit" className="submit-btn" disabled={!editingKey.name.trim()}>
                                    {t('saveBtn')}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <p className="api-keys-description">
                            {t('apiKeysDesc')} {t('apiKeysDeepSeekNote')}
                        </p>

                        <div className="api-keys-table-container">
                            <table className="api-keys-table">
                                <thead>
                                    <tr>
                                        <th>{t('apiKeyName')}</th>
                                        <th>{t('apiKeyKey')}</th>
                                        <th>{t('apiKeyCreated')}</th>
                                        <th>{t('apiKeyLastUsed')}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {apiKeys.length > 0 ? (
                                        apiKeys.map((key) => (
                                            <tr key={key.id}>
                                                <td>{key.name}</td>
                                                <td className="key-cell">
                                                    {key.key}
                                                    <button
                                                        className="copy-icon-btn"
                                                        onClick={() => handleCopy(key.key, key.id)}
                                                        title={t('copyKey')}
                                                    >
                                                        {copyFeedback === key.id ? '✓' : '📋'}
                                                    </button>
                                                </td>
                                                <td>{key.created}</td>
                                                <td>{key.lastUsed}</td>
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
                        </div>

                        <button className="create-api-key-btn" onClick={() => setShowCreateForm(true)}>
                            {t('createNewApiKey')}
                        </button>
                    </>
                )}
            </div>

            {copyFeedback && typeof copyFeedback === 'string' && copyFeedback !== 'created' && (
                <div className="toast-notification">
                    {t('apiKeyCopied')}
                </div>
            )}
        </BaseModal>
    )
}

export default ApiKeysModal
