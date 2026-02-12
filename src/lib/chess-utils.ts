import { Chess } from "chess.js";

// Decode uint16 move to from/to squares
// Format: fromSquare (6 bits) | toSquare (6 bits) | promotionPiece (4 bits)
export function decodeMove(move: number): { from: string; to: string; promotion?: string } {
  const fromSquare = move & 0x3f;
  const toSquare = (move >> 6) & 0x3f;
  const promotion = (move >> 12) & 0x0f;

  const from = squareToAlgebraic(fromSquare);
  const to = squareToAlgebraic(toSquare);

  // Promotion piece: 0=none, 1=knight, 2=bishop, 3=rook, 4=queen
  const promotionPieces: Record<number, string> = {
    1: "n",
    2: "b",
    3: "r",
    4: "q",
  };

  return {
    from,
    to,
    promotion: promotionPieces[promotion],
  };
}

// Convert square index (0-63) to algebraic notation (a1-h8)
function squareToAlgebraic(square: number): string {
  const file = String.fromCharCode(97 + (square % 8)); // a-h
  const rank = Math.floor(square / 8) + 1; // 1-8
  return `${file}${rank}`;
}

// Replay moves from uint16 array and return the final position
export function replayMoves(moves: number[]): Chess {
  const chess = new Chess();

  for (const moveInt of moves) {
    const { from, to, promotion } = decodeMove(moveInt);
    try {
      chess.move({ from, to, promotion });
    } catch (e) {
      console.error(`Invalid move: ${from} -> ${to}`, e);
      break;
    }
  }

  return chess;
}

// Get the board position at a specific move index
export function getPositionAtMove(moves: number[], moveIndex: number): Chess {
  const chess = new Chess();

  for (let i = 0; i <= moveIndex && i < moves.length; i++) {
    const { from, to, promotion } = decodeMove(moves[i]);
    try {
      chess.move({ from, to, promotion });
    } catch (e) {
      console.error(`Invalid move at index ${i}: ${from} -> ${to}`, e);
      break;
    }
  }

  return chess;
}

// Format move for display (e.g., "e2e4" or "e7e8=Q")
export function formatMove(move: number): string {
  const { from, to, promotion } = decodeMove(move);
  if (promotion) {
    return `${from}${to}=${promotion.toUpperCase()}`;
  }
  return `${from}${to}`;
}
