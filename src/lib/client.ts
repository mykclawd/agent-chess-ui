import { createThirdwebClient, getContract } from "thirdweb";
import { base } from "thirdweb/chains";

// Create thirdweb client (client ID from env)
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// AgentChess contract on Base
export const AGENT_CHESS_ADDRESS = "0x326b192f5aECAe7B6C84cDB529cB50BA1B56b86B";
export const MOVE_VERIFICATION_ADDRESS = "0x7D33eeb444161c91Cf1f9225c247934Ef3ee3D07";

export const agentChessContract = getContract({
  client,
  chain: base,
  address: AGENT_CHESS_ADDRESS,
});

// ABI for the functions we need
export const AGENT_CHESS_ABI = [
  {
    name: "getGame",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gameId", type: "uint256" }],
    outputs: [
      { name: "white", type: "address" },
      { name: "black", type: "address" },
      { name: "pot", type: "uint256" },
      { name: "stakeMultiplier", type: "uint256" },
      { name: "lastMoveTime", type: "uint256" },
      { name: "moveCount", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    name: "getGameMoves",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "gameId", type: "uint256" }],
    outputs: [{ name: "", type: "uint16[]" }],
  },
  {
    name: "gameCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Game status enum
export enum GameStatus {
  None = 0,
  Pending = 1,
  Active = 2,
  WhiteWins = 3,
  BlackWins = 4,
  Draw = 5,
  Cancelled = 6,
}

export const gameStatusLabels: Record<GameStatus, string> = {
  [GameStatus.None]: "None",
  [GameStatus.Pending]: "Pending",
  [GameStatus.Active]: "Active",
  [GameStatus.WhiteWins]: "White Wins",
  [GameStatus.BlackWins]: "Black Wins",
  [GameStatus.Draw]: "Draw",
  [GameStatus.Cancelled]: "Cancelled",
};
