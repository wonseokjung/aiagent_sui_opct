import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMicrophone, FaStop, FaSpinner, FaPaperPlane, FaCoins } from 'react-icons/fa'
import { Helmet } from 'react-helmet'
import jayAgentImage from '../../jayagent.webp'

const API_BASE_URL = 'http://localhost:3000'
const ELEVENLABS_API_KEY = 'sk_d150072850a393f5dd193163932d945d5f57b34a658db3c4'
const ELEVENLABS_VOICE_ID = 'Y5ce46qd5DR6giezRgE6'

interface ChatResponse {
  response: string;
  error?: string;
}

// Web Speech API 타입 정의
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function ChatPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [response, setResponse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [timer, setTimer] = useState(0)
  const [coins, setCoins] = useState(0)
  const [hasVoiceAccess, setHasVoiceAccess] = useState(true)
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([])
  
  const mediaRecorderRef = useRef<{
    stream: MediaStream | null;
    analyser: AnalyserNode | null;
    mediaRecorder: MediaRecorder | null;
    audioContext: AudioContext | null;
  }>({
    stream: null,
    analyser: null,
    mediaRecorder: null,
    audioContext: null,
  })
  const audioPlayer = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  let timerTimeout: NodeJS.Timeout
  let animationFrame: number

  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 초기 환영 메시지
  useEffect(() => {
    setMessages([
      {
        type: 'ai',
        text: '안녕하세요! AI 트레이너 Jay입니다. 운동과 건강에 대해 어떤 것이든 물어보세요. 텍스트나 음성으로 대화해보세요!'
      }
    ])
  }, [])

  // 음성 재생 함수 수정
  const playAudioResponse = async (text: string) => {
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.9,
            style: 0.66,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('TTS 변환에 실패했습니다');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioPlayer.current) {
        audioPlayer.current.src = audioUrl;
        await audioPlayer.current.play();
      }
    } catch (error) {
      console.error('음성 변환 중 오류:', error);
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    try {
      setIsProcessing(true)
      setMessages(prev => [...prev, { type: 'user', text: inputMessage }])
      
      const response = await fetch(`${API_BASE_URL}/jay/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputMessage,
          userId: 'user',
          userName: 'User'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || '서버 응답 오류')
      }

      const data = await response.json()
      
      // AI 응답 추가 및 음성 재생
      data.forEach((message: { text: string }) => {
        setMessages(prev => [...prev, { type: 'ai', text: message.text }])
        playAudioResponse(message.text) // 음성으로 변환하여 재생
      })
      
    } catch (error: any) {
      console.error('메시지 전송 중 오류:', error)
      setError(error.message || '메시지 전송 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
      setInputMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 타이머 업데이트
  useEffect(() => {
    if (isRecording) {
      timerTimeout = setTimeout(() => {
        setTimer(timer + 1)
      }, 1000)
    }
    return () => clearTimeout(timerTimeout)
  }, [isRecording, timer])

  // 시간 포맷팅
  const minutes = Math.floor((timer % 3600) / 60)
  const seconds = timer % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // 오디오 시각화
  const drawAudioVisualization = () => {
    const { analyser } = mediaRecorderRef.current
    const canvas = canvasRef.current
    if (!analyser || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const width = canvas.width
    const height = canvas.height

    const draw = () => {
      animationFrame = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(0, 0, width, height)

      const barWidth = (width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2

        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, '#39FF14')
        gradient.addColorStop(1, '#00ff9d')
        
        ctx.fillStyle = gradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  useEffect(() => {
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  const handleError = (error: any, message: string) => {
    console.error(message, error)
    setError(`${message}: ${error.message}`)
    setIsProcessing(false)
    setTimeout(() => setError(null), 5000)
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const audioCtx = new AudioContext()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      const source = audioCtx.createMediaStreamSource(stream)
      source.connect(analyser)
      
      const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)()
      recognition.lang = 'ko-KR'
      recognition.continuous = false
      recognition.interimResults = true

      let finalTranscript = ''

      recognition.onstart = () => {
        console.log('음성 인식이 시작되었습니다.')
        finalTranscript = ''
      }

      recognition.onresult = (event: any) => {
        console.log('음성 인식 결과:', event)
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          console.log('현재 인식된 텍스트:', transcript)
          if (event.results[i].isFinal) {
            finalTranscript += transcript
            console.log('최종 텍스트:', finalTranscript)
          } else {
            interimTranscript += transcript
          }
        }

        // 중간 결과와 최종 결과 모두 표시
        setMessage(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('음성 인식 오류:', event.error)
        handleError(new Error(event.error), '음성 인식 중 오류가 발생했습니다')
      }

      recognition.onend = async () => {
        console.log('음성 인식이 종료되었습니다. 최종 텍스트:', finalTranscript)
        if (finalTranscript) {
          setIsProcessing(true)
          setMessages(prev => [...prev, { type: 'user', text: finalTranscript }])

          try {
            console.log('1. AI 응답 요청 시작')
            const chatResponse = await fetch(`${API_BASE_URL}/jay/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                text: finalTranscript,
                userId: 'user',
                userName: 'User'
              })
            })

            if (!chatResponse.ok) {
              const errorText = await chatResponse.text()
              console.error('2. AI 응답 생성 실패:', {
                status: chatResponse.status,
                statusText: chatResponse.statusText,
                error: errorText
              })
              throw new Error(errorText || 'AI 응답 생성에 실패했습니다')
            }

            const chatData = await chatResponse.json()
            console.log('2. AI 응답 생성 성공:', chatData)
            
            // AI 응답 추가 및 음성 재생
            chatData.forEach((message: { text: string }) => {
              setMessages(prev => [...prev, { type: 'ai', text: message.text }])
              playAudioResponse(message.text) // 음성으로 변환하여 재생
            })
            
          } catch (error: any) {
            console.error('오류 발생:', {
              message: error.message,
              stack: error.stack
            })
            handleError(error, '처리 중 오류가 발생했습니다')
          } finally {
            setIsProcessing(false)
            console.log('3. 처리 완료')
          }
        }
      }

      recognition.start()
      mediaRecorderRef.current = {
        stream,
        analyser,
        mediaRecorder: null,
        audioContext: audioCtx
      }

      setIsRecording(true)
      drawAudioVisualization()
    } catch (error: any) {
      handleError(error, '마이크 접근에 실패했습니다')
    }
  }

  const stopRecording = () => {
    const { stream, analyser, audioContext } = mediaRecorderRef.current
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (analyser) {
      analyser.disconnect()
    }
    if (audioContext) {
      audioContext.close()
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    setIsRecording(false)
    setTimer(0)
    clearTimeout(timerTimeout)
  }

  return (
    <div className="home-container bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 min-h-screen p-4 relative overflow-hidden">
      <Helmet>
        <title>AI 트레이너 Jay</title>
        <meta name="description" content="AI 기반 피트니스 트레이너" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/20 via-transparent to-transparent"></div>

      <div className="ai-agent-container relative z-10 mb-8">
        <div className="ai-agent-glow absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 blur-xl"></div>
        <motion.img
          src={jayAgentImage}
          alt="AI 트레이너 Jay"
          className="ai-agent-image w-32 h-32 rounded-full border-4 border-cyan-500/50 shadow-neon"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.8,
            ease: "easeOut"
          }}
        />
      </div>

      <div className="chat-container backdrop-blur-md bg-black/30 rounded-2xl p-4 shadow-neon max-w-4xl mx-auto">
        <div className="messages-container max-h-[60vh] overflow-y-auto custom-scrollbar mb-4">
          <AnimatePresence mode="wait">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: msg.type === 'ai' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: msg.type === 'ai' ? -20 : 20 }}
                transition={{ duration: 0.3 }}
                className={`message-box ${
                  msg.type === 'ai' 
                    ? 'ai-message bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-l-4 border-cyan-500' 
                    : 'user-message bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-r-4 border-purple-500'
                } rounded-lg p-4 mb-4 backdrop-blur-sm`}
              >
                <div className={`message-label text-sm ${
                  msg.type === 'ai' ? 'text-cyan-400' : 'text-purple-400'
                } mb-2 font-semibold`}>
                  {msg.type === 'ai' ? 'AI 트레이너 Jay' : '나'}
                </div>
                <div className="message-text text-gray-100">{msg.text}</div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container relative">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="message-input w-full bg-black/30 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none backdrop-blur-sm"
            rows={1}
          />
          <motion.button
            onClick={handleSendMessage}
            className="send-button absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:text-gray-600"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isProcessing}
          >
            {isProcessing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </motion.button>
        </div>
      </div>

      <div className="voice-interface mt-8 relative z-10">
        <div className="visualizer-container h-20 mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-full rounded-lg bg-black/20 backdrop-blur-sm"
            width={1024}
            height={200}
          />
        </div>

        <div className="flex items-center justify-center gap-4">
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`record-button w-16 h-16 rounded-full flex items-center justify-center ${
              isRecording 
                ? 'bg-gradient-to-r from-red-600 to-pink-600 shadow-neon-red' 
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-neon-cyan'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                  className="text-white text-xl"
                >
                  <FaSpinner className="animate-spin" />
                </motion.div>
              ) : isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-white text-xl"
                >
                  <FaStop />
                </motion.div>
              ) : (
                <motion.div
                  key="microphone"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-white text-xl"
                >
                  <FaMicrophone />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="timer text-2xl font-mono text-cyan-400 bg-black/30 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              {timeDisplay}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="error-message fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-6 py-3 rounded-lg backdrop-blur-sm border-l-4 border-red-500"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioPlayer} className="hidden" />

      <style>
        {`
        .shadow-neon {
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.3),
                      0 0 40px rgba(168, 85, 247, 0.2);
        }
        
        .shadow-neon-cyan {
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.4),
                      0 0 30px rgba(59, 130, 246, 0.3);
        }
        
        .shadow-neon-red {
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4),
                      0 0 30px rgba(236, 72, 153, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(14, 116, 144);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(8, 145, 178);
        }

        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        .message-box {
          transition: all 0.3s ease;
        }

        .message-box:hover {
          transform: translateY(-2px);
        }
        `}
      </style>
    </div>
  )
} 