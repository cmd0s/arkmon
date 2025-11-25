import { createPublicClient, createWalletClient, http, defineChain } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { mendoza } from "@arkiv-network/sdk/chains";
import { jsonToPayload, ExpirationTime } from "@arkiv-network/sdk/utils";
import { type TestnetConfig } from "@/config/testnets";

export interface RpcTestResult {
  operation: "write_small" | "write_large" | "read";
  payloadSize: number;
  durationMs: number;
  success: boolean;
  txHash: string | null;
  entityKey: string | null;
  errorMessage: string | null;
}

// Get chain for testnet
function getChain(config: TestnetConfig) {
  // Use SDK built-in chain for mendoza
  if (config.id === "mendoza") {
    return mendoza;
  }

  // For temporal networks like Rosario, define chain using SDK's defineChain
  return defineChain({
    id: config.chainId,
    name: config.name,
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: {
      default: {
        http: [config.rpcUrl],
        webSocket: [config.wsUrl],
      },
    },
  });
}

// Generate random payload of specified size
function generatePayload(sizeBytes: number): object {
  const baseData = {
    type: "arkmon_test",
    timestamp: Date.now(),
    testnet: "test",
  };

  // Calculate how much padding we need
  const baseSize = JSON.stringify(baseData).length;
  const paddingNeeded = Math.max(0, sizeBytes - baseSize - 20);
  const padding = "x".repeat(paddingNeeded);

  return { ...baseData, padding };
}

// Write test - small payload (~500 bytes)
async function testWriteSmall(
  config: TestnetConfig,
  privateKey: string
): Promise<RpcTestResult> {
  const start = Date.now();
  const payloadSize = 500;

  try {
    const chain = getChain(config);
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      chain,
      transport: http(undefined, { timeout: 120000 }), // 120s timeout
      account,
    });

    const payload = generatePayload(payloadSize);

    const { entityKey, txHash } = await walletClient.createEntity({
      payload: jsonToPayload(payload),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "arkmon_test" },
        { key: "size", value: "small" },
        { key: "timestamp", value: Date.now().toString() },
      ],
      expiresIn: ExpirationTime.fromHours(1),
    });

    return {
      operation: "write_small",
      payloadSize,
      durationMs: Date.now() - start,
      success: true,
      txHash,
      entityKey,
      errorMessage: null,
    };
  } catch (error) {
    return {
      operation: "write_small",
      payloadSize,
      durationMs: Date.now() - start,
      success: false,
      txHash: null,
      entityKey: null,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Write test - large payload (~100KB)
async function testWriteLarge(
  config: TestnetConfig,
  privateKey: string
): Promise<RpcTestResult> {
  const start = Date.now();
  const payloadSize = 100 * 1024; // 100KB

  try {
    const chain = getChain(config);
    const account = privateKeyToAccount(privateKey as `0x${string}`);

    const walletClient = createWalletClient({
      chain,
      transport: http(undefined, { timeout: 120000 }), // 120s timeout
      account,
    });

    const payload = generatePayload(payloadSize);

    const { entityKey, txHash } = await walletClient.createEntity({
      payload: jsonToPayload(payload),
      contentType: "application/json",
      attributes: [
        { key: "type", value: "arkmon_test" },
        { key: "size", value: "large" },
        { key: "timestamp", value: Date.now().toString() },
      ],
      expiresIn: ExpirationTime.fromHours(1),
    });

    return {
      operation: "write_large",
      payloadSize,
      durationMs: Date.now() - start,
      success: true,
      txHash,
      entityKey,
      errorMessage: null,
    };
  } catch (error) {
    return {
      operation: "write_large",
      payloadSize,
      durationMs: Date.now() - start,
      success: false,
      txHash: null,
      entityKey: null,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Read test - read an entity by key
async function testRead(
  config: TestnetConfig,
  entityKey: string | null
): Promise<RpcTestResult> {
  const start = Date.now();

  if (!entityKey) {
    return {
      operation: "read",
      payloadSize: 0,
      durationMs: 0,
      success: false,
      txHash: null,
      entityKey: null,
      errorMessage: "No entity key provided for read test",
    };
  }

  try {
    const chain = getChain(config);

    const publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    const entity = await publicClient.getEntity(entityKey as `0x${string}`);
    const payloadSize = entity?.payload?.length || 0;

    return {
      operation: "read",
      payloadSize,
      durationMs: Date.now() - start,
      success: true,
      txHash: null,
      entityKey,
      errorMessage: null,
    };
  } catch (error) {
    return {
      operation: "read",
      payloadSize: 0,
      durationMs: Date.now() - start,
      success: false,
      txHash: null,
      entityKey,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper to wait
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Check wallet balance
async function checkBalance(config: TestnetConfig, privateKey: string): Promise<bigint> {
  const chain = getChain(config);
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  return await publicClient.getBalance({ address: account.address });
}

// Run all RPC tests with delays between them
export async function runRpcTests(
  config: TestnetConfig,
  privateKey: string
): Promise<RpcTestResult[]> {
  const results: RpcTestResult[] = [];
  const DELAY_BETWEEN_TESTS = 15000; // 15 seconds between tests

  // Check balance first
  let hasBalance = false;
  try {
    const balance = await checkBalance(config, privateKey);
    hasBalance = balance > BigInt(0);
    if (!hasBalance) {
      console.log(`[RPC Tests] Wallet has no funds - write tests will be skipped`);
    }
  } catch (error) {
    console.log(`[RPC Tests] Failed to check balance: ${error instanceof Error ? error.message : error}`);
  }

  // Test small write first (skip if no funds)
  let smallWrite: RpcTestResult;
  let largeWrite: RpcTestResult;

  if (!hasBalance) {
    // No funds - skip write tests
    smallWrite = {
      operation: "write_small",
      payloadSize: 500,
      durationMs: 0,
      success: false,
      txHash: null,
      entityKey: null,
      errorMessage: "Wallet has no funds - please fund via faucet",
    };
    results.push(smallWrite);

    largeWrite = {
      operation: "write_large",
      payloadSize: 100 * 1024,
      durationMs: 0,
      success: false,
      txHash: null,
      entityKey: null,
      errorMessage: "Wallet has no funds - please fund via faucet",
    };
    results.push(largeWrite);
  } else {
    // Has funds - run write tests
    smallWrite = await testWriteSmall(config, privateKey);
    results.push(smallWrite);

    // Wait before next test to avoid nonce conflicts
    if (smallWrite.success) {
      await delay(DELAY_BETWEEN_TESTS);
    }

    largeWrite = await testWriteLarge(config, privateKey);
    results.push(largeWrite);
  }

  // Wait before read test
  if (largeWrite.success || smallWrite.success) {
    await delay(5000); // shorter delay for read
  }

  // Test read (use entity from successful write, or skip if no entity)
  const readKey = smallWrite.entityKey || largeWrite.entityKey;
  const readResult = await testRead(config, readKey);
  results.push(readResult);

  return results;
}

// Log RPC test results
export function logRpcTestResults(testnet: string, results: RpcTestResult[]) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] RPC Tests: ${testnet}`);
  console.log("─".repeat(50));

  for (const result of results) {
    const statusIcon = result.success ? "✓" : "✗";
    const statusColor = result.success ? "\x1b[32m" : "\x1b[31m";
    const sizeLabel =
      result.payloadSize >= 1024
        ? `${(result.payloadSize / 1024).toFixed(1)}KB`
        : `${result.payloadSize}B`;

    console.log(
      `${statusColor}${statusIcon}\x1b[0m ${result.operation.padEnd(15)} ${result.durationMs}ms (${sizeLabel})${
        result.errorMessage ? ` - ${result.errorMessage}` : ""
      }`
    );
  }
}
