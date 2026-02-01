import React from 'react';
import './AdminHeader.css';
import logo from '../../assets/logo.png';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageToggle from '../user/LanguageToggle';
import ThemeToggle from '../user/ThemeToggle';

const AdminHeader = ({ user, onLogout }) => {
    const { t } = useLanguage();

    return (
        <header className="admin-header-nav">
            <div className="admin-header-left">
                <div className="admin-brand">
                    <img src={logo} alt="EthSLT Logo" className="admin-logo" />
                    <div className="admin-name-container">
                        <span className="admin-app-name">{t('appName')}</span>
                        <span className="admin-badge">{t('adminLabel') || 'ADMIN'}</span>
                    </div>
                </div>
            </div>

            <div className="admin-header-right">
                <div className="header-controls">
                    <LanguageToggle />
                    <ThemeToggle />
                </div>

                <div className="admin-profile-section">
                    <div className="admin-user-info">
                        <span className="admin-user-name">
                            {user?.firstName || user?.email?.split('@')[0]}
                        </span>
                        <span className="admin-user-role">{t('adminRole') || 'Administrator'}</span>
                    </div>
                    <button className="admin-logout-btn" onClick={onLogout} title={t('signOut')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
