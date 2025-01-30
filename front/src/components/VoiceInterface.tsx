import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WaveSurfer from 'wavesurfer.js'

interface VoiceInterfaceProps {
  onVoiceRecorded: (blob: Blob) => void
  isProcessing: boolean
}

export function VoiceInterface({ onVoiceRecorded, isProcessing }: VoiceInterfaceProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurfer = useRef<WaveSurfer | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const analyser = useRef<AnalyserNode | null>(null)
  const dataArray = useRef<Uint8Array | null>(null)
  const animationFrame = useRef<number | null>(null)

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#6366f1',
        progressColor: '#4f46e5',
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 100,
        normalize: true,
      })
    }

    return () => {
      wavesurfer.current?.destroy()
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
    }
  }, [])

  const analyzeAudio = () => {
    if (!analyser.current || !dataArray.current) return
    analyser.current.getByteFrequencyData(dataArray.current)
    const average = dataArray.current.reduce((a, b) => a + b) / dataArray.current.length
    setAudioLevel(average / 128) // 0 to 2 range
    animationFrame.current = requestAnimationFrame(analyzeAudio)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      // 오디오 분석 설정
      audioContext.current = new AudioContext()
      const source = audioContext.current.createMediaStreamSource(stream)
      analyser.current = audioContext.current.createAnalyser()
      analyser.current.fftSize = 256
      source.connect(analyser.current)
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount)
      
      analyzeAudio()

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        onVoiceRecorded(blob)
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current)
        }
        setAudioLevel(0)
      }

      setMediaRecorder(recorder)
      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900">
      <div className="w-full max-w-4xl p-8">
        <motion.div 
          className="relative"
          animate={{
            scale: isProcessing ? 0.95 : 1,
            opacity: isProcessing ? 0.8 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          {/* 웨이브폼 디스플레이 */}
          <div className="relative h-32 mb-12">
            <div ref={waveformRef} className="absolute inset-0" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm"
              animate={{
                opacity: isRecording ? [0.3, 0.6] : 0.2
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>

          {/* 오디오 레벨 인디케이터 링 */}
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute w-64 h-64 rounded-full border-2 border-indigo-500/30"
              animate={{
                scale: isRecording ? [1, 1.1, 1] : 1,
                borderColor: isRecording ? ['rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.3)'] : 'rgba(99, 102, 241, 0.3)'
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute w-48 h-48 rounded-full border-2 border-indigo-400/40"
              animate={{
                scale: isRecording ? [1.1, 1, 1.1] : 1,
                borderColor: isRecording ? ['rgba(99, 102, 241, 0.4)', 'rgba(139, 92, 246, 0.4)'] : 'rgba(99, 102, 241, 0.4)'
              }}
              transition={{
                duration: 2,
                delay: 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* 메인 녹음 버튼 */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: isRecording 
                  ? ['0 10px 30px -10px rgba(99, 102, 241, 0.5)', '0 10px 40px -5px rgba(139, 92, 246, 0.7)']
                  : '0 10px 30px -10px rgba(99, 102, 241, 0.5)'
              }}
              transition={{
                duration: 1,
                repeat: isRecording ? Infinity : 0,
                repeatType: "reverse"
              }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500"
                animate={{
                  opacity: isRecording ? [0.8, 0.4] : 0.8
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <motion.div
                className="relative z-10 flex items-center justify-center w-full h-full"
                animate={{
                  scale: isRecording ? [1, 0.9, 1] : 1
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                {isRecording ? (
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="6" y="6" width="12" height="12" strokeWidth={2} />
                  </svg>
                ) : (
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </motion.div>
            </motion.button>
          </div>

          {/* 상태 텍스트 */}
          <motion.div
            className="text-center mt-8 text-white/80 text-lg font-light"
            animate={{
              opacity: [0.6, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            {isProcessing ? (
              "처리 중..."
            ) : isRecording ? (
              "녹음 중..."
            ) : (
              "말씀해주세요"
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
} 
