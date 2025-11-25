import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const walletAddress = process.env.MONITOR_WALLET_ADDRESS;
  const enabledTestnets = process.env.ENABLED_TESTNETS?.split(",") || ["rosario"];
  const testnet = enabledTestnets[0]?.trim() || "rosario";

  if (!walletAddress) {
    return NextResponse.json({
      address: null,
      balance: null,
      balanceFormatted: null,
      testnet,
      error: "Wallet not configured",
    });
  }

  // Get RPC URL for the testnet
  const rpcUrls: Record<string, string> = {
    mendoza: "https://mendoza.hoodi.arkiv.network/rpc",
    rosario: "https://rosario.hoodi.arkiv.network/rpc",
  };

  const rpcUrl = rpcUrls[testnet];
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
