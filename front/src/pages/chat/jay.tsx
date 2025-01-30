import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMicrophone, FaStop, FaSpinner, FaPaperPlane, FaCoins, FaCrown, FaTimes, FaPlay, FaYoutube, FaExpand } from 'react-icons/fa'
import { Helmet } from 'react-helmet'
import styled from 'styled-components'
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

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  position: relative;
  overflow: hidden;
`

const BackgroundEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
  pointer-events: none;
`

const Header = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

const AgentImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  margin-right: 1rem;
  border: 2px solid #39FF14;
`

const AgentInfo = styled.div`
  color: #fff;
  h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
  }
`

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(57, 255, 20, 0.5);
    border-radius: 3px;
  }
`

const MessageGroup = styled.div<{ $isAi?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: 1.5rem 0;
  flex-direction: ${props => props.$isAi ? 'row' : 'row-reverse'};
`

const MessageProfile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const ProfileImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: 2px solid #39FF14;
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
`

const ProfileName = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
`

const MessageBubble = styled(motion.div)<{ $isAi?: boolean }>`
  max-width: 70%;
  padding: 1rem;
  border-radius: ${props => props.$isAi ? '20px 20px 20px 0' : '20px 20px 0 20px'};
  background: ${props => props.$isAi ? 'rgba(57, 255, 20, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    border-radius: inherit;
    box-shadow: 0 0 20px ${props => props.$isAi ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &:hover::before {
    opacity: 1;
  }
`

const InputArea = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
`

const Input = styled.textarea`
  flex: 1;
  padding: 0.8rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  resize: none;
  height: 40px;
  line-height: 20px;
  
  &:focus {
    outline: none;
    border-color: #39FF14;
    box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
  }
`

const Button = styled(motion.button)`
  background: transparent;
  border: none;
  color: #39FF14;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(57, 255, 20, 0.1);
  }
  
  &:disabled {
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
  }
`

const TypingIndicator = styled(motion.div)`
  display: flex;
  gap: 4px;
  padding: 0.5rem;
  
  span {
    width: 4px;
    height: 4px;
    background: #39FF14;
    border-radius: 50%;
  }
`

const SuperChatModal = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 20px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 0 30px rgba(57, 255, 20, 0.2);
  backdrop-filter: blur(10px);
  z-index: 1000;
`

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  z-index: 999;
`

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  color: #fff;
  
  h3 {
    margin: 0;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #fff;
  }
`

const SuperChatButton = styled(Button)`
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.3);
  padding: 0.5rem 1rem;
  border-radius: 12px;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(57, 255, 20, 0.2);
  }
`

const SuperChatBubble = styled(MessageBubble)`
  background: linear-gradient(135deg, rgba(57, 255, 20, 0.2), rgba(0, 255, 157, 0.2));
  border: 1px solid rgba(57, 255, 20, 0.3);
  
  &::before {
    box-shadow: 0 0 30px rgba(57, 255, 20, 0.3);
  }
`

const CoinBalance = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #39FF14;
  font-size: 0.9rem;
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: rgba(57, 255, 20, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(57, 255, 20, 0.2);
`

interface VideoRecommendation {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  difficulty: string;
  category: string;
}

interface Message {
  type: 'user' | 'ai';
  text: string;
  isSuper?: boolean;
  recommendations?: VideoRecommendation[];
  videoId?: string;
}

const VideoRecommendationCard = styled(motion.div)`
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin: 0.5rem 0;
  cursor: pointer;
  
  &:hover {
    background: rgba(57, 255, 20, 0.1);
  }
`

const VideoThumbnail = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`

const VideoInfo = styled.div`
  color: #fff;
  
  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  p {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`

const VideoRecommendationList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 1rem;
`

const VideoModal = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 800px;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 20px;
  padding: 1rem;
  z-index: 1100;
`

const VideoWrapper = styled.div`
  position: relative;
  padding-bottom: 56.25%; /* 16:9 비율 */
  height: 0;
  overflow: hidden;
  border-radius: 12px;
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`

const VideoControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  color: #fff;
  
  h3 {
    margin: 0;
    font-size: 1.2rem;
  }
`

const VideoLink = styled.button`
  color: #39FF14;
  cursor: pointer;
  text-decoration: underline;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  
  &:hover {
    color: #00ff9d;
  }
`

const MessageVideoWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 비율 */
  margin-top: 1rem;
  border-radius: 12px;
  overflow: hidden;
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

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
  const [messages, setMessages] = useState<Array<Message>>([])
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [showSuperChatModal, setShowSuperChatModal] = useState(false)
  const [isSuperChatEnabled, setIsSuperChatEnabled] = useState(false)
  const [superChatExpiryDate, setSuperChatExpiryDate] = useState<Date | null>(null)
  const [currentVideo, setCurrentVideo] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string>('')
  
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

  // 메시지 애니메이션 variants
  const messageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: -20 }
  }

  // AI 타이핑 애니메이션
  const typingVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  }

  const dotVariants = {
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  }

  // 슈퍼챗 구매
  const purchaseSuperChat = async () => {
    try {
      // 실제 구현에서는 여기에 수이 코인 결제 로직 추가
      const response = await fetch(`${API_BASE_URL}/purchase/superchat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user',
          amount: 100 // 예시 금액
        })
      });

      if (!response.ok) {
        throw new Error('결제에 실패했습니다');
      }

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      setIsSuperChatEnabled(true);
      setSuperChatExpiryDate(expiryDate);
      setShowSuperChatModal(false);
      setCoins(prev => prev - 100); // 예시 금액
      
    } catch (error: any) {
      setError(error.message || '결제 중 오류가 발생했습니다');
    }
  }

  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    
    // YouTube URL 패턴들
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^/?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^/?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsProcessing(true);
      
      // YouTube 링크가 있는지 확인
      const videoId = extractVideoId(inputMessage);
      
      // 사용자 메시지 추가
      setMessages(prev => [...prev, { 
        type: 'user', 
        text: inputMessage,
        isSuper: isSuperChatEnabled,
        videoId: videoId || undefined
      } as Message]);
      
      setInputMessage('');
      setIsAiTyping(true);
      
      const response = await fetch(`${API_BASE_URL}/jay/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputMessage,
          userId: 'user',
          userName: 'User',
          isSuper: isSuperChatEnabled,
          videoId: videoId || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }

      const data = await response.json();
      
      // AI 응답 처리
      for (const message of data) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 메시지에서 YouTube 링크 찾기
        const messageVideoId = extractVideoId(message.text);
        
        // 메시지 추가
        setMessages(prev => [...prev, { 
          type: 'ai', 
          text: message.text,
          videoId: messageVideoId || undefined,
          recommendations: message.recommendations?.map((video: any) => ({
            id: video.id,
            title: video.title,
            thumbnail: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
            duration: video.duration || '30:00',
            difficulty: video.difficulty || '중급',
            category: video.category || '전신 운동'
          }))
        } as Message]);
        
        playAudioResponse(message.text);
      }
      
    } catch (error: any) {
      setError(error.message || '메시지 전송 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
      setIsAiTyping(false);
    }
  };

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

  const handleYouTubeLink = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    
    if (urls) {
      urls.forEach(url => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = extractVideoId(url);
          if (videoId) {
            setCurrentVideo(videoId);
            setVideoTitle('YouTube 영상');
          }
        }
      });
    }
    
    return text.replace(urlRegex, (url) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return `<VideoLink onClick={() => handleVideoClick('${url}')}><FaYoutube /> 영상 보기</VideoLink>`;
      }
      return url;
    });
  };

  const handleVideoClick = (url: string) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      setCurrentVideo(videoId);
      setVideoTitle('운동 영상');
    }
  };

  const renderMessage = (msg: Message) => {
    return (
      <>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {msg.text}
        </div>
        {msg.videoId && (
          <MessageVideoWrapper>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${msg.videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </MessageVideoWrapper>
        )}
        {msg.recommendations && msg.recommendations.length > 0 && (
          <VideoRecommendationList>
            {msg.recommendations.map((video) => (
              <VideoRecommendationCard
                key={video.id}
                onClick={() => {
                  setMessages(prev => [...prev, {
                    type: 'ai',
                    text: video.title,
                    videoId: video.id
                  } as Message]);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <VideoThumbnail src={video.thumbnail} alt={video.title} />
                <VideoInfo>
                  <h4>{video.title}</h4>
                  <p>
                    <FaPlay /> {video.duration}
                  </p>
                  <p>
                    <FaYoutube /> {video.category} • {video.difficulty}
                  </p>
                </VideoInfo>
              </VideoRecommendationCard>
            ))}
          </VideoRecommendationList>
        )}
      </>
    );
  };

  return (
    <ChatContainer>
      <Helmet>
        <title>Jay AI 트레이너와의 대화</title>
      </Helmet>
      
      <BackgroundEffect />
      
      <Header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AgentImage src={jayAgentImage} alt="Jay AI 트레이너" />
        <AgentInfo>
          <h2>Jay AI 트레이너</h2>
          <p>항상 대기중</p>
        </AgentInfo>
        <CoinBalance>
          <FaCoins /> {coins} SUI
        </CoinBalance>
      </Header>

      <ChatArea>
        <AnimatePresence mode="popLayout">
          {messages.map((msg, index) => (
            <MessageGroup key={index} $isAi={msg.type === 'ai'}>
              {msg.type === 'ai' && (
                <MessageProfile>
                  <ProfileImage src={jayAgentImage} alt="Jay AI 트레이너" />
                  <ProfileName>Jay</ProfileName>
                </MessageProfile>
              )}
              {msg.isSuper ? (
                <SuperChatBubble
                  $isAi={msg.type === 'ai'}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <FaCrown style={{ color: '#39FF14', marginRight: '0.5rem' }} />
                  {renderMessage(msg)}
                </SuperChatBubble>
              ) : (
                <MessageBubble
                  $isAi={msg.type === 'ai'}
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  {renderMessage(msg)}
                </MessageBubble>
              )}
              {msg.type === 'user' && (
                <MessageProfile>
                  <ProfileImage 
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
                    alt="사용자" 
                  />
                  <ProfileName>나</ProfileName>
                </MessageProfile>
              )}
            </MessageGroup>
          ))}
          
          {isAiTyping && (
            <MessageGroup $isAi={true}>
              <MessageProfile>
                <ProfileImage src={jayAgentImage} alt="Jay AI 트레이너" />
                <ProfileName>Jay</ProfileName>
              </MessageProfile>
              <TypingIndicator
                variants={typingVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    variants={dotVariants}
                    animate="animate"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </TypingIndicator>
            </MessageGroup>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ChatArea>

      <InputArea>
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={isProcessing}
        />
        
        <SuperChatButton
          onClick={() => setShowSuperChatModal(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaCrown />
          {isSuperChatEnabled ? '슈퍼챗 활성화됨' : '슈퍼챗 구매'}
        </SuperChatButton>
        
        <Button
          onClick={handleSendMessage}
          disabled={isProcessing || !inputMessage.trim()}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isProcessing ? <FaSpinner /> : <FaPaperPlane />}
        </Button>
        
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isRecording ? <FaStop /> : <FaMicrophone />}
        </Button>
      </InputArea>
      
      <AnimatePresence>
        {showSuperChatModal && (
          <>
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuperChatModal(false)}
            />
            <SuperChatModal
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <ModalHeader>
                <h3>
                  <FaCrown style={{ color: '#39FF14' }} />
                  슈퍼챗 구매
                </h3>
                <CloseButton onClick={() => setShowSuperChatModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              
              <div style={{ color: '#fff', marginBottom: '1.5rem' }}>
                <p>슈퍼챗을 구매하면 다음과 같은 혜택을 받을 수 있습니다:</p>
                <ul>
                  <li>특별한 메시지 스타일</li>
                  <li>우선 응답</li>
                  <li>한 달 동안 무제한 이용</li>
                </ul>
                <p>가격: 100 SUI</p>
              </div>
              
              <Button
                onClick={purchaseSuperChat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: '100%' }}
              >
                구매하기
              </Button>
            </SuperChatModal>
          </>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {currentVideo && (
          <>
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCurrentVideo(null)}
            />
            <VideoModal
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <VideoControls>
                <h3>{videoTitle}</h3>
                <Button onClick={() => setCurrentVideo(null)}>
                  <FaTimes />
                </Button>
              </VideoControls>
              <VideoWrapper>
                <iframe
                  src={`https://www.youtube.com/embed/${currentVideo}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </VideoWrapper>
            </VideoModal>
          </>
        )}
      </AnimatePresence>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <audio ref={audioPlayer} style={{ display: 'none' }} />
    </ChatContainer>
  )
} 