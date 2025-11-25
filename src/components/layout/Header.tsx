"use client";

import { Activity, Wallet, ExternalLink, Clock } from "lucide-react";
import { useWallet } from "@/lib/hooks/useApi";
import { useState, useEffect } from "react";

const REFRESH_INTERVAL_SECONDS = 180; // 3 minutes

interface HeaderProps {
  testnet: string;
  lastUpdate: string | null;
}

const EXPLORER_URLS: Record<string, string> = {
  mendoza: "https://explorer.mendoza.hoodi.arkiv.network",
  rosario: "https://explorer.rosario.hoodi.arkiv.network",
};

export function Header({ testnet, lastUpdate }: HeaderProps) {
  const { data: walletData } = useWallet();
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL_SECONDS);

  useEffect(() => {
    if (!lastUpdate) return;

    const updateCountdown = () => {
      const lastUpdateTime = new Date(lastUpdate).getTime();
      const nextUpdateTime = lastUpdateTime + REFRESH_INTERVAL_SECONDS * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((nextUpdateTime - now) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const explorerUrl = EXPLORER_URLS[testnet] || EXPLORER_URLS.rosario;
  const addressUrl = walletData?.address
    ? `${explorerUrl}/address/${walletData.address}`
    : null;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">ArkMon</h1>
              <p className="text-xs text-zinc-500">
                {testnet.charAt(0).toUpperCase() + testnet.slice(1)} Testnet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Countdown & Last Update */}
            {lastUpdate && (
              <div className="flex items-center gap-4">
                <div className="text-xs text-zinc-500">
                  Last:{" "}
                  <span className="text-zinc-400">
                    {new Date(lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-mono text-emerald-400 w-10 text-center">
                    {formatCountdown(countdown)}
                  </span>
                </div>
              </div>
            )}

            {/* Wallet Info */}
            {walletData?.address && (
              <a
                href={addressUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <Wallet className="h-4 w-4 text-zinc-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-400 font-mono">
                    {walletData.address}
                  </span>
                  <span className="text-xs font-medium text-emerald-400">
                    {walletData.balanceFormatted
                      ? `${walletData.balanceFormatted} ETH`
                      : "Loading..."}
                  </span>
                </div>
                <ExternalLink className="h-3 w-3 text-zinc-500" />
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
