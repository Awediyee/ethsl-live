import { useState, useRef, useEffect } from 'react'
import './TranslationArea.css'
import { useLanguage } from '../../contexts/LanguageContext'

function TranslationArea({ onFeedbackClick }) {
  const { t } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [translation, setTranslation] = useState('')
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

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

  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => console.error('Error playing video:', err))
    }
  }, [showCamera])

  useEffect(() => {
    // Load voices
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
      alert('Unable to access webcam. Please grant camera permissions.')
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
      setRecordedVideo(blob)
      setTranslation(t('videoRecorded'))
      stopWebcam()
      setShowCamera(false)
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

  const handlePlusClick = () => {
    startWebcam()
  }

  const handleStartNow = () => {
    if (recordedVideo) {
      setTranslation(t('translating'))
      setTimeout(() => {
        setTranslation('እኔ ደህና ነኝ እና ጥሩ እየሰራሁ ነው') // Amharic: Hello, how are you?
      }, 2000)
    } else {
      alert(t('recordFirst'))
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
        console.log('Web Speech started')
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        console.log('Web Speech ended')
        setIsSpeaking(false)
      }

      utterance.onerror = (event) => {
        console.error('Web Speech error:', event.error)
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
          <h2>{t('signLanguage')}</h2>
          <div className="upload-box">
            {showCamera ? (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video"
                />
                {isRecording && (
                  <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                  </div>
                )}
                <div className="camera-controls">
                  {!isRecording ? (
                    <button className="btn-record-inline" onClick={startRecording}>
                      <span className="record-icon">●</span> {t('startRecording')}
                    </button>
                  ) : (
                    <button className="btn-stop-inline" onClick={stopRecording}>
                      <span className="stop-icon">■</span> {t('stopRecording')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="upload-button" onClick={handlePlusClick}>
                <div className="plus-icon">+</div>
              </div>
            )}
          </div>
        </div>

        <div className="arrow-icon">→</div>

        <div className="output-section">
          <h2>{t('text')}</h2>
          <div className="translation-box">
            <div className="translation-content">
              <p>{translation || t('translationPlaceholder')}</p>
              {translation && translation !== t('translationPlaceholder') && translation !== t('translating') && translation !== t('videoRecorded') && (
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

      <button className="start-button" onClick={handleStartNow}>
        {t('startNow')}
      </button>

      <button className="feedback-link" onClick={onFeedbackClick}>
        {t('sendFeedback')}
      </button>
    </main>
  )
}

export default TranslationArea
