import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FaMicrophone, FaStop, FaSpinner, FaPaperPlane } from 'react-icons/fa';

const ChatContainer = styled.div`
  min-height: 100vh;
  background: #000;
  color: #fff;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(57, 255, 20, 0.2);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
`;

const AgentImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 25px;
  border: 2px solid #39FF14;
`;

const AgentInfo = styled.div`
  h1 {
    font-size: 1.5rem;
    color: #39FF14;
    margin: 0;
  }
  
  p {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  padding: 6rem 1rem 7rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Message = styled.div<{ $isAI?: boolean }>`
  max-width: 80%;
  ${props => props.$isAI ? 'margin-right: auto;' : 'margin-left: auto;'}
  background: ${props => props.$isAI ? 'rgba(57, 255, 20, 0.1)' : 'rgba(0, 255, 255, 0.1)'};
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid ${props => props.$isAI ? 'rgba(57, 255, 20, 0.3)' : 'rgba(0, 255, 255, 0.3)'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    ${props => props.$isAI ? 'left: -8px;' : 'right: -8px;'}
    top: 50%;
    transform: translateY(-50%);
    border-style: solid;
    border-width: 8px;
    border-color: transparent;
    ${props => props.$isAI 
      ? 'border-right-color: rgba(57, 255, 20, 0.3);' 
      : 'border-left-color: rgba(0, 255, 255, 0.3);'
    }
  }
`;

const InputArea = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(57, 255, 20, 0.2);
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Input = styled.textarea`
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 0.5rem;
  color: #fff;
  padding: 0.8rem;
  resize: none;
  height: 40px;
  line-height: 20px;
  
  &:focus {
    outline: none;
    border-color: #39FF14;
  }
`;

const Button = styled.button`
  background: none;
  border: none;
  color: #39FF14;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    color: #fff;
    text-shadow: 0 0 10px #39FF14;
  }
`;

export default function ChatPage() {
  const { characterId } = useParams();
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', text: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 초기 메시지 설정
    setMessages([
      {
        type: 'ai',
        text: characterId === 'jay' 
          ? '안녕하세요! AI 트레이너 Jay입니다. 운동과 건강에 대해 어떤 것이든 물어보세요.'
          : characterId === 'luna'
          ? '안녕하세요! 요가 & 명상 전문가 Luna입니다. 마음의 평화와 신체의 균형을 찾아보아요.'
          : '안녕하세요! 스포츠 영양사 Sophie입니다. 건강한 식단과 영양에 대해 상담해드릴게요.'
      }
    ]);
  }, [characterId]);

  useEffect(() => {
    // 새 메시지가 추가될 때마다 스크롤
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    try {
      setIsProcessing(true);
      setMessages(prev => [...prev, { type: 'user', text: inputMessage }]);
      setInputMessage('');

      // API 호출
      const response = await fetch(`http://localhost:3000/${characterId}/message`, {
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
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      data.forEach((message: { text: string }) => {
        setMessages(prev => [...prev, { type: 'ai', text: message.text }]);
      });

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { type: 'ai', text: '죄송합니다. 오류가 발생했습니다.' }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer>
      <Header>
        <AgentImage 
          src={characterId === 'jay' 
            ? '/src/jayagent.webp'
            : characterId === 'luna'
            ? '/src/루나.webp'
            : '/src/nutrition.webp'
          } 
          alt={characterId} 
        />
        <AgentInfo>
          <h1>{characterId === 'jay' ? 'Jay' : characterId === 'luna' ? 'Luna' : 'Sophie'}</h1>
          <p>
            {characterId === 'jay' 
              ? 'AI Fitness Trainer'
              : characterId === 'luna'
              ? 'Yoga & Meditation Expert'
              : 'Sports Nutritionist'
            }
          </p>
        </AgentInfo>
      </Header>

      <ChatArea ref={chatAreaRef}>
        {messages.map((message, index) => (
          <Message key={index} $isAI={message.type === 'ai'}>
            {message.text}
          </Message>
        ))}
      </ChatArea>

      <InputArea>
        <Input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
        />
        <Button onClick={handleSendMessage} disabled={isProcessing}>
          {isProcessing ? <FaSpinner /> : <FaPaperPlane />}
        </Button>
      </InputArea>
    </ChatContainer>
  );
} 