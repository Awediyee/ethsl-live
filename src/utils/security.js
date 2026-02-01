
class SecurityUtils {
    /**
     * Sanitize user input by stripping HTML tags to prevent XSS.
     * @param {string} text - The raw input text
     * @returns {string} - The sanitized text
     */
    static sanitizeInput(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/<[^>]*>?/gm, '') // Strip HTML tags
            .trim();
    }

    /**
     * Validate email format using a strict regex.
     * @param {string} email - The email address to validate
     * @returns {boolean} - True if valid
     */
    static isValidEmail(email) {
        if (!email) return false;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL and prevent malicious schemes like javascript:
     * @param {string} url - The URL to validate
     * @returns {boolean} - True if safe
     */
    static isSafeUrl(url) {
        if (!url) return false;
        try {
            const parsed = new URL(url);
            return ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol);
        } catch (e) {
            // If it's not a full URL, ensure it doesn't start with dangerous prefixes
            const dangerousValues = ['javascript:', 'data:', 'vbscript:'];
            const lowerUrl = url.toLowerCase().trim();
            return !dangerousValues.some(val => lowerUrl.startsWith(val));
        }
    }
    /**
     * Escape special characters for safe use in regex
     */
    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

export default SecurityUtils;
