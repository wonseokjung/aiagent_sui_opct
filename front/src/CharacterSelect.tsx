import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';

// 캐릭터 이미지 임포트
import jayImage from './jayagent.webp';
import lunaImage from './루나.webp';
import maxImage from './nutrition.webp';

const VideoSection = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
`;

const VideoBackground = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const MainTitle = styled(motion.div)`
  text-align: center;
  position: relative;
  max-width: 1200px;
  width: 100%;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  h1 {
    font-family: 'Cyberpunk', sans-serif;
    font-size: 7rem;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 0 30px rgba(57, 255, 20, 0.5),
                 0 0 60px rgba(57, 255, 20, 0.3),
                 0 0 90px rgba(57, 255, 20, 0.2);
    margin-bottom: 1.5rem;
    letter-spacing: -0.02em;
    line-height: 1.2;
    text-transform: uppercase;

    span {
      color: #39FF14;
      position: relative;
      display: inline-block;
      text-shadow: 0 0 30px rgba(57, 255, 20, 0.8),
                   0 0 60px rgba(57, 255, 20, 0.5),
                   0 0 90px rgba(57, 255, 20, 0.3);
      
      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: -5px;
        height: 3px;
        background: linear-gradient(90deg, transparent, #39FF14, transparent);
        animation: glowLine 2s infinite;
        box-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
      }
    }
  }

  p {
    font-family: 'Cyberpunk', sans-serif;
    font-size: 2.5rem;
    color: #fff;
    text-shadow: 0 0 15px rgba(0, 255, 255, 0.5),
                 0 0 30px rgba(0, 255, 255, 0.3);
    margin-top: 1.5rem;
    letter-spacing: 0.1em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    
    h1 {
      font-size: 4rem;
    }
    p {
      font-size: 1.8rem;
    }
  }
`;

const ScrollDownIndicator = styled(motion.div)`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-family: 'Cyberpunk', sans-serif;

  &::after {
    content: '';
    width: 30px;
    height: 30px;
    border-right: 2px solid #39FF14;
    border-bottom: 2px solid #39FF14;
    transform: rotate(45deg);
    animation: bounce 2s infinite;
    box-shadow: 0 0 15px rgba(57, 255, 20, 0.3);
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: rotate(45deg) translate(0, 0);
    }
    40% {
      transform: rotate(45deg) translate(0, -20px);
    }
    60% {
      transform: rotate(45deg) translate(0, -10px);
    }
  }
`;

const Container = styled.div`
  background: #000;
  position: relative;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
  position: relative;
  z-index: 1;
`;

const characters = [
  // 전문가 파트
  {
    id: 'jay',
    name: 'Jay',
    role: 'AI 피트니스 트레이너',
    description: '전문적이고 친근한 피트니스 트레이너로, 당신의 건강과 운동 목표를 달성하도록 도와드립니다.',
    image: jayImage,
    personality: '열정적이고 긍정적인',
    specialties: ['웨이트 트레이닝', '식단 관리', '체중 감량', '근력 강화'],
    category: '전문가'
  },
  {
    id: 'luna',
    name: 'Luna',
    role: '요가 & 명상 전문가',
    description: '마음의 평화와 신체의 유연성을 함께 발전시키는 요가와 명상 전문가입니다.',
    image: lunaImage,
    personality: '차분하고 이해심 깊은',
    specialties: ['요가', '명상', '스트레칭', '호흡법'],
    category: '전문가'
  },
  {
    id: 'sophie',
    name: 'Sophie',
    role: '스포츠 영양사',
    description: '과학적인 영양 분석과 맞춤형 식단을 제공하는 스포츠 영양 전문가입니다. 여러분의 건강한 식습관 형성을 도와드립니다.',
    image: maxImage,
    personality: '섬세하고 우아한',
    specialties: ['영양 상담', '맞춤형 식단', '체성분 분석', '건강식품 추천'],
    category: '전문가'
  },
  // 마음 상담사
  {
    id: 'mina',
    name: 'Mina',
    role: '마음 치유사',
    description: '따뜻한 대화와 공감으로 당신의 마음을 치유하고 일상의 스트레스를 해소하는데 도움을 드립니다.',
    image: lunaImage,
    personality: '따뜻하고 공감적인',
    specialties: ['심리 상담', '스트레스 관리', '명상 테라피', '감정 코칭'],
    category: '상담사'
  },
  // 운동 친구들
  {
    id: 'mike',
    name: 'Mike',
    role: '헬스장 매니아',
    description: '3년차 헬스 매니아로, 함께 운동하면서 즐겁게 건강해지는 방법을 공유합니다.',
    image: jayImage,
    personality: '유쾌하고 에너지 넘치는',
    specialties: ['웨이트 트레이닝', '운동 루틴 공유', '동기부여', '운동 파트너'],
    category: '친구'
  },
  {
    id: 'sarah',
    name: 'Sarah',
    role: '요가 애호가',
    description: '일상 속에서 요가를 즐기며, 바쁜 현대인들을 위한 간단한 요가 동작들을 공유합니다.',
    image: lunaImage,
    personality: '차분하고 친근한',
    specialties: ['간단한 요가', '스트레칭', '호흡법', '생활 운동'],
    category: '친구'
  },
  {
    id: 'tom',
    name: 'Tom',
    role: '러닝 메이트',
    description: '주말 러너이자 마라톤 완주자로, 즐겁게 달리는 방법과 경험을 나눕니다.',
    image: maxImage,
    personality: '활기차고 도전적인',
    specialties: ['러닝 코스 추천', '러닝 팁', '마라톤 준비', '페이스 조절'],
    category: '친구'
  }
];

const Title = styled(motion.h1)`
  font-size: 2.25rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 3rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  position: relative;
  
  background: linear-gradient(to right, #39FF14, #00ffff, #39FF14);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
  animation: glow 2s ease-in-out infinite alternate;
  
  @keyframes glow {
    from {
      text-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
    }
    to {
      text-shadow: 0 0 30px rgba(57, 255, 20, 0.8),
                   0 0 40px rgba(57, 255, 20, 0.3);
    }
  }
  
  &::before, &::after {
    content: attr(data-text);
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: -1;
  }
  
  &::before {
    animation: glitch1 4s infinite linear alternate-reverse;
    text-shadow: 2px 0 #ff00ff;
    clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
  }
  
  &::after {
    animation: glitch2 4s infinite linear alternate-reverse;
    text-shadow: -2px 0 #00ffff;
    clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
  }

  @keyframes glitch1 {
    0% {
      transform: none;
      opacity: 1;
    }
    7% {
      transform: skew(-0.5deg, -0.9deg);
      opacity: 0.75;
    }
    10% {
      transform: none;
      opacity: 1;
    }
    27% {
      transform: none;
      opacity: 1;
    }
    30% {
      transform: skew(0.8deg, -0.1deg);
      opacity: 0.75;
    }
    35% {
      transform: none;
      opacity: 1;
    }
    52% {
      transform: none;
      opacity: 1;
    }
    55% {
      transform: skew(-1deg, 0.2deg);
      opacity: 0.75;
    }
    50% {
      transform: none;
      opacity: 1;
    }
    72% {
      transform: none;
      opacity: 1;
    }
    75% {
      transform: skew(0.4deg, 1deg);
      opacity: 0.75;
    }
    80% {
      transform: none;
      opacity: 1;
    }
    100% {
      transform: none;
      opacity: 1;
    }
  }

  @keyframes glitch2 {
    0% {
      transform: none;
      opacity: 0.25;
    }
    7% {
      transform: translate(-2px, -3px);
      opacity: 0.5;
    }
    10% {
      transform: none;
      opacity: 0.25;
    }
    27% {
      transform: none;
      opacity: 0.25;
    }
    30% {
      transform: translate(-5px, -2px);
      opacity: 0.5;
    }
    35% {
      transform: none;
      opacity: 0.25;
    }
    52% {
      transform: none;
      opacity: 0.25;
    }
    55% {
      transform: translate(-5px, -1px);
      opacity: 0.5;
    }
    50% {
      transform: none;
      opacity: 0.25;
    }
    72% {
      transform: none;
      opacity: 0.25;
    }
    75% {
      transform: translate(-2px, -6px);
      opacity: 0.5;
    }
    80% {
      transform: none;
      opacity: 0.25;
    }
    100% {
      transform: none;
      opacity: 0.25;
    }
  }
  
  @media (min-width: 768px) {
    font-size: 3.75rem;
  }
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const CharacterCard = styled(motion.div)<{ $selected?: boolean }>`
  position: relative;
  cursor: pointer;
  border-radius: 1rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(57, 255, 20, 0.3);
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(57, 255, 20, 0.1) 90deg,
      transparent 180deg
    );
    animation: rotate 4s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  ${props => props.$selected && `
    box-shadow: 0 0 30px rgba(57, 255, 20, 0.3),
                0 0 60px rgba(57, 255, 20, 0.1);
    border: 1px solid rgba(57, 255, 20, 0.8);
    transform: translateY(-5px) rotateX(5deg);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        linear-gradient(90deg, transparent 49.5%, #39FF14 49.5%, #39FF14 50.5%, transparent 50.5%) 0 0 / 30px 100%,
        linear-gradient(0deg, transparent 49.5%, #39FF14 49.5%, #39FF14 50.5%, transparent 50.5%) 0 0 / 100% 30px;
      animation: gridScan 3s linear infinite;
      z-index: 2;
      pointer-events: none;
    }

    @keyframes gridScan {
      0% {
        opacity: 0;
        transform: translateY(-100%);
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        opacity: 0;
        transform: translateY(100%);
      }
    }
  `}

  &:hover {
    box-shadow: 0 0 30px rgba(57, 255, 20, 0.2),
                0 0 60px rgba(57, 255, 20, 0.1);
    border: 1px solid rgba(57, 255, 20, 0.5);
    transform: translateY(-5px) rotateX(5deg);
  }
`;

const ImageContainer = styled.div`
  aspect-ratio: 1/1;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(0, 0, 0, 0.7) 80%,
      rgba(57, 255, 20, 0.1) 100%
    );
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      0deg,
      rgba(57, 255, 20, 0.1) 0px,
      rgba(57, 255, 20, 0.1) 1px,
      transparent 1px,
      transparent 2px
    );
    z-index: 2;
    opacity: 0.5;
    animation: scanline 2s linear infinite;
  }
`;

const CharacterImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  filter: brightness(0.8) contrast(1.2);

  ${CharacterCard}:hover & {
    transform: scale(1.1);
    filter: brightness(1) contrast(1.2);
  }
`;

const CardInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  z-index: 3;
  background: linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 50%,
    transparent 100%
  );
  transform: translateZ(20px);
  transition: all 0.3s ease;
`;

const CharacterName = styled.h3`
  font-size: 1.5rem;
  font-weight: bold;
  color: #39FF14;
  margin-bottom: 0.5rem;
  text-shadow: 0 0 10px rgba(57, 255, 20, 0.5);
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
`;

const CharacterRole = styled.p`
  color: #00ffff;
  font-size: 1rem;
  font-weight: 500;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  letter-spacing: 0.05em;
  opacity: 0.9;
  transition: all 0.3s ease;
`;

const DetailOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 2rem;
`;

const DetailContent = styled(motion.div)`
  max-width: 32rem;
  width: 100%;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 1.5rem;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      linear-gradient(90deg, transparent 49.5%, rgba(57, 255, 20, 0.1) 49.5%, rgba(57, 255, 20, 0.1) 50.5%, transparent 50.5%) 0 0 / 30px 100%,
      linear-gradient(0deg, transparent 49.5%, rgba(57, 255, 20, 0.1) 49.5%, rgba(57, 255, 20, 0.1) 50.5%, transparent 50.5%) 0 0 / 100% 30px;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(57, 255, 20, 0.1) 90deg,
      transparent 180deg
    );
    animation: rotate 4s linear infinite;
  }
`;

const DetailHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;

  h2 {
    font-size: 2.5rem;
    font-weight: bold;
    color: #39FF14;
    text-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
    margin-bottom: 0.5rem;
    animation: textPulse 2s ease-in-out infinite;
  }

  p {
    font-size: 1.25rem;
    color: #00ffff;
    text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
  }
`;

const DetailSection = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 2rem;

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #39FF14;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-shadow: 0 0 10px rgba(57, 255, 20, 0.3);

    &::before {
      content: '✦';
      color: #39FF14;
    }
  }

  p {
    color: #e2e8f0;
    line-height: 1.6;
    text-shadow: 0 0 5px rgba(226, 232, 240, 0.3);
  }
`;

const SpecialtyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
`;

const SpecialtyItem = styled.div`
  background: rgba(57, 255, 20, 0.1);
  border: 1px solid rgba(57, 255, 20, 0.2);
  border-radius: 0.75rem;
  padding: 0.75rem;
  color: #e2e8f0;
  text-align: center;
  text-shadow: 0 0 5px rgba(226, 232, 240, 0.3);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(57, 255, 20, 0.15);
    border-color: rgba(57, 255, 20, 0.3);
    transform: translateY(-2px);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #39FF14;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 2;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(57, 255, 20, 0.1);
    transform: rotate(90deg);
  }

  &::before {
    content: '×';
  }
`;

const StartButton = styled(motion.button)`
  width: 100%;
  padding: 1.2rem;
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
  background: linear-gradient(45deg, #39FF14, #00ffff);
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 2rem;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    transition: 0.5s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(57, 255, 20, 0.5);
    background: linear-gradient(45deg, #00ffff, #39FF14);
  }

  &:hover::before {
    left: 100%;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 4rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -1rem;
    right: -1rem;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(57, 255, 20, 0.2), transparent);
    bottom: -2rem;
  }

  &:last-child::before {
    display: none;
  }
`;

const CategoryTitle = styled.div`
  margin: 3rem 0 1rem;
  color: #39FF14;
  
  h2 {
    font-family: 'Cyberpunk', sans-serif;
    font-size: 2.5rem;
    text-shadow: 0 0 20px rgba(57, 255, 20, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.05em;
    line-height: 1.4;
    margin-bottom: 2rem;
  }
`;

export function CharacterSelect() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedCharacter, setSelectedCharacter] = React.useState<typeof characters[0] | null>(null);

  const handleCharacterClick = (character: typeof characters[0]) => {
    setSelectedCharacter(character);
  };

  const handleStartChat = () => {
    if (selectedCharacter) {
      navigate(`/chat/${selectedCharacter.id}`);
    }
  };

  const handleClose = () => {
    setSelectedCharacter(null);
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Container>
      <GlobalStyle />
      <VideoSection>
        <VideoBackground
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={handleVideoLoad}
          src="https://opct.blob.core.windows.net/videos/opct%EC%9D%BC%EB%B0%98%EC%98%81%EC%83%81/%EA%B4%91%EA%B3%A0/OPCT%20Projection.mp4?sp=r&st=2024-12-31T01:14:50Z&se=2030-12-31T09:14:50Z&sv=2022-11-02&sr=b&sig=A5ZYennqaXc4eqJyOGpkKkutOsysKT0XElB8wv6LwlY%3D"
        />
        <VideoOverlay>
          <MainTitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Your <span>Optimal Life</span><br />
              with AI Agent
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Choose Your Perfect AI Partner
            </motion.p>
          </MainTitle>
          <ScrollDownIndicator
            onClick={scrollToContent}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Explore Agents
          </ScrollDownIndicator>
        </VideoOverlay>
      </VideoSection>

      <Content ref={contentRef}>
        {[
          {
            category: 'EXPERT AGENTS',
            description: 'Ready to transform your life with professional guidance? Our expert AI agents are masters in fitness, yoga, and nutrition. Whether you want to build muscle, find inner peace, or optimize your diet, our specialists are here 24/7 to guide your journey.',
            chars: characters.filter(char => char.category === '전문가')
          },
          {
            category: 'COUNSELOR AGENTS',
            description: 'Feeling stressed or need emotional support? Our counselor AI agents are here to listen and understand. With empathy and professional guidance, they help you navigate life\'s challenges and find your inner balance.',
            chars: characters.filter(char => char.category === '상담사')
          },
          {
            category: 'HEALTHY FRIEND AGENTS',
            description: 'Looking for a fun and motivating workout companion? Our friendly AI agents are here to make your fitness journey enjoyable. From casual runs to gym sessions, find your perfect workout buddy who matches your style and energy.',
            chars: characters.filter(char => char.category === '친구')
          }
        ].map(({ category, description, chars }) => (
          <CategorySection key={category}>
            <CategoryTitle>
              <h2>{category}</h2>
              <p>{description}</p>
            </CategoryTitle>
            <CharacterGrid>
              {chars.map((character) => (
                <CharacterCard
                  key={character.id}
                  $selected={selectedCharacter?.id === character.id}
                  onClick={() => handleCharacterClick(character)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ImageContainer>
                    <CharacterImage src={character.image} alt={character.name} />
                    <CardInfo>
                      <CharacterName>{character.name}</CharacterName>
                      <CharacterRole>{character.role}</CharacterRole>
                    </CardInfo>
                  </ImageContainer>
                </CharacterCard>
              ))}
            </CharacterGrid>
          </CategorySection>
        ))}

        {selectedCharacter && (
          <DetailOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DetailContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CloseButton onClick={handleClose} />
              <DetailHeader>
                <h2>{selectedCharacter.name}</h2>
                <p>{selectedCharacter.role}</p>
              </DetailHeader>

              <DetailSection>
                <p>{selectedCharacter.description}</p>
              </DetailSection>

              <DetailSection>
                <h3>PERSONALITY</h3>
                <p>{selectedCharacter.personality}</p>
              </DetailSection>

              <DetailSection>
                <h3>SPECIALTIES</h3>
                <SpecialtyGrid>
                  {selectedCharacter.specialties.map((specialty, index) => (
                    <SpecialtyItem key={index}>
                      {specialty}
                    </SpecialtyItem>
                  ))}
                </SpecialtyGrid>
              </DetailSection>

              <StartButton onClick={handleStartChat}>
                START CONVERSATION
              </StartButton>
            </DetailContent>
          </DetailOverlay>
        )}
      </Content>
    </Container>
  );
}