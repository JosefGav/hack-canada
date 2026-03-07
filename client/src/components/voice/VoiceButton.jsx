import { useVoiceStore } from '../../stores/voiceStore'
import useVoiceSession from './VoiceSession'
import AudioVisualizer from './AudioVisualizer'

export default function VoiceButton() {
    const { isActive, isConnecting, isSpeaking, isListening, transcript, error } = useVoiceStore()
    const { startSession, stopSession } = useVoiceSession()

    const handleClick = () => {
        if (isActive) {
            stopSession()
        } else {
            startSession()
        }
    }

    return (
        <div className="voice-button-container">
            {/* Audio visualizer — shows when voice is active */}
            {isActive && (
                <AudioVisualizer />
            )}

            {/* Status indicator */}
            {isActive && (
                <div className="voice-status">
                    {isListening && (
                        <span className="voice-status-indicator voice-status-listening">
                            <span className="voice-dot voice-dot-listening" />
                            Listening
                        </span>
                    )}
                    {isSpeaking && (
                        <span className="voice-status-indicator voice-status-speaking">
                            <span className="voice-dot voice-dot-speaking" />
                            Speaking
                        </span>
                    )}
                </div>
            )}

            {/* Live transcript preview */}
            {transcript && isActive && (
                <span className="voice-transcript">"{transcript}"</span>
            )}

            {/* Main toggle button */}
            <button
                onClick={handleClick}
                disabled={isConnecting}
                className={`voice-toggle-btn ${isActive ? 'voice-toggle-active' : ''}`}
            >
                {isConnecting ? (
                    '⏳ Connecting...'
                ) : isActive ? (
                    '⏹ End Voice'
                ) : (
                    '🎤 Voice Mode'
                )}
            </button>

            {/* Error display */}
            {error && (
                <span className="voice-error">{error}</span>
            )}
        </div>
    )
}
