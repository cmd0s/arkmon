"use client";

import { Activity, Wallet, ExternalLink } from "lucide-react";
import { useWallet } from "@/lib/hooks/useApi";

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

  const explorerUrl = EXPLORER_URLS[testnet] || EXPLORER_URLS.rosario;
  const addressUrl = walletData?.address
    ? `${explorerUrl}/address/${walletData.address}`
    : null;

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

            {/* Last Update */}
            {lastUpdate && (
              <div className="text-xs text-zinc-500">
                Last update:{" "}
                <span className="text-zinc-400">
                  {new Date(lastUpdate).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
