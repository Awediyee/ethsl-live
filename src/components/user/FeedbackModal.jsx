import { useState } from 'react'
import '../common/Modal.css'

function FeedbackModal({ onClose, onSubmit }) {
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState(0)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(feedback, rating)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content feedback-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Send feedback to Dev</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Describe your feedback (required)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder=""
              rows="6"
              required
            />
            <small className="form-hint">Please don't include any sensitive information</small>
          </div>
          
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
          
          <button type="submit" className="btn-primary btn-full">Send</button>
        </form>
      </div>
    </div>
  )
}

export default FeedbackModal
