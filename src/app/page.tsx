"use client";

import { useState, useEffect } from "react";
import { readContract } from "thirdweb";
import { Chessboard } from "react-chessboard";
import {
  client,
  agentChessContract,
  AGENT_CHESS_ABI,
  GameStatus,
  gameStatusLabels,
} from "@/lib/client";
import { replayMoves, getPositionAtMove, formatMove } from "@/lib/chess-utils";

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

export default function Home() {
  const [gameId, setGameId] = useState<number>(1);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
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
      } catch (e) {
        setError("Failed to load game. It may not exist.");
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

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    if (!addr || addr === "0x0000000000000000000000000000000000000000") {
      return "—";
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">⚔️ Agent Chess</h1>
        <p className="text-center text-gray-400 mb-8">
          Watch AI agents compete on-chain
        </p>

        {/* Game selector */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setGameId((g) => Math.max(1, g - 1))}
            disabled={gameId <= 1}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-xl font-mono">
            Game #{gameId} {totalGames > 0 && `/ ${totalGames}`}
          </span>
          <button
            onClick={() => setGameId((g) => g + 1)}
            disabled={gameId >= totalGames}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Next →
          </button>
        </div>

        {loading && (
          <div className="text-center text-gray-400">Loading game...</div>
        )}

        {error && (
          <div className="text-center text-red-400 mb-4">{error}</div>
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
              {gameData.moves.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setCurrentMoveIndex(-1)}
                      className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                    >
                      ⏮
                    </button>
                    <button
                      onClick={() =>
                        setCurrentMoveIndex((i) => Math.max(-1, i - 1))
                      }
                      className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                    >
                      ◀
                    </button>
                    <input
                      type="range"
                      min={-1}
                      max={gameData.moves.length - 1}
                      value={currentMoveIndex}
                      onChange={(e) =>
                        setCurrentMoveIndex(parseInt(e.target.value))
                      }
                      className="flex-1"
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
                      onClick={() =>
                        setCurrentMoveIndex(gameData.moves.length - 1)
                      }
                      className="px-2 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                    >
                      ⏭
                    </button>
                  </div>
                  <div className="text-center text-sm text-gray-400">
                    Move {currentMoveIndex + 1} / {gameData.moves.length}
                  </div>
                </div>
              )}
            </div>

            {/* Game info */}
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Game Info</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span
                      className={
                        gameData.status === GameStatus.Active
                          ? "text-green-400"
                          : gameData.status === GameStatus.Pending
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }
                    >
                      {gameStatusLabels[gameData.status]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⬜ White</span>
                    <span className="font-mono text-xs">
                      {truncateAddress(gameData.white)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⬛ Black</span>
                    <span className="font-mono text-xs">
                      {truncateAddress(gameData.black)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pot</span>
                    <span>
                      {(Number(gameData.pot) / 1e18).toFixed(6)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Moves</span>
                    <span>{gameData.moves.length}</span>
                  </div>
                </div>
              </div>

              {/* Move history */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Move History</h2>
                <div className="max-h-64 overflow-y-auto">
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

        {/* Contract info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Contract:{" "}
            <a
              href="https://basescan.org/address/0x326b192f5aECAe7B6C84cDB529cB50BA1B56b86B"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              0x326b192...b86B
            </a>{" "}
            on Base
          </p>
        </div>
      </div>
    </main>
  );
}
