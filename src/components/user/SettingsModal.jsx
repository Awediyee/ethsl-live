import { useState } from 'react'
import BaseModal from '../common/BaseModal'
import ThemeToggle from './ThemeToggle'
import { useLanguage } from '../../contexts/LanguageContext'
import ApiService from '../../services/api'

function SettingsModal({ onClose, userData, activeTab: initialTab, onChangePassword }) {
    const { t, language, changeLanguage } = useLanguage();
    const [activeTab, setActiveTab] = useState(initialTab || 'Profile');
    const [name, setName] = useState(userData?.name || '')
    const [email] = useState(userData?.email || '')

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    }

    return (
        <BaseModal title={t('settings')} onClose={onClose}>
            <div style={{ display: 'flex', gap: '20px', height: '100%' }}>
                {/* Simple Sidebar for Settings Sub-sections */}
                <div style={{ width: '150px', borderRight: '1px solid var(--border-color)', paddingRight: '10px' }}>
                    {['Profile', 'General'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px',
                                background: activeTab === tab ? 'var(--shadow-color)' : 'transparent',
                                border: 'none',
                                color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                marginBottom: '5px'
                            }}
                        >
                            {t(tab.toLowerCase())}
                        </button>
                    ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {activeTab === 'Profile' && (
                        <div>
                            <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>{t('profile')}</h3>

                            {/* User Info Form */}
                            <form onSubmit={e => e.preventDefault()}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-secondary)',
                                            opacity: 0.7
                                        }}
                                    />
                                </div>
                                <button style={{
                                    padding: '8px 16px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginBottom: '20px'
                                }}>Save Profile</button>
                            </form>

                            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

                            {/* Change Password Section */}
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Security</h4>
                                <button
                                    onClick={() => {
                                        onClose();
                                        onChangePassword && onChangePassword();
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: '1px solid var(--primary-color)',
                                        color: 'var(--primary-color)',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t('changePassword')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'General' && (
                        <div>
                            <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>{t('general')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Theme Setting */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                                    <span>{t('theme')}</span>
                                    <ThemeToggle />
                                </div>

                                {/* Language Setting */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                                    <span>{t('language')}</span>
                                    <select
                                        value={language}
                                        onChange={(e) => changeLanguage(e.target.value)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="en">English</option>
                                        <option value="am">አማርኛ (Amharic)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    )
}

export default SettingsModal
