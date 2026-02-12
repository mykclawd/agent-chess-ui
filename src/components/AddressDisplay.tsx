"use client";

import {
  AccountProvider,
  AccountAvatar,
  AccountName,
  AccountAddress,
} from "thirdweb/react";
import { client } from "@/lib/client";

interface AddressDisplayProps {
  address: string;
  showAvatar?: boolean;
  className?: string;
}

export function AddressDisplay({ address, showAvatar = true, className = "" }: AddressDisplayProps) {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return <span className="text-gray-500">—</span>;
  }

  return (
    <AccountProvider address={address} client={client}>
      <a
        href={`https://basescan.org/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 text-blue-400 hover:underline ${className}`}
      >
        {showAvatar && (
          <AccountAvatar
            className="w-6 h-6 rounded-full"
            loadingComponent={
              <div className="w-6 h-6 rounded-full bg-gray-700 animate-pulse" />
            }
            fallbackComponent={
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                {address.slice(2, 4)}
              </div>
            }
          />
        )}
        <AccountName
          loadingComponent={<span className="font-mono text-xs">...</span>}
          fallbackComponent={
            <AccountAddress 
              formatFn={(addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`}
              className="font-mono text-xs"
            />
          }
        />
      </a>
    </AccountProvider>
  );
}
