import { useState } from 'react'
import './Header.css'
import UserMenu from '../user/UserMenu'

import { useLanguage } from '../../contexts/LanguageContext'

function Header({ isLoggedIn, isAdmin, onLoginClick, userEmail, userData, onLogout, onSettingsClick }) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { t } = useLanguage()

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <span className="header-logo">✋</span>
          <h1 className="header-title">{t('appName')}</h1>
        </div>
        <div className="header-actions">
          <button
            className="menu-button"
            onClick={() => {
              if (!isLoggedIn) {
                onLoginClick()
              } else {
                setShowUserMenu(!showUserMenu)
              }
            }}
          >
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>
      </div>

      {showUserMenu && isLoggedIn && (
        <UserMenu
          onClose={() => setShowUserMenu(false)}
          user={userData || { email: userEmail }}
          onLogout={onLogout}
          onSettingsClick={onSettingsClick}
        />
      )}
    </header>
  )
}

export default Header
