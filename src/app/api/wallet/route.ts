import { NextResponse } from "next/server";
import { getDefaultTestnetId, getTestnet } from "@/config/testnets";

export const dynamic = "force-dynamic";

export async function GET() {
  const walletAddress = process.env.MONITOR_WALLET_ADDRESS;
  const testnet = getDefaultTestnetId();
  const testnetConfig = getTestnet(testnet);

  if (!walletAddress) {
    return NextResponse.json({
      address: null,
      balance: null,
      balanceFormatted: null,
      testnet,
      error: "Wallet not configured",
    });
  }

  const rpcUrl = testnetConfig?.rpcUrl;
  if (!rpcUrl) {
    return NextResponse.json({
      address: walletAddress,
      balance: null,
      balanceFormatted: null,
      testnet,
      error: "Unknown testnet",
    });
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
        id: 1,
      }),
    });

    const data = await response.json();
    const balanceWei = BigInt(data.result || "0x0");
    const balanceEth = Number(balanceWei) / 1e18;

    return NextResponse.json({
      address: walletAddress,
      balance: balanceWei.toString(),
      balanceFormatted: balanceEth.toFixed(6),
      testnet,
      error: null,
    });
  } catch (error) {
    return NextResponse.json({
      address: walletAddress,
      balance: null,
      balanceFormatted: null,
      testnet,
      error: error instanceof Error ? error.message : "Failed to fetch balance",
    });
  }
}
