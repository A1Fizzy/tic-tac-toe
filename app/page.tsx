'use client'
import React, { useState } from 'react';
import { Slider } from "@/components/ui/slider"
import { Circle, X } from 'lucide-react';

// Типы
type Player = 'X' | 'O' | null;
type Board = Player[];
type Result = 'win' | 'lose' | 'draw' | null;

const App: React.FC = () => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [gameResult, setGameResult] = useState<Result>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<number>(40); // 0-100%

  // Проверка победы
  const calculateWinner = (squares: Board): Player => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  // Проверка на ничью
  const isBoardFull = (squares: Board): boolean => {
    return squares.every((square) => square !== null);
  };

  // Ход игрока
  const handleClick = (index: number) => {
    if (board[index] || gameResult || isAiThinking) return;

    setIsAiThinking(true);

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const winner = calculateWinner(newBoard);
    if (winner) {
      setGameResult('win');
      return;
    }
    if (isBoardFull(newBoard)) {
      setGameResult('draw');
      return;
    }

    // Ход ИИ
    setTimeout(() => {
      const aiMoveIndex = findBestMoveHeuristic(newBoard, difficulty);
      const updatedBoard = [...newBoard];
      updatedBoard[aiMoveIndex] = 'O';
      setBoard(updatedBoard);

      const aiWinner = calculateWinner(updatedBoard);
      if (aiWinner) {
        setGameResult('lose');
      } else if (isBoardFull(updatedBoard)) {
        setGameResult('draw');
      }

      setIsAiThinking(false);
    }, 600);
  };

  // ========== ЭВРИСТИЧЕСКИЙ ИИ ==========

  // Универсальный метод: может ли symbol выиграть следующим ходом?
  const getWinningMove = (board: Board, symbol: Player): number | null => {
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = symbol;
        if (calculateWinner(testBoard) === symbol) {
          return i;
        }
      }
    }
    return null;
  };

  // Подсчёт количества потенциальных победных ходов для symbol
  const countWinningMoves = (board: Board, symbol: Player): number => {
    let count = 0;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = symbol;
        if (calculateWinner(testBoard) === symbol) {
          count++;
        }
      }
    }
    return count;
  };

  // Попытка создать вилку (≥2 способа победить следующим ходом)
  const tryForkMove = (board: Board, symbol: Player): number | null => {
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        const testBoard = [...board];
        testBoard[i] = symbol;
        if (countWinningMoves(testBoard, symbol) >= 2) {
          return i;
        }
      }
    }
    return null;
  };

  // Занять противоположный угол, если игрок в углу
  const tryOppositeCorner = (board: Board): number | null => {
    const corners = [
      { idx: 0, opp: 8 },
      { idx: 2, opp: 6 },
      { idx: 6, opp: 2 },
      { idx: 8, opp: 0 },
    ];
    for (const { idx, opp } of corners) {
      if (board[idx] === 'X' && board[opp] === null) {
        return opp;
      }
    }
    return null;
  };

  // Занять любой свободный угол
  const tryCornerMove = (board: Board): number | null => {
    const corners = [0, 2, 6, 8];
    for (const idx of corners) {
      if (board[idx] === null) return idx;
    }
    return null;
  };

  // Занять любую боковую клетку
  const trySideMove = (board: Board): number | null => {
    const sides = [1, 3, 5, 7];
    for (const idx of sides) {
      if (board[idx] === null) return idx;
    }
    return null;
  };

  // Случайный ход
  const getRandomMove = (board: Board): number => {
    const emptyIndices = board.map((cell, idx) => cell === null ? idx : -1).filter(idx => idx !== -1);
    return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
  };

  // Основной метод выбора хода ИИ — ЭВРИСТИКА + СЛОЖНОСТЬ
  const findBestMoveHeuristic = (board: Board, difficulty: number): number => {
    // 1. Победить, если можно
    const winMove = getWinningMove(board, 'O');
    if (winMove !== null) return winMove;

    // 2. Блокировать победу игрока
    const blockMove = getWinningMove(board, 'X');
    if (blockMove !== null) return blockMove;

    // Решаем, играть ли оптимально
    const playOptimally = Math.random() * 100 < difficulty;

    if (playOptimally) {
      // Оптимальная стратегия
      // 3. Создать вилку
      const forkMove = tryForkMove(board, 'O');
      if (forkMove !== null) return forkMove;

      // 4. Блокировать вилку игрока
      const playerFork = tryForkMove(board, 'X');
      if (playerFork !== null) return playerFork;

      // 5. Центр
      if (board[4] === null) return 4;

      // 6. Противоположный угол
      const oppCorner = tryOppositeCorner(board);
      if (oppCorner !== null) return oppCorner;

      // 7. Угол
      const cornerMove = tryCornerMove(board);
      if (cornerMove !== null) return cornerMove;

      // 8. Сторона
      const sideMove = trySideMove(board);
      if (sideMove !== null) return sideMove;
    } else {
      // Случайная стратегия — 6 вариантов
      const randomStrategy = Math.floor(Math.random() * 6);
      switch (randomStrategy) {
        case 0:
          return trySideMove(board) ?? tryCornerMove(board) ?? getRandomMove(board);
        case 1:
          return tryCornerMove(board) ?? trySideMove(board) ?? getRandomMove(board);
        case 2:
          if (board[4] === null && Math.random() > 0.5) return 4;
          return getRandomMove(board);
        case 3:
          return tryOppositeCorner(board) ?? tryForkMove(board, 'O') ?? getRandomMove(board);
        case 4:
          return getRandomMove(board);
        case 5:
          if (Math.random() > 0.5) {
            return trySideMove(board) ?? getRandomMove(board);
          } else {
            return tryCornerMove(board) ?? getRandomMove(board);
          }
        default:
          return getRandomMove(board);
      }
    }

    // fallback
    return getRandomMove(board);
  };

  // Сброс игры
  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setGameResult(null);
    setIsAiThinking(false);
  };

  // Рендер ячейки
  const renderSquare = (index: number) => {
    const value = board[index];
    const isX = value === 'X';
    const isO = value === 'O';

    return (
      <button
        className={`
          w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32
          text-4xl sm:text-5xl md:text-6xl font-bold
          bg-white hover:bg-gray-50
          border-2 border-gray-300
          flex items-center justify-center
          transition-colors duration-200
          disabled:cursor-not-allowed
          shadow-sm
          ${isX ? 'text-blue-600' : isO ? 'text-red-500' : 'text-gray-400'}
        `}
        onClick={() => handleClick(index)}
        disabled={!!value || !!gameResult || isAiThinking}
        aria-label={`Cell ${index + 1}`}
      >
        {isX ? <X className='size-24'/> :  isO ?  <Circle className='size-20' /> : <p></p>}
      </button>
    );
  };

  // Сообщение о результате
  const renderStatus = () => {
    if (gameResult === 'win')
      return (
        <div className="mt-6 text-2xl font-bold text-green-600 animate-pulse">
          Вы победили!
        </div>
      );
    if (gameResult === 'lose')
      return (
        <div className="mt-6 text-2xl font-bold text-red-600 animate-bounce">
          ИИ победил!
        </div>
      );
    if (gameResult === 'draw')
      return (
        <div className="mt-6 text-2xl font-bold text-gray-700">
          Ничья!
        </div>
      );
    if (isAiThinking)
      return (
        <div className="mt-6 text-xl text-gray-600 italic">
          ИИ думает... ({difficulty}% оптимальности)
        </div>
      );
    return (
      <div className="mt-6 text-xl font-medium text-blue-700">
        Ваш ход (❌)
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-200 p-4">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2 drop-shadow-sm">
        Крестики-нолики
      </h1>
      <h2 className="text-lg sm:text-xl text-gray-600 mb-6">
        Против эвристического ИИ 🤖
      </h2>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
        {Array(9)
          .fill(null)
          .map((_, i) => (
            <React.Fragment key={i}>{renderSquare(i)}</React.Fragment>
          ))}
      </div>

      {/* Ползунок сложности */}
      <div className="mb-8 w-full max-w-md px-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Сложность ИИ: <span className="font-bold">{difficulty}%</span> (чем выше — тем умнее)
        </label>
        <Slider
          value={[difficulty]}
          max={100}
          step={1}
          onValueChange={(values) => setDifficulty(values[0])}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Случайно 🎲</span>
          <span>Идеально 🧠</span>
        </div>
      </div>

      {renderStatus()}

      <button
        className="
          mt-8 px-6 py-3
          bg-indigo-600 hover:bg-indigo-700
          text-white font-bold text-lg
          rounded-lg shadow-md
          transform hover:scale-105 transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-indigo-300
        "
        onClick={resetGame}
      >
        Новая игра
      </button>

    </div>
  );
};

export default App;