import './Footer.css'
import { useLanguage } from '../../contexts/LanguageContext'

function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="footer">
      <p>{t('copyright')}</p>
    </footer>
  )
}

export default Footer
