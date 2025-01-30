import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaMicrophone, FaStop, FaSpinner, FaPaperPlane } from 'react-icons/fa'
import { Helmet } from 'react-helmet'
import { useParams } from 'react-router-dom'
import jayAgentImage from './jayagent.webp'

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

export function MainChat() {
  const { characterId } = useParams();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([]);

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
  });

  const audioPlayer = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  let timerTimeout: NodeJS.Timeout;
  let animationFrame: number;

  // 메시지 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 환영 메시지
  useEffect(() => {
    setMessages([
      {
        type: 'ai',
        text: characterId === 'jay' 
          ? '안녕하세요! AI 트레이너 Jay입니다. 운동과 건강에 대해 어떤 것이든 물어보세요.'
          : characterId === 'luna'
          ? '안녕하세요! 요가 & 명상 전문가 Luna입니다. 마음의 평화와 신체의 균형을 찾아보아요.'
          : '안녕하세요! 스포츠 영양사 Max입니다. 건강한 식단과 영양에 대해 상담해드릴게요.'
      }
    ]);
  }, [characterId]);

  // 음성 재생 함수
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
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      setIsProcessing(true);
      setMessages(prev => [...prev, { type: 'user', text: inputMessage }]);
      
      const response = await fetch(`${API_BASE_URL}/${characterId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputMessage,
          userId: 'user',
          userName: 'User'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '서버 응답 오류');
      }

      const data = await response.json();
      
      data.forEach((message: { text: string }) => {
        setMessages(prev => [...prev, { type: 'ai', text: message.text }]);
        playAudioResponse(message.text);
      });
      
    } catch (error: any) {
      console.error('메시지 전송 중 오류:', error);
      setError(error.message || '메시지 전송 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 오디오 시각화
  const drawAudioVisualization = () => {
    const { analyser } = mediaRecorderRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      animationFrame = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#39FF14');
        gradient.addColorStop(1, '#00ff9d');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  };

  // 음성 인식 시작
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;

      let finalTranscript = '';

      recognition.onstart = () => {
        console.log('음성 인식이 시작되었습니다.');
        finalTranscript = '';
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setMessage(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('음성 인식 오류:', event.error);
        setError('음성 인식 중 오류가 발생했습니다');
        setIsProcessing(false);
      };

      recognition.onend = async () => {
        if (finalTranscript) {
          setIsProcessing(true);
          setMessages(prev => [...prev, { type: 'user', text: finalTranscript }]);

          try {
            const chatResponse = await fetch(`${API_BASE_URL}/${characterId}/message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                text: finalTranscript,
                userId: 'user',
                userName: 'User'
              })
            });

            if (!chatResponse.ok) {
              throw new Error('AI 응답 생성에 실패했습니다');
            }

            const chatData = await chatResponse.json();
            
            chatData.forEach((message: { text: string }) => {
              setMessages(prev => [...prev, { type: 'ai', text: message.text }]);
              playAudioResponse(message.text);
            });
            
          } catch (error: any) {
            setError('처리 중 오류가 발생했습니다');
          } finally {
            setIsProcessing(false);
          }
        }
      };

      recognition.start();
      mediaRecorderRef.current = {
        stream,
        analyser,
        mediaRecorder: null,
        audioContext: audioCtx
      };

      setIsRecording(true);
      drawAudioVisualization();
    } catch (error: any) {
      setError('마이크 접근에 실패했습니다');
    }
  };

  const stopRecording = () => {
    const { stream, analyser, audioContext } = mediaRecorderRef.current;
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (analyser) {
      analyser.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    setIsRecording(false);
    setTimer(0);
    clearTimeout(timerTimeout);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <Helmet>
        <title>AI 트레이너와 대화하기</title>
        <meta name="description" content="AI 기반 피트니스 트레이너와 대화하세요" />
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <div className="chat-container backdrop-blur-md bg-black/30 rounded-2xl p-6 shadow-lg">
          <div className="messages-container max-h-[60vh] overflow-y-auto mb-6">
            <AnimatePresence mode="wait">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: msg.type === 'ai' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: msg.type === 'ai' ? -20 : 20 }}
                  className={`message-box mb-4 p-4 rounded-lg ${
                    msg.type === 'ai' 
                      ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-l-4 border-cyan-500' 
                      : 'bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-r-4 border-purple-500'
                  }`}
                >
                  <div className={`text-sm mb-2 ${
                    msg.type === 'ai' ? 'text-cyan-400' : 'text-purple-400'
                  }`}>
                    {msg.type === 'ai' ? characterId?.toUpperCase() : '나'}
                  </div>
                  <div className="text-white">{msg.text}</div>
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
              className="w-full bg-black/30 text-white rounded-lg px-4 py-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
              rows={1}
            />
            <motion.button
              onClick={handleSendMessage}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 p-2"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isProcessing}
            >
              {isProcessing ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
            </motion.button>
          </div>
        </div>

        <div className="voice-interface mt-8">
          <div className="visualizer-container mb-4">
            <canvas
              ref={canvasRef}
              className="w-full h-20 rounded-lg bg-black/20"
              width={1024}
              height={200}
            />
          </div>

          <div className="flex justify-center items-center gap-4">
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-600 to-pink-600' 
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isProcessing}
            >
              {isRecording ? <FaStop className="text-white text-xl" /> : <FaMicrophone className="text-white text-xl" />}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-900/80 text-white px-6 py-3 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioPlayer} className="hidden" />
    </div>
  );
} 