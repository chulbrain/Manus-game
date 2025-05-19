import React, { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound';
import { Button } from './ui/button';
import '../styles/Game.css';

// 이미지 및 사운드 임포트
import moleImage from '../assets/images/mole_game.png';
import startupSound from '../assets/sounds/startup.mp3';

interface MoleState {
  isVisible: boolean;
  position: number;
  expression: number; // 0: 기본, 1: 모자, 2: 콧수염, 3: 화난, 4: 숨은, 5: 혀 내민
}

const Game: React.FC = () => {
  // 게임 상태 관리
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<string>('보통');
  const [highScores, setHighScores] = useState<number[]>([]);
  const [moles, setMoles] = useState<MoleState[]>([]);
  const [playStartSound] = useSound(startupSound);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const moleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 구멍 수 증가 (사용자 요청에 따라 9개로 설정)
  const HOLES_COUNT = 9;

  // 게임 초기화
  const initializeGame = () => {
    const initialMoles = Array(HOLES_COUNT).fill(null).map((_, index) => ({
      isVisible: false,
      position: index,
      expression: Math.floor(Math.random() * 6)
    }));
    setMoles(initialMoles);
    setScore(0);
    setTimeLeft(30);
    
    // 로컬 스토리지에서 최고 점수 불러오기
    const savedScores = localStorage.getItem('whackAMoleHighScores');
    if (savedScores) {
      setHighScores(JSON.parse(savedScores));
    }
  };

  // 게임 시작
  const startGame = () => {
    playStartSound();
    initializeGame();
    setGameStarted(true);
    
    // 타이머 설정
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          endGame();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    // 두더지 등장 간격 설정
    const difficultySpeed = getDifficultySpeed();
    moleIntervalRef.current = setInterval(() => {
      showRandomMole();
    }, difficultySpeed);
  };

  // 난이도에 따른 속도 설정
  const getDifficultySpeed = (): number => {
    switch (difficulty) {
      case '쉬움':
        return 1500;
      case '보통':
        return 1000;
      case '어려움':
        return 700;
      default:
        return 1000;
    }
  };

  // 랜덤 두더지 표시
  const showRandomMole = () => {
    setMoles(prevMoles => {
      const newMoles = [...prevMoles];
      
      // 현재 보이는 두더지들 숨기기 (일정 확률로)
      newMoles.forEach((mole, index) => {
        if (mole.isVisible && Math.random() > 0.5) {
          newMoles[index] = { ...mole, isVisible: false };
        }
      });
      
      // 새로운 두더지 표시하기
      const hiddenMoles = newMoles.map((mole, index) => ({ mole, index })).filter(item => !item.mole.isVisible);
      if (hiddenMoles.length > 0) {
        const randomIndex = Math.floor(Math.random() * hiddenMoles.length);
        const moleIndex = hiddenMoles[randomIndex].index;
        newMoles[moleIndex] = {
          ...newMoles[moleIndex],
          isVisible: true,
          expression: Math.floor(Math.random() * 6)
        };
      }
      
      return newMoles;
    });
  };

  // 두더지 클릭 처리
  const handleMoleClick = (index: number) => {
    if (!gameStarted) return;
    
    setMoles(prevMoles => {
      const newMoles = [...prevMoles];
      if (newMoles[index].isVisible) {
        newMoles[index] = { ...newMoles[index], isVisible: false };
        setScore(prevScore => prevScore + 1);
      }
      return newMoles;
    });
  };

  // 게임 종료
  const endGame = () => {
    setGameStarted(false);
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    if (moleIntervalRef.current) {
      clearInterval(moleIntervalRef.current);
    }
    
    // 최고 점수 업데이트
    const newHighScores = [...highScores, score].sort((a, b) => b - a).slice(0, 5);
    setHighScores(newHighScores);
    localStorage.setItem('whackAMoleHighScores', JSON.stringify(newHighScores));
  };

  // 난이도 변경
  const changeDifficulty = (newDifficulty: string) => {
    setDifficulty(newDifficulty);
  };

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
      if (moleIntervalRef.current) {
        clearInterval(moleIntervalRef.current);
      }
    };
  }, []);

  // 초기 로드 시 게임 초기화
  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div className="game-container">
      <h1 className="game-title">레트로 두더지 게임</h1>
      
      <div className="game-info">
        <div className="score-display">점수: {score}</div>
        <div className="time-display">시간: {timeLeft}초</div>
      </div>
      
      <div className="difficulty-selector">
        <Button 
          onClick={() => changeDifficulty('쉬움')} 
          variant={difficulty === '쉬움' ? 'default' : 'outline'}
          className="difficulty-button"
        >
          쉬움
        </Button>
        <Button 
          onClick={() => changeDifficulty('보통')} 
          variant={difficulty === '보통' ? 'default' : 'outline'}
          className="difficulty-button"
        >
          보통
        </Button>
        <Button 
          onClick={() => changeDifficulty('어려움')} 
          variant={difficulty === '어려움' ? 'default' : 'outline'}
          className="difficulty-button"
        >
          어려움
        </Button>
      </div>
      
      {!gameStarted ? (
        <Button onClick={startGame} className="start-button">
          게임 시작
        </Button>
      ) : null}
      
      <div className="game-board">
        {moles.map((mole, index) => (
          <div 
            key={index} 
            className={`mole-hole ${mole.isVisible ? 'active' : ''}`}
            onClick={() => handleMoleClick(index)}
          >
            {mole.isVisible && (
              <div className={`mole mole-expression-${mole.expression}`}>
                <img src={moleImage} alt="두더지" className="mole-image" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="high-scores">
        <h2>최고 점수</h2>
        <ul>
          {highScores.map((highScore, index) => (
            <li key={index}>{index + 1}. {highScore}점</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Game;
