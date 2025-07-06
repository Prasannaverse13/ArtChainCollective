# ArtChain: Collaborative Digital Art Platform on Stellar Blockchain

ArtChain is a collaborative digital art platform built on the Stellar blockchain where artists worldwide can co-create artwork in real-time, mint their creations as NFTs, and sell them on an integrated marketplace.

## Project Overview and Problem Statement

Traditional digital art marketplaces fail to provide robust collaboration tools that allow multiple artists to work on a single piece while maintaining transparent attribution and fair revenue distribution. ArtChain addresses this by:

1. Enabling real-time collaborative art creation
2. Implementing blockchain-backed ownership and provenance tracking
3. Automating revenue distribution among contributors through smart contracts
4. Creating a transparent marketplace for NFT trading
5. Building a community feedback system for artwork valuation

## Technical Architecture

ArtChain is built as a full-stack JavaScript application with the following components:

### Frontend (React + TypeScript)
- Real-time canvas for artwork creation
- Wallet integration (Freighter and MetaMask)
- NFT minting and marketplace interfaces
- Profile management and collaboration tools

### Backend (Node.js + Express)
- In-memory storage for application data
- WebSocket server for real-time collaboration
- API endpoints for artwork, users, and NFTs
- Integration with Stellar blockchain

### Blockchain (Stellar)
- Smart contracts for NFT minting and ownership
- Revenue splitting functionality for collaborators
- Security and identity verification
- Testnet deployment for reduced transaction costs

## Stellar Integration Details

### Key Files for Stellar Implementation

The main Stellar integration code is contained in the following files:

1. **`client/src/lib/stellar.ts`**: Primary interface with Stellar SDK
   - Initializes connection to Stellar Testnet
   - Implements NFT minting operations
   - Handles transaction creation and submission
   - Manages revenue splitting functionality
   - Retrieves account details from the blockchain

2. **`client/src/lib/wallet.ts`**: Wallet connectivity layer
   - Integrates with Freighter (Stellar native wallet)
   - Provides MetaMask integration for Ethereum wallet users
   - Handles transaction signing process
   - Manages wallet connection state

3. **`client/src/hooks/use-wallet.ts`**: React hook for wallet state management
   - Provides wallet connection status
   - Manages wallet addresses and display formatting
   - Handles connection/disconnection events
   - Persists wallet state between sessions

### Stellar Smart Contract Capabilities

ArtChain implements Stellar's smart contract capabilities through:

1. **NFT Minting**: Uses Stellar's `manageData` operations to create tokenized representations of artwork with proper metadata and ownership attribution.

2. **Ownership Transfer**: Implements secure NFT ownership transfer using Stellar's transaction system.

3. **Revenue Splitting**: Leverages Stellar's payment operations to automatically distribute proceeds from NFT sales to all collaborators based on their contribution percentages.

4. **Royalty Payments**: Implements ongoing royalty payments for secondary sales through custom operations.

## Deployment Information

### Stellar Testnet Deployment

This project is deployed on the Stellar Testnet to provide a realistic yet cost-free environment for testing and development.

- **Network**: Stellar Testnet
- **Deployed Contract Address**: `GB6Q6UWHR6ZG23EXJCUKKBZFU5KFZWJHFQ7INVDZUJ45HDB3W3XKRPG7`
- **[Stellar Chain Link](https://testnet.stellarchain.io/accounts/GB6Q6UWHR6ZG23EXJCUKKBZFU5KFZWJHFQ7INVDZUJ45HDB3W3XKRPG7)**: View the contract on Stellar Chain Explorer

### Stellar Developer Tools Integration

- **Stellar SDK**: Used for all blockchain interactions
- **Freighter Wallet**: Integrated for native Stellar wallet support
- **Horizon API**: Utilized for account and transaction data
- **Stellar Laboratory**: Used for testing and transaction inspection

## Blend Capital DeFi Integration

ArtChain now integrates with **Blend Capital**, a decentralized lending protocol on Stellar, providing artists with advanced financial services.

### What is Blend Capital?

Blend is a DeFi protocol that allows any entity to create or utilize immutable lending markets. It brings decentralized, on-chain lending to the Stellar ecosystem with:

- **Security**: All lending pools are isolated with mandatory insurance through the backstop module
- **Capital Efficiency**: Reactive interest rates ensure optimal capital utilization
- **Permissionless**: Anyone can deploy new lending pools without governance approval

### Blend Integration in ArtChain

**File Location**: `client/src/lib/blend.ts` - Core Blend protocol integration
**UI Location**: `client/src/pages/finance.tsx` - Finance dashboard for DeFi operations

#### Key Features:

1. **Asset Lending**: Artists can lend their XLM, USDC, and other assets to earn interest
2. **Portfolio Borrowing**: Borrow against NFT portfolios and digital asset holdings
3. **BLND Token Integration**: Participate in backstop insurance with BLND tokens
4. **Real-time Analytics**: View lending pool statistics, APY rates, and utilization
5. **Health Factor Monitoring**: Track borrowing positions and liquidation risks

#### Smart Contract Addresses (Mainnet):

- **Blend Token Contract**: `CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY`
- **Pool Factory**: `CDSYOAVXFY7SM5S64IZPPPYB4GVGGLMQVFREPSQQEZVIWXX5R23G4QSU`
- **Backstop Module**: `CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7`
- **BLND Asset**: `BLND-GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY`

#### Available Operations:

- **Supply**: Deposit assets to earn lending interest
- **Borrow**: Take loans against collateral with competitive rates
- **Repay**: Pay back borrowed amounts with interest
- **Withdraw**: Remove supplied assets from lending pools
- **Backstop Participation**: Stake BLND tokens for protocol insurance rewards

### Benefits for Artists:

1. **Liquidity Access**: Borrow against art portfolios without selling NFTs
2. **Passive Income**: Earn yield on idle cryptocurrency holdings
3. **Capital Efficiency**: Leverage assets for new art projects and collaborations
4. **Risk Management**: Diversify income streams beyond NFT sales

## Technical Decisions and Justifications

1. **Stellar vs Ethereum**: Chosen for lower transaction fees, faster confirmation times, and simpler smart contract development.

2. **In-memory Database**: Used for prototyping, ensuring quick development without database setup complexity.

3. **Real-time Collaboration**: Implemented with WebSockets for minimal latency and better user experience.

4. **Multi-wallet Support**: Supporting both Freighter and MetaMask to ensure broader user accessibility.

5. **Cyberpunk Design**: Adopted to align with the Web3 aesthetic and create a distinctive brand identity.

## Development Experience with Stellar

Our team has built several applications on Stellar, leveraging its strong documentation, developer-friendly tools, and active community. Key advantages we've found in developing on Stellar include:

1. **Low Transaction Costs**: Making microtransactions economically viable
2. **Fast Confirmation Times**: Providing better user experience
3. **Simplified Asset Issuance**: Streamlining token creation processes
4. **Robust Documentation**: Accelerating the development lifecycle
5. **Strong Testing Environment**: Allowing for risk-free development on testnet

## Installation and Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Freighter wallet extension (for Stellar integration)
- MetaMask wallet extension (optional)

### Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/artchain.git
   cd artchain
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application:
   Open your browser and navigate to `http://localhost:5000`

### Wallet Configuration

1. **Freighter Wallet**:
   - Install Freighter extension from the Chrome Web Store
   - Create or import a wallet
   - Ensure Testnet is selected in Freighter settings
   - Request test tokens from Stellar Friendbot

2. **MetaMask** (optional):
   - Install MetaMask extension
   - Create or import a wallet
   - Connect to Ethereum testnet

### Testing NFT Creation

1. Connect your wallet (Freighter preferred for full functionality)
2. Navigate to the Creation Studio
3. Create artwork using the drawing tools or upload an image
4. Add collaborators if desired
5. Click "Mint NFT" to tokenize your artwork
6. Sign the transaction in your wallet

### Testing Marketplace

1. Browse available NFTs on the Marketplace page
2. Click "Buy" on any NFT
3. Confirm the purchase transaction in your wallet
4. Check your Profile to see owned NFTs

## Future Roadmap

1. **Enhanced Collaboration Tools**: More sophisticated drawing tools and layer management
2. **Additional Blockchain Support**: Integration with more blockchain networks
3. **Mainnet Deployment**: Production deployment on Stellar mainnet
4. **Mobile Applications**: Native mobile apps for iOS and Android
5. **Community Governance**: DAO-based decision making for platform evolution
