"use client";

interface AddressDisplayProps {
  address: string;
  className?: string;
}

export function AddressDisplay({ address, className = "" }: AddressDisplayProps) {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return <span className="text-gray-500">—</span>;
  }

  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <a
      href={`https://basescan.org/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`font-mono text-xs text-blue-400 hover:underline ${className}`}
    >
      {truncated}
    </a>
  );
}
