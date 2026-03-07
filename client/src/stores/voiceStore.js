import { create } from 'zustand'

export const useVoiceStore = create((set) => ({
  isActive: false,
  isConnecting: false,
  isSpeaking: false,       // AI is currently speaking
  isListening: false,      // Mic is active, user can speak
  transcript: '',          // Current user transcript
  agentText: '',           // Current agent response text
  error: null,

  setActive: (active) => set({ isActive: active }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setListening: (listening) => set({ isListening: listening }),
  setTranscript: (transcript) => set({ transcript }),
  setAgentText: (text) => set({ agentText: text }),
  appendAgentText: (text) => set(s => ({ agentText: s.agentText + text })),
  setError: (error) => set({ error }),
  reset: () => set({
    isActive: false, isConnecting: false, isSpeaking: false,
    isListening: false, transcript: '', agentText: '', error: null
  }),
}))
