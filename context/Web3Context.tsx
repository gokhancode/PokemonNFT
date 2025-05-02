import { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Web3Provider } from '@ethersproject/providers';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React } from '@web3-react/core';

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  pokemonNFT: ethers.Contract | null;
  pokemonTrading: ethers.Contract | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

const injected = new InjectedConnector({
  supportedChainIds: [1, 5, 11155111, 1337] // Mainnet, Goerli, Sepolia, Local
});

// Contract addresses (Sepolia)
const POKEMON_NFT_ADDRESS = '0xEc61BB4be54571c7Aa7075A9FF6f24F488286134';
const POKEMON_TRADING_ADDRESS = '0xacb0F4Dc94838D3Aa015C67a546904a59A50635e';

// Contract ABIs
const POKEMON_NFT_ABI = [
  "function mintPokemon(uint256,string,string,string,uint256,uint256,uint256,uint256,uint256,string,string) external",
  "function getPokemon(uint256) external view returns (uint256,string,string,string,uint256,uint256,uint256,uint256,uint256,string,string)",
  "function tokenURI(uint256) external view returns (string)",
  "function ownerOf(uint256) external view returns (address)",
  "function safeTransferFrom(address,address,uint256) external",
  "function totalSupply() external view returns (uint256)",
  "function approve(address,uint256) external",
  "function setApprovalForAll(address,bool) external",
  "function getApproved(uint256) external view returns (address)",
  "function isApprovedForAll(address,address) external view returns (bool)",
  "function balanceOf(address) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address,uint256) external view returns (uint256)"
];

const POKEMON_TRADING_ABI = [
  "function listPokemon(uint256,uint256) external",
  "function cancelListing(uint256) external",
  "function buyPokemon(uint256) external payable",
  "function startAuction(uint256,uint256,uint256) external",
  "function placeBid(uint256) external payable",
  "function endAuction(uint256) external",
  "function withdraw() external",
  "function listings(uint256) external view returns (address seller, uint256 price, bool isActive)",
  "function auctions(uint256) external view returns (address seller, uint256 startingPrice, uint256 highestBid, address highestBidder, uint256 endTime, bool isActive)",
  "function pendingReturns(address) external view returns (uint256)"
];

export const Web3ProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activate, deactivate, account, chainId, library } = useWeb3React<Web3Provider>();
  const [pokemonNFT, setPokemonNFT] = useState<ethers.Contract | null>(null);
  const [pokemonTrading, setPokemonTrading] = useState<ethers.Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  // Auto-connect
  useEffect(() => {
    if (!tried) {
      injected.isAuthorized().then((isAuthorized) => {
        if (isAuthorized) {
          activate(injected).catch(() => {
            setTried(true);
          });
        } else {
          setTried(true);
        }
      });
    }
  }, [tried, activate]);

  // Reset tried flag when account changes
  useEffect(() => {
    if (account && !tried) {
      setTried(true);
    }
  }, [account, tried]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      await activate(injected, undefined, true); // Set true to suppress errors
    } catch (err) {
      setError('Failed to connect wallet');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      // First deactivate the connector
      await deactivate();
      
      // Clear all state
      setPokemonNFT(null);
      setPokemonTrading(null);
      setTried(false);
      setError(null);
      
      // Clear all localStorage items related to web3
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER');
      localStorage.removeItem('WEB3_CONNECT_CACHED_PROVIDER_ETH');
      
      // Force a page reload to clear any cached state
      window.location.reload();
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      // If deactivate fails, try to force disconnect
      window.location.reload();
    }
  };

  // Initialize contracts when library and account are available
  useEffect(() => {
    if (library && account) {
      console.log('Initializing contracts with:', {
        nftAddress: POKEMON_NFT_ADDRESS,
        tradingAddress: POKEMON_TRADING_ADDRESS
      });
      
      try {
        const signer = library.getSigner();
        const nftContract = new ethers.Contract(POKEMON_NFT_ADDRESS, POKEMON_NFT_ABI, signer);
        const tradingContract = new ethers.Contract(POKEMON_TRADING_ADDRESS, POKEMON_TRADING_ABI, signer);
        
        console.log('Contracts initialized successfully');
        setPokemonNFT(nftContract);
        setPokemonTrading(tradingContract);
      } catch (error) {
        console.error('Error initializing contracts:', error);
      }
    }
  }, [library, account]);

  return (
    <Web3Context.Provider
      value={{
        account: account || null,
        chainId: chainId || null,
        pokemonNFT,
        pokemonTrading,
        connectWallet,
        disconnectWallet,
        isConnecting,
        error
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}; 