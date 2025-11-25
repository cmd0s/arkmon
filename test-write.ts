import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { jsonToPayload, ExpirationTime } from "@arkiv-network/sdk/utils";
import { defineChain } from "viem";

// Rosario testnet chain definition
const rosario = defineChain({
  id: 60138453057,
  name: "Rosario",
  network: "rosario",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rosario.hoodi.arkiv.network/rpc"],
    },
  },
  testnet: true,
});

const privateKey = process.env.MONITOR_PRIVATE_KEY;
if (!privateKey) {
  console.error("MONITOR_PRIVATE_KEY not set");
  process.exit(1);
}

console.log("Testing ARKIV write...");
console.log("Chain:", rosario.name);
console.log("RPC:", rosario.rpcUrls.default.http[0]);

const account = privateKeyToAccount(privateKey as `0x${string}`);
console.log("Account:", account.address);

const publicClient = createPublicClient({
  chain: rosario,
  transport: http(),
});

const walletClient = createWalletClient({
  chain: rosario,
  transport: http(),
  account,
});

// Check chain ID
const chainId = await publicClient.getChainId();
console.log("Chain ID:", chainId);

// Check balance first
const balance = await publicClient.getBalance({ address: account.address });
console.log("Balance:", balance.toString(), "wei");

if (balance === BigInt(0)) {
  console.error("\n⚠️  WALLET HAS NO FUNDS!");
  console.error("Please get test tokens from: https://rosario.hoodi.arkiv.network/faucet/");
  process.exit(1);
}

// Try to create entity
console.log("\nCreating entity...");
const start = Date.now();

try {
  const { entityKey, txHash } = await walletClient.createEntity({
    payload: jsonToPayload({
      type: "arkmon_test",
      timestamp: Date.now(),
      message: "Test from ArkMon",
    }),
    contentType: "application/json",
    attributes: [
      { key: "type", value: "arkmon_test" },
      { key: "timestamp", value: Date.now().toString() },
    ],
    expiresIn: ExpirationTime.fromHours(1),
  });

  console.log("SUCCESS!");
  console.log("Entity key:", entityKey);
  console.log("TX hash:", txHash);
  console.log("Duration:", Date.now() - start, "ms");

  // Verify
  console.log("\nVerifying entity...");
  const entity = await publicClient.getEntity(entityKey);
  console.log("Entity found:", !!entity);
  if (entity) {
    console.log("Payload size:", entity.payload?.length, "bytes");
  }
} catch (error) {
  console.error("FAILED!");
  console.error("Error:", error instanceof Error ? error.message : error);
  console.error("Duration:", Date.now() - start, "ms");
}
