import { useState, useEffect } from 'react'
import BaseModal from '../common/BaseModal'
import ThemeToggle from './ThemeToggle'
import LanguageSelect from './LanguageSelect'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ApiService from '../../services/api'
import './SettingsModal.css'

function SettingsModal({ onClose, userData, activeTab: propsActiveTab, onChangePassword }) {
    const { t } = useLanguage();
    const { updateUser } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState(propsActiveTab || 'Profile');
    const [firstName, setFirstName] = useState(userData?.firstName || '')
    const [lastName, setLastName] = useState(userData?.lastName || '')
    const [email] = useState(userData?.email || '')
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchAccountInfo = async () => {
            try {
                const response = await ApiService.getAccountInfo();
                if (response && response.data) {
                    const { firstName, lastName } = response.data;
                    if (firstName) setFirstName(firstName);
                    if (lastName) setLastName(lastName);
                } else if (response) {
                    // Fallback if data is directly in response
                    const { firstName, lastName } = response;
                    if (firstName) setFirstName(firstName);
                    if (lastName) setLastName(lastName);
                }
            } catch (error) {
                console.error('Failed to fetch account info:', error);
            }
        };

        if (activeTab === 'Profile') {
            fetchAccountInfo();
        }
    }, [activeTab]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    }

    const handleSaveProfile = async (e) => {
        e.preventDefault();

        // Ensure token exists before trying to save
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast(t('sessionExpired') || 'Session expired, please login again', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const updateData = {};
            // Only add to updateData if the value is different from current user data
            if (firstName !== (userData?.firstName || '')) updateData.firstName = firstName;
            if (lastName !== (userData?.lastName || '')) updateData.lastName = lastName;

            if (Object.keys(updateData).length === 0) {
                showToast(t('noChanges') || 'No changes to save', 'info');
                setIsSaving(false);
                return;
            }

            console.log('Sending profile update (changed only):', updateData);
            await ApiService.updateAccountInfo(updateData);
            updateUser(updateData);
            showToast(t('profileUpdateSuccess'), 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = error.data?.message || t('profileUpdateError');
            showToast(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <BaseModal title={t('settings')} onClose={onClose} maxWidth="800px">
            <div className="settings-container">
                {/* Sidebar Navigation */}
                <div className="settings-sidebar">
                    {['Profile', 'General'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => handleTabClick(tab)}
                            className={`settings-nav-btn ${activeTab === tab ? 'active' : ''}`}
                            aria-label={t(tab.toLowerCase())}
                        >
                            <span className="settings-nav-icon">
                                {tab === 'Profile' ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                )}
                            </span>
                            {t(tab.toLowerCase())}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="settings-content">
                    {activeTab === 'Profile' && (
                        <div className="animate-fade-in">
                            <h3 className="settings-section-title">{t('profile')}</h3>

                            <form className="settings-form" onSubmit={handleSaveProfile}>
                                <div className="settings-input-group">
                                    <label>{t('firstName') || 'First Name'}</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder={t('firstName') || "First Name"}
                                    />
                                </div>
                                <div className="settings-input-group">
                                    <label>{t('lastName') || 'Last Name'}</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder={t('lastName') || "Last Name"}
                                    />
                                </div>
                                <div className="settings-input-group">
                                    <label>{t('email') || 'Email'}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="disabled-input"
                                    />
                                </div>
                                <div>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ padding: '10px 24px' }}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (t('saving') || 'Saving...') : (t('saveProfile') || 'Save Profile')}
                                    </button>
                                </div>
                            </form>

                            <hr className="settings-divider" />

                            <div className="settings-security-section">
                                <h4>{t('security') || 'Security'}</h4>
                                <button
                                    className="btn-secondary"
                                    onClick={() => {
                                        onClose();
                                        onChangePassword && onChangePassword();
                                    }}
                                >
                                    {t('changePassword')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'General' && (
                        <div className="animate-fade-in">
                            <h3 className="settings-section-title">{t('general')}</h3>
                            <div className="settings-form">
                                {/* Theme Setting */}
                                <div className="settings-row">
                                    <div className="settings-row-label">
                                        <span className="settings-label-text">{t('theme')}</span>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                {/* Language Setting */}
                                <div className="settings-row">
                                    <div className="settings-row-label">
                                        <span className="settings-label-text">{t('language')}</span>
                                    </div>
                                    <LanguageSelect />
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
