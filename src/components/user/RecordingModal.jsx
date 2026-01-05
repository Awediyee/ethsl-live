import { useState, useRef, useEffect } from 'react'
import './RecordingModal.css'

function RecordingModal({ onClose, onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    startWebcam()
    return () => {
      stopWebcam()
    }
  }, [])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing webcam:', error)
      alert('Unable to access webcam. Please grant camera permissions.')
      onClose()
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const startRecording = () => {
    if (!streamRef.current) return

    const mediaRecorder = new MediaRecorder(streamRef.current)
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      onRecordingComplete(blob)
      stopWebcam()
      onClose()
    }

    mediaRecorder.start()
    setIsRecording(true)
    setRecordingTime(0)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="recording-modal-overlay" onClick={onClose}>
      <div className="recording-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="recording-modal-close" onClick={onClose}>✕</button>
        
        <h2 className="recording-modal-title">Record Sign Language</h2>
        
        <div className="video-preview-container">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            muted
            className="preview-video"
          />
          {isRecording && (
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              <span className="recording-time">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        <div className="recording-controls">
          {!isRecording ? (
            <button className="btn-record" onClick={startRecording}>
              <span className="record-icon">●</span> Start Recording
            </button>
          ) : (
            <button className="btn-stop" onClick={stopRecording}>
              <span className="stop-icon">■</span> Stop Recording
            </button>
          )}
        </div>

        <p className="recording-hint">Position yourself so your hands and face are visible</p>
      </div>
    </div>
  )
}

export default RecordingModal
