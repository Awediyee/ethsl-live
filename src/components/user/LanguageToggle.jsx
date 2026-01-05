import { useLanguage } from '../../contexts/LanguageContext'
import './LanguageToggle.css'

function LanguageToggle() {
    const { language, changeLanguage } = useLanguage()

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'am' : 'en'
        changeLanguage(newLang)
    }

    return (
        <button
            className="language-toggle"
            onClick={toggleLanguage}
            title={language === 'en' ? 'Switch to Amharic' : 'Switch to English'}
        >
            <span className="language-text">
                {language === 'en' ? 'EN' : 'አማ'}
            </span>
        </button>
    )
}

export default LanguageToggle
