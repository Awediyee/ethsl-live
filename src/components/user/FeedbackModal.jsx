import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import BaseModal from '../common/BaseModal'

function FeedbackModal({ onClose, onSubmit, userEmail }) {
  const { t } = useLanguage()
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(feedback, rating)
  }

  return (
    <BaseModal title={t('sendFeedback')} onClose={onClose}>
      <div className="feedback-modal-body" style={{ padding: '0 10px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-primary)' }}>
              {t('feedbackLabel')}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder=""
              rows="6"
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
              {t('feedbackHint')}
            </small>
          </div>

          <div className="rating-group" style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
                style={{
                  fontSize: '32px',
                  color: rating >= star ? '#ffc107' : '#ddd',
                  cursor: 'pointer',
                  transition: 'color 0.3s'
                }}
              >
                ★
              </span>
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {t('send')}
          </button>
        </form>
      </div>
    </BaseModal>
  )
}

export default FeedbackModal
