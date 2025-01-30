import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CharacterSelect } from './CharacterSelect';
import ChatPage from './pages/chat/jay';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #000000;
  color: #ffffff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(57, 255, 20, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }
`;

const BackgroundLines = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(90deg, rgba(57, 255, 20, 0.03) 1px, transparent 1px) 0 0 / 50px 50px,
    linear-gradient(rgba(57, 255, 20, 0.03) 1px, transparent 1px) 0 0 / 50px 50px;
  pointer-events: none;
  z-index: 0;
`;

const ContentContainer = styled(motion.div)`
  position: relative;
  z-index: 2;
`;

const pageTransition: Variants = {
  initial: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.5 }
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.5 }
  }
};

export function App() {
  useEffect(() => {
    // 페이지 로드 시 스무스 스크롤 활성화
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <Router>
      <AppContainer>
        <BackgroundLines />
        <AnimatePresence mode="wait">
          <ContentContainer
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <Routes>
              <Route path="/" element={<CharacterSelect />} />
              <Route path="/chat/jay" element={<ChatPage />} />
            </Routes>
          </ContentContainer>
        </AnimatePresence>
      </AppContainer>
    </Router>
  );
} 