"use client";

import { useState, useEffect } from "react";
import { readContract, prepareContractCall, sendTransaction } from "thirdweb";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { agentChessContract, GameStatus } from "@/lib/client";

// Helper to format ETH
const formatEth = (wei: bigint): string => {
  return (Number(wei) / 1e18).toFixed(4);
};

// Helper to parse ETH string to wei
const parseEth = (eth: string): bigint => {
  const [whole, decimal = ""] = eth.split(".");
  const paddedDecimal = decimal.padEnd(18, "0").slice(0, 18);
  return BigInt(whole + paddedDecimal);
};

interface BettingPanelProps {
  gameId: number;
  gameStatus: GameStatus;
  onBetPlaced?: () => void;
}

export function BettingPanel({ gameId, gameStatus, onBetPlaced }: BettingPanelProps) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  
  const [whitePool, setWhitePool] = useState<bigint>(0n);
  const [blackPool, setBlackPool] = useState<bigint>(0n);
  const [userWhiteBet, setUserWhiteBet] = useState<bigint>(0n);
  const [userBlackBet, setUserBlackBet] = useState<bigint>(0n);
  const [userClaimed, setUserClaimed] = useState(false);
  const [betAmount, setBetAmount] = useState("0.01");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch betting info
  useEffect(() => {
    async function fetchBettingInfo() {
      try {
        const [poolInfo, userBet] = await Promise.all([
          readContract({
            contract: agentChessContract,
            method: "function getBettingInfo(uint256 gameId) view returns (uint256 whitePool, uint256 blackPool, uint256 totalPool)",
            params: [BigInt(gameId)],
          }),
          account ? readContract({
            contract: agentChessContract,
            method: "function getUserBet(uint256 gameId, address user) view returns (uint256 amountOnWhite, uint256 amountOnBlack, bool claimed)",
            params: [BigInt(gameId), account.address],
          }) : null,
        ]);

        setWhitePool(poolInfo[0]);
        setBlackPool(poolInfo[1]);
        
        if (userBet) {
          setUserWhiteBet(userBet[0]);
          setUserBlackBet(userBet[1]);
          setUserClaimed(userBet[2]);
        }
      } catch (e) {
        console.error("Failed to fetch betting info:", e);
      }
    }

    fetchBettingInfo();
    const interval = setInterval(fetchBettingInfo, 10000);
    return () => clearInterval(interval);
  }, [gameId, account]);

  const canBet = gameStatus === GameStatus.Pending || gameStatus === GameStatus.Active;
  const gameEnded = gameStatus === GameStatus.WhiteWins || 
                    gameStatus === GameStatus.BlackWins || 
                    gameStatus === GameStatus.Draw ||
                    gameStatus === GameStatus.Cancelled;
  
  const totalPool = whitePool + blackPool;
  const whiteOdds = totalPool > 0n ? Number(blackPool) / Number(whitePool) : 1;
  const blackOdds = totalPool > 0n ? Number(whitePool) / Number(blackPool) : 1;

  const handlePlaceBet = async (onWhite: boolean) => {
    if (!account || !wallet) {
      setError("Connect wallet to bet");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const value = parseEth(betAmount);
      
      const tx = prepareContractCall({
        contract: agentChessContract,
        method: "function placeBet(uint256 gameId, bool onWhite) payable",
        params: [BigInt(gameId), onWhite],
        value,
      });

      await sendTransaction({
        transaction: tx,
        account,
      });

      onBetPlaced?.();
      // Refresh betting info
      const poolInfo = await readContract({
        contract: agentChessContract,
        method: "function getBettingInfo(uint256 gameId) view returns (uint256 whitePool, uint256 blackPool, uint256 totalPool)",
        params: [BigInt(gameId)],
      });
      setWhitePool(poolInfo[0]);
      setBlackPool(poolInfo[1]);
      
      const userBet = await readContract({
        contract: agentChessContract,
        method: "function getUserBet(uint256 gameId, address user) view returns (uint256 amountOnWhite, uint256 amountOnBlack, bool claimed)",
        params: [BigInt(gameId), account.address],
      });
      setUserWhiteBet(userBet[0]);
      setUserBlackBet(userBet[1]);
    } catch (e: any) {
      setError(e.message || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimWinnings = async () => {
    if (!account || !wallet) {
      setError("Connect wallet to claim");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tx = prepareContractCall({
        contract: agentChessContract,
        method: "function claimWinnings(uint256 gameId)",
        params: [BigInt(gameId)],
      });

      await sendTransaction({
        transaction: tx,
        account,
      });

      setUserClaimed(true);
      onBetPlaced?.();
    } catch (e: any) {
      setError(e.message || "Failed to claim winnings");
    } finally {
      setLoading(false);
    }
  };

  const hasBet = userWhiteBet > 0n || userBlackBet > 0n;

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-3">💰 Betting Pool</h2>
      
      {/* Pool Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">⬜ White Pool</div>
          <div className="font-mono text-lg">{formatEth(whitePool)} ETH</div>
          {totalPool > 0n && (
            <div className="text-xs text-green-400">
              +{(whiteOdds * 100).toFixed(0)}% potential
            </div>
          )}
        </div>
        <div className="bg-gray-800 rounded p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">⬛ Black Pool</div>
          <div className="font-mono text-lg">{formatEth(blackPool)} ETH</div>
          {totalPool > 0n && (
            <div className="text-xs text-green-400">
              +{(blackOdds * 100).toFixed(0)}% potential
            </div>
          )}
        </div>
      </div>

      {/* User's Bets */}
      {hasBet && (
        <div className="bg-gray-800 rounded p-3 mb-4">
          <div className="text-xs text-gray-400 mb-2">Your Bets</div>
          <div className="flex gap-4 text-sm">
            {userWhiteBet > 0n && (
              <div>⬜ {formatEth(userWhiteBet)} ETH</div>
            )}
            {userBlackBet > 0n && (
              <div>⬛ {formatEth(userBlackBet)} ETH</div>
            )}
          </div>
        </div>
      )}

      {/* Betting Form */}
      {canBet && account && (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400">Bet Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full bg-gray-800 rounded px-3 py-2 mt-1 font-mono"
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePlaceBet(true)}
              disabled={loading}
              className="py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium disabled:opacity-50"
            >
              {loading ? "..." : "⬜ Bet White"}
            </button>
            <button
              onClick={() => handlePlaceBet(false)}
              disabled={loading}
              className="py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium disabled:opacity-50"
            >
              {loading ? "..." : "⬛ Bet Black"}
            </button>
          </div>
        </div>
      )}

      {/* Claim Winnings */}
      {gameEnded && hasBet && !userClaimed && account && (
        <button
          onClick={handleClaimWinnings}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-500 rounded font-medium disabled:opacity-50"
        >
          {loading ? "Claiming..." : "🏆 Claim Winnings"}
        </button>
      )}

      {userClaimed && (
        <div className="text-center text-green-400 py-2">
          ✅ Winnings claimed
        </div>
      )}

      {/* Connect Wallet Prompt */}
      {!account && canBet && (
        <div className="text-center text-gray-400 text-sm py-2">
          Connect wallet to place bets
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-red-400 text-sm mt-2">{error}</div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 mt-3">
        5% fee on winnings only. Draw/cancelled = full refund.
      </div>
    </div>
  );
}
