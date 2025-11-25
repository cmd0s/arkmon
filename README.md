# ArkMon - Arkiv Network Monitor

Real-time monitoring dashboard for Arkiv Web3 database network.

## Features

- **Service Monitoring**: HTTP RPC, WebSocket RPC, Faucet, Bridge, Block Explorer
- **RPC Performance Tests**: Write small (<1KB), write large (~100KB), read operations
- **Historical Data**: SQLite database for storing metrics history
- **Multi-testnet Support**: Parameterized for mendoza, rosario, and other testnets
- **Modern Dark UI**: Built with Next.js, Tailwind CSS, shadcn/ui, and Recharts
- **Real-time Updates**: Automatic refresh with SWR

## Quick Start

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
npm install
```

### Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Wallet for RPC tests
MONITOR_WALLET_ADDRESS=0xYourWalletAddress
MONITOR_PRIVATE_KEY=0xYourPrivateKey

# Database
DATABASE_PATH=./data/arkmon.db

# Monitoring
MONITOR_INTERVAL_MS=60000
ENABLED_TESTNETS=mendoza

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

Run the dashboard and monitoring worker together:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Dashboard only
npm run dev

# Worker only (in another terminal)
npm run worker
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Production Build

```bash
npm run build
npm run start
```

## Docker Deployment (Dokploy)

### Build and run with Docker Compose

```bash
docker compose up -d
```

### Environment Variables for Docker

Set these in your Dokploy environment:

- `MONITOR_WALLET_ADDRESS` - Wallet address for RPC tests
- `MONITOR_PRIVATE_KEY` - Private key for signing transactions
- `ENABLED_TESTNETS` - Comma-separated list of testnets (default: mendoza)
- `MONITOR_INTERVAL_MS` - Monitoring interval in ms (default: 60000)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)           │  API Routes                   │
│  ├── Dashboard page         │  ├── GET /api/metrics         │
│  ├── Charts (Recharts)      │  ├── GET /api/services/status │
│  ├── Status indicators      │  └── GET /api/testnets        │
│  └── Real-time updates      │                               │
├─────────────────────────────────────────────────────────────┤
│                    Background Worker                        │
│  ├── Runs every 1 minute                                    │
│  ├── Tests all services                                     │
│  ├── Writes metrics to SQLite                               │
│  └── Logs results                                           │
├─────────────────────────────────────────────────────────────┤
│                    SQLite Database                          │
│  ├── metrics (timestamp, testnet, service, latency, status) │
│  └── rpc_tests (timestamp, testnet, operation, duration)    │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

- `GET /api/testnets` - List of available testnets
- `GET /api/services?testnet=mendoza` - Current service status
- `GET /api/metrics?testnet=mendoza&hours=24` - Historical metrics
- `GET /api/rpc-tests?testnet=mendoza&hours=24` - RPC test history

## Adding New Testnets

Edit `src/config/testnets.ts`:

```typescript
export const TESTNETS = {
  mendoza: {
    id: "mendoza",
    name: "Mendoza Testnet",
    chainId: 60138453056,
    rpcUrl: "https://mendoza.hoodi.arkiv.network/rpc",
    wsUrl: "wss://mendoza.hoodi.arkiv.network/rpc/ws",
    faucetUrl: "https://mendoza.hoodi.arkiv.network/faucet/",
    bridgeUrl: "https://mendoza.hoodi.arkiv.network/bridgette/",
    explorerUrl: "https://explorer.mendoza.hoodi.arkiv.network",
  },
  // Add new testnet here
  rosario: {
    id: "rosario",
    // ...
  },
};
```

Then update `ENABLED_TESTNETS` in your `.env` file.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Database**: SQLite + Drizzle ORM
- **Real-time**: SWR
- **Deployment**: Docker

## License

MIT
