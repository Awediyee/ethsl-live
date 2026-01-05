import { createContext, useContext, useState, useMemo } from 'react';

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
    // Feature Modals
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);

    // Detailed Modals (User Profile etc)
    const [activeModal, setActiveModal] = useState(null); // 'Settings', 'About', 'History', 'Api', 'Subscription', 'ChangePassword'

    const openFeedback = () => setShowFeedbackModal(true);

    const openModal = (modalName) => {
        setActiveModal(modalName);
    };

    const closeModal = (modalName) => {
        if (activeModal === modalName) setActiveModal(null);
    };

    const closeAll = () => {
        setShowFeedbackModal(false);
        setActiveModal(null);
    };

    const value = useMemo(() => ({
        state: {
            showFeedbackModal,
            activeModal
        },
        actions: {
            openFeedback,
            openModal,
            closeAll,
            setShowFeedbackModal,
            setActiveModal
        }
    }), [
        showFeedbackModal,
        activeModal
    ]);

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
