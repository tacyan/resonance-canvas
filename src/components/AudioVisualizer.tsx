import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

interface AudioVisualizerProps {
  onAudioData: (data: Float32Array) => void
  sensitivity: number
}

function AudioVisualizer({ onAudioData, sensitivity }: AudioVisualizerProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null)
  const audioDataRef = useRef<Float32Array>(new Float32Array(128))

  useEffect(() => {
    let mounted = true
    
    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const context = new AudioContext()
        const analyserNode = context.createAnalyser()
        analyserNode.fftSize = 256
        analyserNode.smoothingTimeConstant = 0.8
        
        const sourceNode = context.createMediaStreamSource(stream)
        sourceNode.connect(analyserNode)
        
        if (mounted) {
          setAudioContext(context)
          setAnalyser(analyserNode)
          setSource(sourceNode)
        }
      } catch (error) {
        console.error('Error accessing microphone:', error)
      }
    }
    
    // Auto-initialize audio on user interaction
    const handleInteraction = () => {
      if (!audioContext) {
        initAudio()
      }
    }
    
    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    
    return () => {
      mounted = false
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      
      if (source) {
        source.disconnect()
      }
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  useFrame(() => {
    if (analyser) {
      const dataArray = new Float32Array(analyser.frequencyBinCount)
      analyser.getFloatFrequencyData(dataArray)
      
      // Normalize and apply sensitivity
      for (let i = 0; i < dataArray.length; i++) {
        // Convert from dB to linear scale (0-1)
        const db = dataArray[i]
        const normalized = Math.max(0, (db + 100) / 100) * sensitivity
        audioDataRef.current[i] = normalized
      }
      
      onAudioData(audioDataRef.current)
    }
  })

  return null
}

export default AudioVisualizer