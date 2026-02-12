"use client";

import { useState, useEffect } from "react";
import { getSocialProfiles } from "thirdweb/social";
import { client } from "@/lib/client";

interface SocialProfile {
  type: string;
  name?: string;
  avatar?: string;
  bio?: string;
}

interface AddressDisplayProps {
  address: string;
  showAvatar?: boolean;
  className?: string;
}

export function AddressDisplay({ address, showAvatar = true, className = "" }: AddressDisplayProps) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!address || address === "0x0000000000000000000000000000000000000000") {
        setLoading(false);
        return;
      }

      try {
        const profiles = await getSocialProfiles({ address, client });
        // Prefer ENS, then Farcaster, then any other profile
        const ens = profiles.find((p: SocialProfile) => p.type === "ens");
        const farcaster = profiles.find((p: SocialProfile) => p.type === "farcaster");
        const primary = ens || farcaster || profiles[0];
        setProfile(primary || null);
      } catch (e) {
        console.error("Failed to fetch social profile:", e);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [address]);

  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "—";

  const displayName = profile?.name || truncatedAddress;
  const avatarUrl = profile?.avatar;

  return (
    <a
      href={`https://basescan.org/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-blue-400 hover:underline ${className}`}
    >
      {showAvatar && (
        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs">
              {address?.slice(2, 4)}
            </div>
          )}
        </div>
      )}
      <span className={profile?.name ? "font-medium" : "font-mono text-xs"}>
        {loading ? "..." : displayName}
      </span>
    </a>
  );
}
