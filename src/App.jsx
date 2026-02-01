import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import './App.css'
// Pages
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
// Components
import ProtectedRoute from './components/common/ProtectedRoute'
import ViewReportsModal from './components/admin/ViewReportsModal'
import FeedbackModal from './components/user/FeedbackModal'
import SettingsModal from './components/user/SettingsModal'
import AdminConfigurationModal from './components/admin/AdminConfigurationModal'
import AddRoleModal from './components/admin/AddRoleModal'
import ManageUsersModal from './components/admin/ManageUsersModal'
import ManageRolesModal from './components/admin/ManageRolesModal'
import ManageAdminModal from './components/admin/ManageAdminModal'
import ActivityLogsModal from './components/admin/ActivityLogsModal'
import ManageSubscriptionsModal from './components/admin/ManageSubscriptionsModal'
import AboutModal from './components/user/AboutModal'
import HistoryModal from './components/user/HistoryModal'
import SubscriptionModal from './components/user/SubscriptionModal'
import ChangePasswordModal from './components/user/ChangePasswordModal'
import ForgotPasswordModal from './components/common/ForgotPasswordModal'
import ApiKeysModal from './components/user/ApiKeysModal'
import LoginPage from './pages/LoginPage'
import ApiService from './services/api' // Keep for direct util access if needed
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ModalProvider, useModal } from './contexts/ModalContext'
import { ToastProvider } from './contexts/ToastContext'
import { WebSocketProvider } from './contexts/WebSocketContext'

function AppContent() {
  const { isLoggedIn, user, loading, logout } = useAuth()
  const { state: modalState, actions: modalActions } = useModal()

  const {
    showFeedbackModal,
    activeModal
  } = modalState

  const handleFeedback = (feedback) => {
    modalActions.setShowFeedbackModal(false)
  }

  const [editingRole, setEditingRole] = useState(null)

  // Detect payment return (tx_ref) and auto-open subscription modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if ((params.has('tx_ref') || params.has('transactionid')) && isLoggedIn && !modalState.activeModal) {
      console.log('💳 Payment return detected, auto-opening subscription modal')
      modalActions.setActiveModal('Subscription')
    }
  }, [isLoggedIn, modalState.activeModal])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  const userEmail = user?.email || ''

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          !isLoggedIn ? (
            <Navigate to={`/login${window.location.search}`} replace />
          ) : user?.role !== 'user' ? (
            <Navigate to={`/admin${window.location.search}`} replace />
          ) : (
            <HomePage />
          )
        } />

        <Route element={<ProtectedRoute requiredRole="admin" redirectPath="/login" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to={`/${window.location.search}`} replace />} />
      </Routes>

      {showFeedbackModal && (
        <FeedbackModal
          onClose={() => modalActions.setShowFeedbackModal(false)}
          onSubmit={handleFeedback}
          userEmail={userEmail}
        />
      )}

      {activeModal === 'Settings' && (
        <SettingsModal
          onClose={() => modalActions.setActiveModal(null)}
          userData={user || { email: userEmail }}
          onChangePassword={() => modalActions.setActiveModal('ChangePassword')}
        />
      )}

      {activeModal === 'About' && (
        <AboutModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'History' && (
        <HistoryModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'Subscription' && (
        <SubscriptionModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'Api' && (
        <ApiKeysModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'ChangePassword' && (
        <ChangePasswordModal
          onClose={() => modalActions.setActiveModal(null)}
          userEmail={userEmail}
        />
      )}

      {activeModal === 'AdminSettings' && (
        <AdminConfigurationModal
          onClose={() => modalActions.setActiveModal(null)}
          onSave={(config) => {
            console.log('Admin config saved:', config)
            modalActions.setActiveModal(null)
          }}
          onLogout={logout}
        />
      )}

      {activeModal === 'AddRole' && (
        <AddRoleModal
          initialData={editingRole}
          onClose={() => {
            modalActions.setActiveModal('ManageRoles')
            setEditingRole(null)
          }}
          onSave={(role) => {
            console.log('Role saved:', role)
            modalActions.setActiveModal('ManageRoles')
            setEditingRole(null)
          }}
        />
      )}

      {activeModal === 'ManageRoles' && (
        <ManageRolesModal
          onClose={() => modalActions.setActiveModal(null)}
          onAddRole={() => {
            setEditingRole(null)
            modalActions.setActiveModal('AddRole')
          }}
          onEditRole={(role) => {
            setEditingRole(role)
            modalActions.setActiveModal('AddRole')
          }}
        />
      )}

      {activeModal === 'ManageUsers' && (
        <ManageUsersModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'ManageAdmin' && (
        <ManageAdminModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'ViewReports' && (
        <ViewReportsModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'ActivityLogs' && (
        <ActivityLogsModal onClose={() => modalActions.setActiveModal(null)} />
      )}

      {activeModal === 'ManageSubscriptions' && (
        <ManageSubscriptionsModal onClose={() => modalActions.setActiveModal(null)} />
      )}
    </div>
  )
}

const Router = BrowserRouter

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModalProvider>
          <ToastProvider>
            <WebSocketProvider>
              <AppContent />
            </WebSocketProvider>
          </ToastProvider>
        </ModalProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
