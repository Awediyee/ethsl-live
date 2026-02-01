import React from 'react';
import './MediaPipeCamera.css';
import { useLanguage } from '../../contexts/LanguageContext';

function MediaPipeCamera({
    videoRef,
    canvasRef,
    isRecording,
    isPaused,
    recordingTime,
    formatTime,
    fps,
    currentPrediction,
    isUploadedVideoMode,
    isUploadedVideoPaused,
    onStartRecording,
    onStopRecording,
    onBackToLive,
    onPauseUploadedVideo,
    onResumeUploadedVideo,
    onStopUploadedVideo,
    onCloseWebcam
}) {
    const { t } = useLanguage();
    return (
        <div className="mediapipe-camera-container">
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                />
                <canvas
                    ref={canvasRef}
                    className="landmark-canvas"
                    width={640}
                    height={480}
                />
            </div>

            {isRecording && (
                <div className="recording-indicator">
                    <span className="recording-dot"></span>
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                    {isPaused && <span className="paused-label"> ({t('pause')})</span>}
                </div>
            )}

            {fps > 0 && (
                <div className="fps-counter">
                    <span>FPS: {fps}</span>
                </div>
            )}

            {currentPrediction && (
                <div className="prediction-indicator">
                    <span className="prediction-label">{currentPrediction.label}</span>
                    <span className="prediction-confidence">
                        {(currentPrediction.confidence * 100).toFixed(1)}%
                    </span>
                </div>
            )}

            <div className="camera-controls">
                {isUploadedVideoMode ? (
                    // Uploaded video mode - show pause/resume/stop controls
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {!isUploadedVideoPaused ? (
                            <button className="btn-secondary" onClick={onPauseUploadedVideo}>
                                <span>⏸</span> {t('pause')}
                            </button>
                        ) : (
                            <button className="btn-primary" onClick={onResumeUploadedVideo}>
                                <span>▶</span> {t('resume')}
                            </button>
                        )}
                        <button className="btn-secondary" onClick={onStopUploadedVideo}>
                            <span className="stop-icon">■</span> {t('stop')}
                        </button>
                        <button className="btn-primary" onClick={onBackToLive} style={{ marginLeft: '10px' }}>
                            <span>🎥</span> {t('backToLive')}
                        </button>
                    </div>
                ) : (
                    // Live recording mode
                    <>
                        {!isRecording ? (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="btn-primary" onClick={onStartRecording}>
                                    <span className="record-icon">●</span> {t('startRecording')}
                                </button>
                                <button className="btn-secondary" onClick={onCloseWebcam}>
                                    <span>✕</span> {t('close')}
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button className="btn-secondary" onClick={onStopRecording}>
                                    <span className="stop-icon">■</span> {t('stop')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default MediaPipeCamera;
