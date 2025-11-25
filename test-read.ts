import "dotenv/config";
import { createPublicClient, http } from "@arkiv-network/sdk";
import { eq } from "@arkiv-network/sdk/query";
import { defineChain } from "viem";

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

const publicClient = createPublicClient({
  chain: rosario,
  transport: http(),
});

console.log("Querying entities owned by wallet...");
const query = publicClient.buildQuery();
const result = await query
  .ownedBy("0x44573d2196f967e132819077c41c00ad81d9fd66")
  .withAttributes(true)
  .withPayload(true)
  .limit(10)
  .fetch();

console.log("Found entities:", result.entities.length);
for (const entity of result.entities) {
  console.log("\n---");
  console.log("Key:", entity.key);
  console.log("Attributes:", entity.attributes);
  if (entity.payload) {
    try {
      const data = JSON.parse(Buffer.from(entity.payload).toString());
      console.log("Payload:", data);
    } catch {
      console.log("Payload size:", entity.payload.length, "bytes");
    }
  }
}
