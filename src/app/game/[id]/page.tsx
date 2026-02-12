"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { readContract } from "thirdweb";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  client,
  agentChessContract,
  GameStatus,
  gameStatusLabels,
} from "@/lib/client";
import { getPositionAtMove, formatMove } from "@/lib/chess-utils";
import { AddressDisplay } from "@/components/AddressDisplay";
import { BettingPanel } from "@/components/BettingPanel";
import { ConnectButton } from "thirdweb/react";

// Dynamically import Chessboard to avoid SSR issues
const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false, loading: () => <div className="w-[400px] h-[400px] bg-gray-800 animate-pulse rounded" /> }
);

interface GameData {
  white: string;
  black: string;
  pot: bigint;
  stakeMultiplier: bigint;
  lastMoveTime: bigint;
  moveCount: bigint;
  status: GameStatus;
  moves: number[];
}

export default function GamePage() {
  const params = useParams();
  const gameId = parseInt(params.id as string);
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalGames, setTotalGames] = useState<number>(0);

  // Fetch total game count
  useEffect(() => {
    async function fetchGameCount() {
      try {
        const count = await readContract({
          contract: agentChessContract,
          method: "function gameCount() view returns (uint256)",
          params: [],
        });
        setTotalGames(Number(count));
      } catch (e) {
        console.error("Failed to fetch game count:", e);
      }
    }
    fetchGameCount();
  }, []);

  // Fetch game data
  useEffect(() => {
    async function fetchGame() {
      setLoading(true);
      setError(null);
      try {
        const [gameInfo, moves] = await Promise.all([
          readContract({
            contract: agentChessContract,
            method:
              "function getGame(uint256 gameId) view returns (address white, address black, uint256 pot, uint256 stakeMultiplier, uint256 lastMoveTime, uint256 moveCount, uint8 status)",
            params: [BigInt(gameId)],
          }),
          readContract({
            contract: agentChessContract,
            method: "function getGameMoves(uint256 gameId) view returns (uint16[])",
            params: [BigInt(gameId)],
          }),
        ]);

        if (gameInfo[6] === 0) {
          setError("Game not found");
          setGameData(null);
        } else {
          setGameData({
            white: gameInfo[0],
            black: gameInfo[1],
            pot: gameInfo[2],
            stakeMultiplier: gameInfo[3],
            lastMoveTime: gameInfo[4],
            moveCount: gameInfo[5],
            status: gameInfo[6] as GameStatus,
            moves: moves.map((m) => Number(m)),
          });
          setCurrentMoveIndex(moves.length - 1);
        }
      } catch (e) {
        setError("Failed to load game");
        setGameData(null);
      }
      setLoading(false);
    }
    fetchGame();
  }, [gameId]);

  // Get current board position
  const getCurrentPosition = () => {
    if (!gameData || gameData.moves.length === 0) {
      return "start";
    }
    if (currentMoveIndex < 0) {
      return "start";
    }
    const chess = getPositionAtMove(gameData.moves, currentMoveIndex);
    return chess.fen();
  };

  // Whose turn is it?
  const getCurrentTurn = () => {
    if (!gameData) return null;
    if (gameData.status !== GameStatus.Active) return null;
    return gameData.moves.length % 2 === 0 ? "white" : "black";
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-400 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Game #{gameId}</h1>
          <div className="flex items-center gap-4">
            <ConnectButton client={client} />
          </div>
        </div>

        {/* Game selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Link
            href={`/game/${Math.max(1, gameId - 1)}`}
            className={`px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 ${
              gameId <= 1 ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            ← Prev
          </Link>
          <span className="text-xl font-mono">#{gameId}</span>
          <Link
            href={`/game/${gameId + 1}`}
            className={`px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 ${
              gameId >= totalGames ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            Next →
          </Link>
        </div>

        {loading && (
          <div className="text-center text-gray-400 py-12">Loading game...</div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/" className="text-blue-400 hover:underline">
              Back to Home
            </Link>
          </div>
        )}

        {gameData && (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Chess board */}
            <div>
              <Chessboard
                position={getCurrentPosition()}
                boardWidth={400}
                arePiecesDraggable={false}
                customDarkSquareStyle={{ backgroundColor: "#779952" }}
                customLightSquareStyle={{ backgroundColor: "#edeed1" }}
              />

              {/* Move scrubber */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setCurrentMoveIndex(-1)}
                    className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={() => setCurrentMoveIndex((i) => Math.max(-1, i - 1))}
                    className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                  >
                    ◀
                  </button>
                  <input
                    type="range"
                    min={-1}
                    max={Math.max(0, gameData.moves.length - 1)}
                    value={currentMoveIndex}
                    onChange={(e) => setCurrentMoveIndex(parseInt(e.target.value))}
                    className="flex-1"
                    disabled={gameData.moves.length === 0}
                  />
                  <button
                    onClick={() =>
                      setCurrentMoveIndex((i) =>
                        Math.min(gameData.moves.length - 1, i + 1)
                      )
                    }
                    className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                  >
                    ▶
                  </button>
                  <button
                    onClick={() => setCurrentMoveIndex(gameData.moves.length - 1)}
                    className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                  >
                    ⏭
                  </button>
                </div>
                <div className="text-center text-sm text-gray-400">
                  {gameData.moves.length === 0
                    ? "No moves yet"
                    : `Move ${currentMoveIndex + 1} / ${gameData.moves.length}`}
                </div>
              </div>
            </div>

            {/* Game info */}
            <div className="space-y-4">
              {/* Status badge */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Status</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      gameData.status === GameStatus.Active
                        ? "bg-green-900 text-green-300"
                        : gameData.status === GameStatus.Pending
                        ? "bg-yellow-900 text-yellow-300"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {gameStatusLabels[gameData.status]}
                  </span>
                </div>

                {getCurrentTurn() && (
                  <div className="text-center py-2 bg-gray-800 rounded">
                    <span className="text-2xl mr-2">
                      {getCurrentTurn() === "white" ? "⬜" : "⬛"}
                    </span>
                    <span className="font-semibold">
                      {getCurrentTurn()}&apos;s turn
                    </span>
                  </div>
                )}
              </div>

              {/* Players */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Players</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⬜</span>
                      <span>White</span>
                    </div>
                    <AddressDisplay address={gameData.white} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⬛</span>
                      <span>Black</span>
                    </div>
                    <AddressDisplay address={gameData.black} />
                  </div>
                </div>
              </div>

              {/* Economics */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Economics</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pot</span>
                    <span className="font-mono">
                      {(Number(gameData.pot) / 1e18).toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stake Multiplier</span>
                    <span>{gameData.stakeMultiplier.toString()}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cost per Move</span>
                    <span className="font-mono">
                      {(0.0001 * Number(gameData.stakeMultiplier)).toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Moves Played</span>
                    <span>{gameData.moves.length}</span>
                  </div>
                </div>
              </div>

              {/* Betting */}
              <BettingPanel 
                gameId={gameId} 
                gameStatus={gameData.status}
                onBetPlaced={() => {
                  // Refresh game data
                }}
              />

              {/* Move history */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Move History</h2>
                <div className="max-h-48 overflow-y-auto">
                  {gameData.moves.length === 0 ? (
                    <p className="text-gray-400 text-sm">No moves yet</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 text-sm font-mono">
                      {gameData.moves.map((move, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentMoveIndex(idx)}
                          className={`text-left px-2 py-1 rounded ${
                            idx === currentMoveIndex
                              ? "bg-blue-600"
                              : "hover:bg-gray-800"
                          }`}
                        >
                          {Math.floor(idx / 2) + 1}.
                          {idx % 2 === 0 ? "" : ".."} {formatMove(move)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
