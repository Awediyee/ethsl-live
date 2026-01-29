import React, { useState, useRef, useEffect } from 'react';
import './LanguageSelect.css';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSelect = () => {
    const { language, changeLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'am', name: 'አማርኛ', flag: '🇪🇹' }
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        changeLanguage(code);
        setIsOpen(false);
    };

    return (
        <div className="language-select-container" ref={dropdownRef}>
            <button
                className={`language-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <span className="lang-flag">{currentLang.flag}</span>
                <span className="lang-name">{currentLang.name}</span>
                <span className={`chevron ${isOpen ? 'open' : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="language-select-dropdown">
                    {languages.map((lang) => (
                        <div
                            key={lang.code}
                            className={`language-option ${language === lang.code ? 'selected' : ''}`}
                            onClick={() => handleSelect(lang.code)}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-name">{lang.name}</span>
                            {language === lang.code && (
                                <span className="check-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelect;
