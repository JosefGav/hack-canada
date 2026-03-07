import { useEffect, useRef } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'

/**
 * AudioVisualizer — animated bar visualization that reacts to voice state.
 * Shows green bars when listening (mic active), gold bars when AI is speaking.
 */
export default function AudioVisualizer() {
    const canvasRef = useRef(null)
    const { isSpeaking, isListening } = useVoiceStore()

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

        let animationId
        const draw = () => {
            ctx.clearRect(0, 0, width, height)

            const bars = 20
            const barWidth = width / bars - 2
            const active = isSpeaking || isListening
            const color = isSpeaking ? '#C9A84C' : '#4A9D5B' // Gold when speaking, green when listening

            for (let i = 0; i < bars; i++) {
                const barHeight = active
                    ? Math.random() * height * 0.8 + height * 0.1
                    : height * 0.05

                ctx.fillStyle = color
                ctx.globalAlpha = active ? 0.8 : 0.3
                ctx.fillRect(
                    i * (barWidth + 2),
                    (height - barHeight) / 2,
                    barWidth,
                    barHeight
                )
            }

            ctx.globalAlpha = 1.0
            animationId = requestAnimationFrame(draw)
        }

        draw()
        return () => cancelAnimationFrame(animationId)
    }, [isSpeaking, isListening])

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={40}
            className="voice-visualizer"
        />
    )
}
