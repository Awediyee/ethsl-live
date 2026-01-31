import { useState, useRef, useEffect } from 'react'
import './TranslationArea.css'
import './TranslationAreaExtras.css'
import { useLanguage } from '../../contexts/LanguageContext'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../common/LoadingSpinner'
import MediaPipeCamera from './MediaPipeCamera'
import { useSignLanguageManager } from '../../hooks/useSignLanguageManager'

function TranslationArea({ onFeedbackClick }) {
  const { t } = useLanguage()
  const { showToast } = useToast()

  // UI State
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [translation, setTranslation] = useState('')
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [uploadedVideoFile, setUploadedVideoFile] = useState(null)
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadedVideoMode, setIsUploadedVideoMode] = useState(false)
  const [isUploadedVideoPaused, setIsUploadedVideoPaused] = useState(false)

  // Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const fileInputRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const uploadedVideoRef = useRef(null)

  // Sign Language Manager Hook
  const {
    state: {
      wsUrl,
      setWsUrl,
      wsConnected,
      setWsConnected,
      connectionStatus,
      mediaPipeInitialized,
      fps,
      currentPrediction
    },
    actions: {
      handleConnect,
      handleDisconnect,
      ensureInitialized,
      startProcessing,
      stopProcessing,
      processVideoFile
    }
  } = useSignLanguageManager(videoRef, canvasRef, setTranslation)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  // Recording Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
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
  }, [isRecording, isPaused])

  // Camera stream attachment
  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => console.error('Error playing video:', err))
    }
  }, [showCamera])

  // Load Voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`))
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      streamRef.current = stream
      setShowCamera(true)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing webcam:', error)
      showToast(t('cameraPermissionError') || 'Unable to access webcam. Please grant camera permissions.', 'error')
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) return

    // Initialize MediaPipe if not already done
    const success = await ensureInitialized()
    if (!success) {
      showToast(t('mediapipeInitError') || 'Failed to initialize MediaPipe. Please refresh and try again.', 'error')
      return
    }

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
      setRecordedVideo(blob)
      stopProcessing()
    }

    mediaRecorder.start()
    setIsRecording(true)
    setRecordingTime(0)
    setTranslation('')

    // Start MediaPipe processing
    startProcessing()
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      stopProcessing()
    }

    // Close camera and return to initial state
    stopWebcam()
    setShowCamera(false)
    setRecordedVideo(null)
  }

  const closeWebcam = () => {
    // Stop webcam without recording
    stopWebcam()
    setShowCamera(false)
    setRecordedVideo(null)
    stopProcessing()
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      stopProcessing()
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      startProcessing()
    }
  }

  const backToLiveRecording = () => {
    // Clear uploaded video state
    setUploadedVideoFile(null)
    setRecordedVideo(null)
    setIsUploadedVideoMode(false)
    setIsUploadedVideoPaused(false)
    setShowCamera(false)
    setTranslation('')

    // Stop any video playback
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
      videoRef.current.srcObject = null
    }

    // Stop processing
    stopProcessing()
  }

  const pauseUploadedVideo = () => {
    if (videoRef.current && isUploadedVideoMode) {
      videoRef.current.pause()
      setIsUploadedVideoPaused(true)
      stopProcessing()
    }
  }

  const resumeUploadedVideo = () => {
    if (videoRef.current && isUploadedVideoMode) {
      videoRef.current.play()
      setIsUploadedVideoPaused(false)
      startProcessing()
    }
  }

  const stopUploadedVideo = () => {
    // Stop video playback and return to initial state
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
    }

    setUploadedVideoFile(null)
    setRecordedVideo(null)
    setIsUploadedVideoMode(false)
    setIsUploadedVideoPaused(false)
    setShowCamera(false)
    setTranslation('')
    stopProcessing()
  }

  // WebSocket Handlers Wrapper
  const onConnect = () => {
    handleConnect()
  }

  const handlePlusClick = async () => {
    await startWebcam()
    // Don't auto-start recording - let user decide
    // This allows them to close webcam if they don't want to record
  }

  const handleVideoUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setUploadedVideoFile(file)
      const videoURL = URL.createObjectURL(file)
      setRecordedVideo(file)
      setShowCamera(true)
      setIsUploadedVideoMode(true)
      setIsProcessingUpload(true)
      setTranslation('')
      setUploadProgress(0)

      // Initialize MediaPipe if not already done
      const initialized = await ensureInitialized()
      if (!initialized) {
        showToast(t('mediapipeInitError') || 'Failed to initialize MediaPipe. Please refresh and try again.', 'error')
        setIsProcessingUpload(false)
        return
      }

      // Create video element for processing
      const videoElement = document.createElement('video')
      videoElement.src = videoURL
      videoElement.muted = true
      videoElement.loop = false
      uploadedVideoRef.current = videoElement

      // Wait for video to load metadata
      videoElement.onloadedmetadata = async () => {
        // Display the video in the video ref
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = videoURL
          videoRef.current.loop = true
          videoRef.current.play()
        }

        // Start processing
        startProcessing()
        await processVideoFile(videoElement, (progress) => {
          setUploadProgress(progress)
        })

        setIsProcessingUpload(false)
        // Keep the video playing in loop for display
        if (videoRef.current) {
          videoRef.current.currentTime = 0
          videoRef.current.play()
        }
      }
    } else {
      showToast('Please select a valid video file', 'error')
    }
  }



  const speakText = async () => {
    if (!translation || translation === t('translationPlaceholder') || translation === t('translating') || translation === t('videoRecorded')) {
      return
    }

    console.log('Speaking Amharic text:', translation)
    setIsSpeaking(true)

    try {
      // Use multiple TTS services with Amharic support

      // Try Google Cloud TTS via public endpoint (best Amharic quality)
      const audioUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw`

      const response = await fetch(audioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: translation },
          voice: {
            languageCode: 'am-ET',
            name: 'am-ET-Standard-A',
            ssmlGender: 'FEMALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 0.9
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const audioContent = data.audioContent

        // Convert base64 to audio
        const audioBlob = base64ToBlob(audioContent, 'audio/mp3')
        const audioUrl = URL.createObjectURL(audioBlob)
        const audio = new Audio(audioUrl)

        audio.onplay = () => {
          console.log('Playing Amharic audio with natural tone')
          setIsSpeaking(true)
        }

        audio.onended = () => {
          console.log('Audio playback completed')
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
        }

        audio.onerror = (error) => {
          console.error('Audio playback error:', error)
          setIsSpeaking(false)
          fallbackToWebSpeech()
        }

        await audio.play()
      } else {
        throw new Error('TTS API request failed')
      }
    } catch (error) {
      console.error('Error with Google TTS:', error)
      setIsSpeaking(false)
      fallbackToWebSpeech()
    }
  }

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  const fallbackToWebSpeech = () => {
    console.log('Falling back to Web Speech API')

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(translation)

      // Get all available voices
      const voices = window.speechSynthesis.getVoices()

      // Try to find Amharic voice
      let selectedVoice = voices.find(voice => voice.lang.startsWith('am'))

      if (!selectedVoice) {
        // Try to find any voice that might work
        selectedVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('google') ||
          voice.name.toLowerCase().includes('microsoft')
        )
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice
        utterance.lang = selectedVoice.lang
        console.log('Using voice:', selectedVoice.name)
      } else {
        utterance.lang = 'am-ET'
      }

      utterance.rate = 0.8
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = (event) => {
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(utterance)
    }, 150)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <main className="translation-area">
      <div className="translation-container">
        <div className="input-section">
          <div className="section-header">
            <h2>{t('signLanguage')}</h2>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div className="upload-box">
            {showCamera ? (
              <MediaPipeCamera
                videoRef={videoRef}
                canvasRef={canvasRef}
                isRecording={isRecording}
                isPaused={isPaused}
                recordingTime={recordingTime}
                formatTime={formatTime}
                fps={fps}
                currentPrediction={currentPrediction}
                isUploadedVideoMode={isUploadedVideoMode}
                isUploadedVideoPaused={isUploadedVideoPaused}
                // Controls
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onPauseRecording={pauseRecording}
                onResumeRecording={resumeRecording}
                onBackToLive={backToLiveRecording}
                onPauseUploadedVideo={pauseUploadedVideo}
                onResumeUploadedVideo={resumeUploadedVideo}
                onStopUploadedVideo={stopUploadedVideo}
                onCloseWebcam={closeWebcam}
              />
            ) : (
              <div className="upload-placeholder" onClick={handlePlusClick} title={t('startRecording')}>
                <div className="plus-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="upload-actions">
            <button className="btn-upload" onClick={handleVideoUpload} title={t('uploadVideo')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {t('uploadVideo')}
            </button>
          </div>
        </div>

        <div className="arrow-icon">→</div>

        <div className="output-section">
          <h2>{t('text')}</h2>
          <div className="translation-box">
            <div className="translation-content">
              {isTranslating ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <LoadingSpinner />
                  <p style={{ color: 'var(--text-secondary)' }}>{t('translating')}</p>
                </div>
              ) : (
                <p className="animate-fade-in">{translation || t('translationPlaceholder')}</p>
              )}
              {translation && !isTranslating && translation !== t('translationPlaceholder') && translation !== t('translating') && translation !== t('videoRecorded') && (
                <button
                  className="speaker-button"
                  onClick={speakText}
                  title="Listen to translation"
                >
                  <svg
                    className={`speaker-icon ${isSpeaking ? 'speaking' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    {isSpeaking ? (
                      <>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </>
                    ) : (
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isProcessingUpload && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <LoadingSpinner />
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            Processing video... {uploadProgress.toFixed(0)}%
          </p>
        </div>
      )}

      <button className="btn-ghost" onClick={onFeedbackClick} style={{ marginTop: '20px' }}>
        {t('sendFeedback')}
      </button>
    </main>
  )
}

export default TranslationArea
