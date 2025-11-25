export interface TestnetConfig {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
  portalUrl: string;
  faucetUrl: string;
  bridgeUrl: string;
  explorerUrl: string;
}

export const TESTNETS: Record<string, TestnetConfig> = {
  mendoza: {
    id: "mendoza",
    name: "Mendoza Testnet",
    chainId: 60138453056,
    rpcUrl: "https://mendoza.hoodi.arkiv.network/rpc",
    wsUrl: "wss://mendoza.hoodi.arkiv.network/rpc/ws",
    portalUrl: "https://mendoza.hoodi.arkiv.network",
    faucetUrl: "https://mendoza.hoodi.arkiv.network/faucet/",
    bridgeUrl: "https://mendoza.hoodi.arkiv.network/bridgette/",
    explorerUrl: "https://explorer.mendoza.hoodi.arkiv.network",
  },
  rosario: {
    id: "rosario",
    name: "Rosario Testnet",
    chainId: 60138453057,
    rpcUrl: "https://rosario.hoodi.arkiv.network/rpc",
    wsUrl: "wss://rosario.hoodi.arkiv.network/rpc/ws",
    portalUrl: "https://rosario.hoodi.arkiv.network",
    faucetUrl: "https://rosario.hoodi.arkiv.network/faucet/",
    bridgeUrl: "https://rosario.hoodi.arkiv.network/bridgette/",
    explorerUrl: "https://explorer.rosario.hoodi.arkiv.network",
  },
};

export const SERVICES = [
  { id: "portal", name: "Portal", description: "Network portal" },
  { id: "rpc", name: "HTTP RPC", description: "JSON-RPC endpoint" },
  { id: "ws", name: "WebSocket RPC", description: "WebSocket endpoint" },
  { id: "faucet", name: "Faucet", description: "Test token faucet" },
  { id: "bridge", name: "Bridge", description: "Cross-chain bridge" },
  { id: "explorer", name: "Block Explorer", description: "Blockchain explorer" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export function getTestnet(id: string): TestnetConfig | undefined {
  return TESTNETS[id];
}

export function getEnabledTestnets(): TestnetConfig[] {
  const enabled = process.env.ENABLED_TESTNETS?.split(",") || ["mendoza"];
  return enabled
    .map((id) => TESTNETS[id.trim()])
    .filter((t): t is TestnetConfig => t !== undefined);
}

export function getDefaultTestnetId(): string {
  const enabledTestnets = getEnabledTestnets();
  return enabledTestnets[0]?.id || "mendoza";
}

export function getDefaultTestnet(): TestnetConfig | undefined {
  const enabledTestnets = getEnabledTestnets();
  return enabledTestnets[0];
}
