import Header from '../components/common/Header'
import TranslationArea from '../components/user/TranslationArea'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useModal } from '../contexts/ModalContext'

function HomePage() {
    const { isLoggedIn, user, logout } = useAuth()
    const { actions: modalActions } = useModal()
    const navigate = useNavigate()

    const isAdmin = user?.isAdmin || user?.role === 'admin' || false
    const userEmail = user?.email || ''

    return (
        <div className="home-page">
            <Header
                isLoggedIn={isLoggedIn}
                isAdmin={isAdmin}
                userEmail={userEmail}
                userData={user}
                onLoginClick={() => navigate('/login')}
                onLogout={logout}
                onSettingsClick={(modalName) => {
                    modalActions.setActiveModal(modalName)
                }}
            />
            <TranslationArea
                isLoggedIn={isLoggedIn}
                onFeedbackClick={modalActions.openFeedback}
            />
        </div>
    )
}

export default HomePage
