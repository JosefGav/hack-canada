import { useRef, useCallback } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'

/**
 * useVoiceSession — manages the full ElevenLabs WebSocket lifecycle.
 *
 * Flow:
 *   1. Fetch a signed WebSocket URL from our backend (/api/voice/token)
 *   2. Request mic permission and set up 16kHz PCM audio capture
 *   3. Connect to ElevenLabs via WebSocket
 *   4. Stream audio chunks to ElevenLabs (user speech → STT)
 *   5. Receive transcripts, agent responses, and TTS audio back
 *   6. Play audio chunks through the browser
 */
export default function useVoiceSession() {
    const wsRef = useRef(null)
    const audioContextRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const processorRef = useRef(null)
    const audioQueueRef = useRef([])
    const isPlayingRef = useRef(false)

    const {
        setActive, setConnecting, setSpeaking, setListening,
        setTranscript, appendAgentText, setError, reset
    } = useVoiceStore()

    // ------- Start a new voice session -------
    const startSession = useCallback(async () => {
        try {
            setConnecting(true)
            setError(null)

            // 1. Get signed URL from our backend
            const tokenRes = await fetch('/api/voice/token', { method: 'POST' })
            if (!tokenRes.ok) throw new Error('Failed to get voice token')
            const { signed_url } = await tokenRes.json()

            // 2. Request mic permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            })
            mediaStreamRef.current = stream

            // 3. Set up audio context for recording (16kHz mono PCM)
            audioContextRef.current = new AudioContext({ sampleRate: 16000 })
            const source = audioContextRef.current.createMediaStreamSource(stream)
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor

            source.connect(processor)
            processor.connect(audioContextRef.current.destination)

            // 4. Connect WebSocket to ElevenLabs
            const ws = new WebSocket(signed_url)
            wsRef.current = ws

            ws.onopen = () => {
                setConnecting(false)
                setActive(true)
                setListening(true)
            }

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data)
                handleWebSocketMessage(data)
            }

            ws.onerror = (err) => {
                console.error('Voice WebSocket error:', err)
                setError('Voice connection error. Please try again.')
                stopSession()
            }

            ws.onclose = () => {
                setActive(false)
                setListening(false)
            }

            // 5. Stream mic audio as base64-encoded 16-bit PCM chunks
            processor.onaudioprocess = (e) => {
                if (ws.readyState !== WebSocket.OPEN) return
                const inputData = e.inputBuffer.getChannelData(0)

                // Convert float32 → int16 PCM
                const pcm = new Int16Array(inputData.length)
                for (let i = 0; i < inputData.length; i++) {
                    pcm[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768))
                }

                // Base64 encode and send
                const bytes = new Uint8Array(pcm.buffer)
                let binary = ''
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i])
                }
                const base64 = btoa(binary)

                ws.send(JSON.stringify({
                    user_audio_chunk: base64,
                }))
            }

        } catch (err) {
            console.error('Failed to start voice session:', err)

            // Friendly error messages for common issues
            if (err.name === 'NotAllowedError') {
                setError('Microphone permission denied. Please allow mic access and try again.')
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a mic and try again.')
            } else {
                setError(err.message)
            }

            setConnecting(false)
        }
    }, [])

    // ------- Handle incoming WebSocket messages -------
    const handleWebSocketMessage = useCallback((data) => {
        switch (data.type) {
            case 'conversation_initiation_metadata':
                // Connection confirmed by ElevenLabs
                break

            case 'user_transcript': {
                const transcript = data.user_transcription_event?.user_transcript || ''
                setTranscript(transcript)
                break
            }

            case 'agent_response': {
                const text = data.agent_response_event?.agent_response || ''
                appendAgentText(text)
                break
            }

            case 'audio': {
                // Queue audio chunk for playback
                const audioBase64 = data.audio_event?.audio_base_64
                if (audioBase64) {
                    setSpeaking(true)
                    queueAudioChunk(audioBase64)
                }
                break
            }

            case 'agent_response_correction':
                // Agent corrected its response mid-stream (rare)
                break

            case 'interruption':
                // User interrupted — stop current audio playback
                stopAudioPlayback()
                setSpeaking(false)
                break

            case 'ping':
                // Respond with pong to keep connection alive
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        type: 'pong',
                        event_id: data.ping_event?.event_id,
                    }))
                }
                break

            default:
                // Unknown message type — log for debugging
                console.log('Unknown ElevenLabs message type:', data.type, data)
        }
    }, [])

    // ------- Audio playback queue -------
    const queueAudioChunk = useCallback((base64Audio) => {
        audioQueueRef.current.push(base64Audio)
        if (!isPlayingRef.current) {
            playNextChunk()
        }
    }, [])

    const playNextChunk = useCallback(async () => {
        if (audioQueueRef.current.length === 0) {
            isPlayingRef.current = false
            setSpeaking(false)
            return
        }

        isPlayingRef.current = true
        const base64Audio = audioQueueRef.current.shift()

        try {
            const binaryString = atob(base64Audio)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
            }

            // Decode as 16kHz mono PCM (int16 → float32)
            const audioCtx = audioContextRef.current || new AudioContext({ sampleRate: 16000 })
            const int16 = new Int16Array(bytes.buffer)
            const float32 = new Float32Array(int16.length)
            for (let i = 0; i < int16.length; i++) {
                float32[i] = int16[i] / 32768
            }

            const buffer = audioCtx.createBuffer(1, float32.length, 16000)
            buffer.getChannelData(0).set(float32)

            const source = audioCtx.createBufferSource()
            source.buffer = buffer
            source.connect(audioCtx.destination)
            source.start()

            source.onended = () => {
                playNextChunk() // Play next chunk in queue
            }
        } catch (err) {
            console.error('Audio playback error:', err)
            playNextChunk() // Skip broken chunk, continue with next
        }
    }, [])

    const stopAudioPlayback = useCallback(() => {
        audioQueueRef.current = []
        isPlayingRef.current = false
    }, [])

    // ------- Stop/cleanup the voice session -------
    const stopSession = useCallback(() => {
        // Close WebSocket
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        // Stop mic tracks
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop())
            mediaStreamRef.current = null
        }

        // Disconnect audio processor
        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        // Clear audio queue
        stopAudioPlayback()

        reset()
    }, [])

    return { startSession, stopSession }
}
