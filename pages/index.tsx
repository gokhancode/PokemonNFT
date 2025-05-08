import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { FaEthereum } from 'react-icons/fa';
import Layout from '../components/Layout';
import Image from 'next/image';
import PokemonStats from '../components/PokemonStats';

interface PokemonCard {
  tokenId: number;
  name: string;
  type1: string;
  type2: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
  imageUrl: string;
  description: string;
  price?: string;
  isAuction?: boolean;
  auctionEndTime?: number;
  highestBid?: string;
  auctionSeller?: string;
  highestBidder?: string;
}

export default function Marketplace() {
  const { account, pokemonNFT, pokemonTrading } = useWeb3();
  const [cards, setCards] = useState<PokemonCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    loadCards();
  }, [pokemonNFT, pokemonTrading]);

  const loadCards = async () => {
    if (!pokemonNFT || !pokemonTrading) {
      console.log('Contracts not initialized:', { pokemonNFT: !!pokemonNFT, pokemonTrading: !!pokemonTrading });
      return;
    }

    try {
      setLoading(true);
      const startTime = Date.now();
      console.log('Loading marketplace cards...');
      
      // Get both listing and auction events from the beginning of the chain
      const listingFilter = {
        address: pokemonTrading.address,
        topics: [
          ethers.utils.id("Listed(uint256,address,uint256)")
        ],
        fromBlock: 0
      };
      
      console.log('Listing filter details:', {
        address: pokemonTrading.address,
        eventSignature: "Listed(uint256,address,uint256)",
        eventTopic: ethers.utils.id("Listed(uint256,address,uint256)")
      });

      const auctionFilter = {
        address: pokemonTrading.address,
        topics: [
          ethers.utils.id("AuctionStarted(uint256,address,uint256,uint256)")
        ],
        fromBlock: 0
      };

      console.log('Checking events with filters:', {
        listingEvent: ethers.utils.id("Listed(uint256,address,uint256)"),
        auctionEvent: ethers.utils.id("AuctionStarted(uint256,address,uint256,uint256)"),
        tradingAddress: pokemonTrading.address
      });
      
      const [listingEvents, auctionEvents] = await Promise.all([
        pokemonTrading.provider.getLogs(listingFilter),
        pokemonTrading.provider.getLogs(auctionFilter)
      ]);
      
      console.log('Raw listing events:', listingEvents);
      console.log('Found events:', { 
        listings: listingEvents.length, 
        auctions: auctionEvents.length 
      });

      const processedTokens = new Set();
      const loadedCards: PokemonCard[] = [];
      
      // Process listing events
      for (const event of listingEvents) {
        try {
          const tokenId = ethers.BigNumber.from(event.topics[1]);
          console.log('Processing listing event for token:', tokenId.toString());
          
          // Skip if we've already processed this token
          if (processedTokens.has(tokenId.toString())) continue;
          
          // Check if still listed
          const listing = await pokemonTrading.listings(tokenId);
          console.log('Listing data for token', tokenId.toString(), ':', {
            isActive: listing.isActive,
            seller: listing.seller,
            price: ethers.utils.formatEther(listing.price)
          });
          
          if (listing.isActive) {
            console.log('Token is still listed:', tokenId.toString());
            const pokemon = await pokemonNFT.getPokemon(tokenId);
            console.log('Pokemon data:', pokemon);
            
            // Extract data carefully
            const [
              number,
              name,
              type1,
              type2,
              hp,
              attack,
              defense,
              speed,
              special,
              imageUrl,
              description
            ] = pokemon;

            loadedCards.push({
              tokenId: tokenId.toNumber(),
              name: name || 'Unknown Pokemon',
              type1: type1 || 'Unknown',
              type2: type2 || '',
              hp: Number(hp) || 0,
              attack: Number(attack) || 0,
              defense: Number(defense) || 0,
              speed: Number(speed) || 0,
              special: Number(special) || 0,
              imageUrl: imageUrl || '/placeholder-pokemon.png',
              description: description || '',
              price: ethers.utils.formatEther(listing.price)
            });
            processedTokens.add(tokenId.toString());
          }
        } catch (error) {
          console.error('Error processing listing:', error);
        }
      }
      
      // Process auction events
      for (const event of auctionEvents) {
        try {
          const tokenId = ethers.BigNumber.from(event.topics[1]);
          console.log('Processing auction event for token:', tokenId.toString());
          
          // Skip if we've already processed this token
          if (processedTokens.has(tokenId.toString())) continue;
          
          // Check if still in auction
          const auction = await pokemonTrading.auctions(tokenId);
          if (auction.isActive) {
            console.log('Token is still in auction:', tokenId.toString());
            const pokemon = await pokemonNFT.getPokemon(tokenId);
            console.log('Pokemon data:', pokemon);
            
            // Extract data carefully
            const [
              number,
              name,
              type1,
              type2,
              hp,
              attack,
              defense,
              speed,
              special,
              imageUrl,
              description
            ] = pokemon;
          
            loadedCards.push({
              tokenId: tokenId.toNumber(),
              name: name || 'Unknown Pokemon',
              type1: type1 || 'Unknown',
              type2: type2 || '',
              hp: Number(hp) || 0,
              attack: Number(attack) || 0,
              defense: Number(defense) || 0,
              speed: Number(speed) || 0,
              special: Number(special) || 0,
              imageUrl: imageUrl || '/placeholder-pokemon.png',
              description: description || '',
              isAuction: true,
              auctionEndTime: auction.endTime.toNumber(),
              highestBid: ethers.utils.formatEther(auction.highestBid),
              auctionSeller: auction.seller,
              highestBidder: auction.highestBidder
            });
            processedTokens.add(tokenId.toString());
          }
        } catch (error) {
          console.error('Error processing auction:', error);
        }
      }
      
      console.log('Loaded cards:', loadedCards);
      setCards(loadedCards);
      
      // Ensure loading shows for at least 1 second
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
      }
    } catch (error) {
      console.error('Error loading marketplace cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (card: PokemonCard) => {
    if (!pokemonTrading || !card.price) return;

    try {
      const tx = await pokemonTrading.buyPokemon(card.tokenId, {
        value: ethers.utils.parseEther(card.price)
      });
      await tx.wait();
      alert('Purchase successful!');
      loadCards();
    } catch (error: any) {
      console.error('Error buying Pokemon:', error);
      if (error?.data?.message) {
        alert(`Failed to buy Pokemon: ${error.data.message}`);
      } else if (error?.message) {
        alert(`Failed to buy Pokemon: ${error.message}`);
      } else {
        alert('Failed to buy Pokemon: Unknown error');
      }
    }
  };

  const handleBid = async (card: PokemonCard) => {
    if (!pokemonTrading || !bidAmount) return;

    try {
      const tx = await pokemonTrading.placeBid(card.tokenId, {
        value: ethers.utils.parseEther(bidAmount)
      });
      await tx.wait();
      alert('Bid placed successfully!');
      loadCards();
      setBidAmount('');
    } catch (error: any) {
      console.error('Error placing bid:', error);
      if (error?.data?.message) {
        alert(`Failed to place bid: ${error.data.message}`);
      } else if (error?.message) {
        alert(`Failed to place bid: ${error.message}`);
      } else {
        alert('Failed to place bid: Unknown error');
      }
    }
  };

  const handleEndAuction = async (card: PokemonCard) => {
    if (!pokemonTrading) return;

    try {
      const tx = await pokemonTrading.endAuction(card.tokenId);
      await tx.wait();
      alert('Auction ended successfully!');
      loadCards();
    } catch (error: any) {
      console.error('Error ending auction:', error);
      if (error?.data?.message) {
        alert(`Failed to end auction: ${error.data.message}`);
      } else if (error?.message) {
        alert(`Failed to end auction: ${error.message}`);
      } else {
        alert('Failed to end auction: Unknown error');
      }
    }
  };

  return (
    <Layout>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="relative w-72 h-72 mx-auto">
              <Image
                src="/pokeball-loading.gif"
                alt="Loading Pokemon marketplace"
                fill
                className="object-contain"
                priority
              />
            </div>
            <p className="mt-8 text-gray-600 text-2xl">Loading Pokemon marketplace...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.tokenId}
                className="bg-white overflow-hidden shadow rounded-lg"
              >
                <div className="p-6">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <Image
                      src={card.imageUrl || '/placeholder-pokemon.png'}
                      alt={`${card.name} Pokemon`}
                      fill
                      sizes="128px"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <h3 className="text-lg font-medium text-center mb-4">{card.name}</h3>
                  <div className="flex justify-center space-x-2 mb-4">
                    <span className="px-2 py-1 bg-pokemon-red text-white rounded-full text-sm">
                      {card.type1}
                    </span>
                    {card.type2 && (
                      <span className="px-2 py-1 bg-pokemon-blue text-white rounded-full text-sm">
                        {card.type2}
                      </span>
                    )}
                  </div>
                  <div className="mb-4">
                    <PokemonStats
                      hp={card.hp}
                      attack={card.attack}
                      defense={card.defense}
                      speed={card.speed}
                      special={card.special}
                    />
                  </div>
                  {card.isAuction ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Current Bid: {card.highestBid || '0'} ETH</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Ends: {new Date(card.auctionEndTime! * 1000).toLocaleString()}
                      </p>
                      {account ? (
                        card.auctionSeller?.toLowerCase() !== account?.toLowerCase() && (
                          <div className="mt-2">
                            <input
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder="Enter bid amount"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <button
                              onClick={() => handleBid(card)}
                              className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <FaEthereum className="mr-2" />
                              Place Bid
                            </button>
                          </div>
                        )
                      ) : (
                        <button
                          disabled
                          className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                        >
                          Connect to Bid
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Price: {card.price} ETH</p>
                      {account ? (
                        <button
                          onClick={() => handleBuy(card)}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          <FaEthereum className="mr-2" />
                          Buy Now
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
                        >
                          Connect to Buy
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {cards.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No Pokemon listed in the marketplace
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  );
} 