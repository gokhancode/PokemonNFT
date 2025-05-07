import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { Interface } from '@ethersproject/abi';
import Layout from '../components/Layout';
import Image from 'next/image';
import PokemonStats from '../components/PokemonStats';

interface OwnedPokemon {
  tokenId: number;
  name: string;
  type1: string;
  type2: string;
  imageUrl: string;
  isListed?: boolean;
  price?: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

interface ListedPokemon {
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
  isAuction: boolean;
  price?: string;
  auctionEndTime?: number;
  highestBid?: string;
}

export default function ListPage() {
  const { account, pokemonNFT, pokemonTrading } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [ownedPokemon, setOwnedPokemon] = useState<OwnedPokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<OwnedPokemon | null>(null);
  const [listingType, setListingType] = useState<'sale' | 'auction'>('sale');
  const [price, setPrice] = useState('');
  const [auctionDuration, setAuctionDuration] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [listedPokemon, setListedPokemon] = useState<ListedPokemon[]>([]);

  useEffect(() => {
    console.log('Web3 Context:', { account, pokemonNFT: !!pokemonNFT, pokemonTrading: !!pokemonTrading });
    if (account && pokemonNFT && pokemonTrading) {
      loadOwnedPokemon();
      loadListedPokemon();
    }
  }, [account, pokemonNFT, pokemonTrading]);

  const loadOwnedPokemon = async () => {
    if (!pokemonNFT || !account || !pokemonTrading) {
      console.log('Missing requirements:', { 
        pokemonNFT: !!pokemonNFT, 
        account: !!account, 
        pokemonTrading: !!pokemonTrading,
        pokemonNFTAddress: pokemonNFT?.address,
        tradingAddress: pokemonTrading?.address
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Loading Pokemon for account:', account);

      const loadedPokemon: OwnedPokemon[] = [];
      let foundCount = 0;
      let tokenId = 0;
      
      // Get the balance first to know how many we're looking for
      const balance = await pokemonNFT.balanceOf(account);
      console.log('Balance:', balance.toString());
      
      // Keep checking token IDs until we find all owned Pokemon
      while (foundCount < balance && tokenId < 100) { // Cap at 100 to prevent infinite loop
        try {
          const owner = await pokemonNFT.ownerOf(tokenId);
          
          if (owner.toLowerCase() === account.toLowerCase()) {
            console.log('Found owned Pokemon with ID:', tokenId);
            const pokemon = await pokemonNFT.getPokemon(tokenId);
            const imageUrl = pokemon.imageUrl || pokemon[9];
            const listing = await pokemonTrading.listings(tokenId);
            
            const formattedPokemon = {
              tokenId: tokenId,
              name: pokemon.name || pokemon[1],
              type1: pokemon.type1 || pokemon[2],
              type2: pokemon.type2 || pokemon[3],
              imageUrl: imageUrl,
              isListed: listing.isActive,
              price: listing.isActive ? ethers.utils.formatEther(listing.price) : undefined,
              hp: Number(pokemon.hp) || Number(pokemon[4]) || 0,
              attack: Number(pokemon.attack) || Number(pokemon[5]) || 0,
              defense: Number(pokemon.defense) || Number(pokemon[6]) || 0,
              speed: Number(pokemon.speed) || Number(pokemon[7]) || 0,
              special: Number(pokemon.special) || Number(pokemon[8]) || 0
            };
            loadedPokemon.push(formattedPokemon);
            foundCount++;
          }
        } catch (error) {
          // Skip errors as they likely mean the token doesn't exist
        }
        tokenId++;
      }
      
      console.log('Found Pokemon:', loadedPokemon.length);
      setOwnedPokemon(loadedPokemon);
    } catch (error) {
      console.error('Error loading owned Pokemon:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadListedPokemon = async () => {
    if (!pokemonTrading || !pokemonNFT || !account) return;

    try {
      // Get both listing and auction events
      const listingFilter = {
        address: pokemonTrading.address,
        topics: [
          ethers.utils.id("Listed(uint256,address,uint256)"),
          null,
          ethers.utils.hexZeroPad(account, 32)
        ],
        fromBlock: 0
      };
      
      const auctionFilter = {
        address: pokemonTrading.address,
        topics: [
          ethers.utils.id("AuctionStarted(uint256,address,uint256,uint256)"),
          null,
          ethers.utils.hexZeroPad(account, 32)
        ],
        fromBlock: 0
      };

      const [listingEvents, auctionEvents] = await Promise.all([
        pokemonTrading.provider.getLogs(listingFilter),
        pokemonTrading.provider.getLogs(auctionFilter)
      ]);

      const listed: ListedPokemon[] = [];

      // Process listings
      for (const event of listingEvents) {
        const tokenId = ethers.BigNumber.from(event.topics[1]);
        const listing = await pokemonTrading.listings(tokenId);
        
        if (listing.isActive) {
          const pokemon = await pokemonNFT.getPokemon(tokenId);
          listed.push({
            tokenId: tokenId.toNumber(),
            name: pokemon[1],
            type1: pokemon[2],
            type2: pokemon[3],
            hp: pokemon[4].toNumber(),
            attack: pokemon[5].toNumber(),
            defense: pokemon[6].toNumber(),
            speed: pokemon[7].toNumber(),
            special: pokemon[8].toNumber(),
            imageUrl: pokemon[9],
            description: pokemon[10],
            isAuction: false,
            price: ethers.utils.formatEther(listing.price)
          });
        }
      }

      // Process auctions
      for (const event of auctionEvents) {
        const tokenId = ethers.BigNumber.from(event.topics[1]);
        const auction = await pokemonTrading.auctions(tokenId);
        
        if (auction.isActive) {
          const pokemon = await pokemonNFT.getPokemon(tokenId);
          listed.push({
            tokenId: tokenId.toNumber(),
            name: pokemon[1],
            type1: pokemon[2],
            type2: pokemon[3],
            hp: pokemon[4].toNumber(),
            attack: pokemon[5].toNumber(),
            defense: pokemon[6].toNumber(),
            speed: pokemon[7].toNumber(),
            special: pokemon[8].toNumber(),
            imageUrl: pokemon[9],
            description: pokemon[10],
            isAuction: true,
            highestBid: ethers.utils.formatEther(auction.highestBid),
            auctionEndTime: auction.endTime.toNumber()
          });
        }
      }

      setListedPokemon(listed);
    } catch (error) {
      console.error('Error loading listed Pokemon:', error);
    }
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pokemonTrading || !pokemonNFT || !selectedPokemon) {
      console.error('Missing requirements:', { pokemonTrading: !!pokemonTrading, pokemonNFT: !!pokemonNFT, selectedPokemon });
      alert('Please connect your wallet and select a Pokemon');
      return;
    }

    try {
      setLoading(true);
      
      // First check if already approved
      const isApproved = await pokemonNFT.isApprovedForAll(account, pokemonTrading.address);
      
      if (!isApproved) {
        // Approve the trading contract for all Pokemon
        console.log('Approving trading contract...', {
          nftAddress: pokemonNFT.address,
          tradingAddress: pokemonTrading.address
        });

        const approvalTx = await pokemonNFT.setApprovalForAll(pokemonTrading.address, true);
        console.log('Approval transaction sent:', approvalTx.hash);
        await approvalTx.wait();
        console.log('Approval confirmed');
      } else {
        console.log('Trading contract already approved');
      }

      let tx;
      if (listingType === 'sale') {
        tx = await pokemonTrading.listPokemon(
          selectedPokemon.tokenId,
          ethers.utils.parseEther(price)
        );
      } else {
        tx = await pokemonTrading.startAuction(
          selectedPokemon.tokenId,
          ethers.utils.parseEther(startingBid),
          Math.floor(parseFloat(auctionDuration) * 60 * 60) // Convert hours to seconds, handling decimals
        );
      }

      await tx.wait();
      alert('Pokemon listed successfully!');
      loadOwnedPokemon();
      setSelectedPokemon(null);
      setPrice('');
      setStartingBid('');
      setAuctionDuration('');
    } catch (error: any) {
      console.error('Error listing Pokemon:', error);
      if (error?.data?.message) {
        alert(`Failed to list Pokemon: ${error.data.message}`);
      } else if (error?.message) {
        alert(`Failed to list Pokemon: ${error.message}`);
      } else {
        alert('Failed to list Pokemon: Unknown error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (tokenId: number, isAuction: boolean) => {
    if (!pokemonTrading) return;

    try {
      setLoading(true);
      const tx = isAuction 
        ? await pokemonTrading.endAuction(tokenId)
        : await pokemonTrading.cancelListing(tokenId);
      await tx.wait();
      alert('Listing cancelled successfully!');
      loadListedPokemon();
      loadOwnedPokemon();
    } catch (error: any) {
      console.error('Error cancelling listing:', error);
      alert(error?.data?.message || error?.message || 'Error cancelling listing');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Connect Your Wallet</h2>
            <p className="mt-2 text-gray-600">Please connect your wallet to view and list your Pokemon.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Currently Listed Pokemon Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Listed Pokemon</h2>
            {listedPokemon.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listedPokemon.map((pokemon) => (
                  <div
                    key={pokemon.tokenId}
                    className="bg-white shadow rounded-lg p-6"
                  >
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <Image
                        src={pokemon.imageUrl}
                        alt={pokemon.name}
                        fill
                        sizes="128px"
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-2">{pokemon.name}</h3>
                    <div className="flex justify-center space-x-2 mb-4">
                      <span className="px-2 py-1 bg-pokemon-red text-white rounded-full text-sm">
                        {pokemon.type1}
                      </span>
                      {pokemon.type2 && (
                        <span className="px-2 py-1 bg-pokemon-blue text-white rounded-full text-sm">
                          {pokemon.type2}
                        </span>
                      )}
                    </div>
                    <PokemonStats
                      hp={pokemon.hp}
                      attack={pokemon.attack}
                      defense={pokemon.defense}
                      speed={pokemon.speed}
                      special={pokemon.special}
                    />
                    <div className="mt-4">
                      {pokemon.isAuction ? (
                        <>
                          <p className="text-sm text-gray-600">Current Bid: {pokemon.highestBid || '0'} ETH</p>
                          <p className="text-sm text-gray-600 mb-2">
                            Ends: {new Date(pokemon.auctionEndTime! * 1000).toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600 mb-2">Listed Price: {pokemon.price} ETH</p>
                      )}
                      <button
                        onClick={() => handleCancel(pokemon.tokenId, pokemon.isAuction)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                        disabled={loading}
                      >
                        Cancel {pokemon.isAuction ? 'Auction' : 'Listing'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">You don't have any Pokemon listed currently</p>
            )}
          </div>

          {/* Listing Form Section */}
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">List a Pokemon</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pokemon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pokemon to List
                </label>
                <select
                  value={selectedPokemon?.tokenId || ''}
                  onChange={(e) => {
                    const pokemon = ownedPokemon.find(p => p.tokenId.toString() === e.target.value);
                    setSelectedPokemon(pokemon || null);
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                >
                  <option value="">Select a Pokemon</option>
                  {ownedPokemon
                    .filter(pokemon => !pokemon.isListed)
                    .map((pokemon) => (
                      <option key={pokemon.tokenId} value={pokemon.tokenId}>
                        {pokemon.name} (#{pokemon.tokenId})
                      </option>
                    ))}
                </select>
              </div>

              {/* Listing Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Type
                </label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="sale"
                      checked={listingType === 'sale'}
                      onChange={(e) => setListingType(e.target.value as 'sale')}
                      className="form-radio text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2">Fixed Price</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="auction"
                      checked={listingType === 'auction'}
                      onChange={(e) => setListingType(e.target.value as 'auction')}
                      className="form-radio text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2">Auction</span>
                  </label>
                </div>
              </div>

              {/* Price/Auction Fields */}
              {listingType === 'sale' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                    placeholder="Enter price in ETH"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Starting Bid (ETH)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={startingBid}
                      onChange={(e) => setStartingBid(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                      placeholder="Enter starting bid in ETH"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      value={auctionDuration}
                      onChange={(e) => setAuctionDuration(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                      placeholder="Enter auction duration in hours"
                    />
                  </div>
                </div>
              )}

              {/* List Button */}
              <div className="md:col-span-2">
                <button
                  onClick={handleList}
                  disabled={loading || !selectedPokemon || (!price && listingType === 'sale') || (!startingBid && listingType === 'auction')}
                  className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${loading || !selectedPokemon || (!price && listingType === 'sale') || (!startingBid && listingType === 'auction')
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 transition-colors duration-200'
                    }`}
                >
                  {loading ? 'Processing...' : 'List Pokemon'}
                </button>
              </div>
            </div>
          </div>

          {/* Pokemon Collection Display */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Pokemon Collection</h2>
            {loading ? (
              <div className="text-center py-16">
                <div className="w-72 h-72 mx-auto relative">
                  <Image
                    src="/pokeball-loading.gif"
                    alt="Loading..."
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="mt-8 text-gray-600 text-2xl">Loading your Pokemon...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {ownedPokemon.map((pokemon) => (
                  <div 
                    key={pokemon.tokenId} 
                    className={`bg-white shadow-pokemon rounded-lg p-6 cursor-pointer transition-transform duration-200 ${
                      selectedPokemon?.tokenId === pokemon.tokenId ? 'ring-2 ring-red-500 transform scale-105' : ''
                    }`}
                    onClick={() => !pokemon.isListed && setSelectedPokemon(pokemon)}
                  >
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <Image
                        src={pokemon.imageUrl}
                        alt={`${pokemon.name} sprite`}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <h3 className="text-lg font-medium text-center mb-4">{pokemon.name}</h3>
                    <div className="flex justify-center space-x-2 mb-4">
                      <span className="px-2 py-1 bg-pokemon-red text-white rounded-full text-sm">
                        {pokemon.type1}
                      </span>
                      {pokemon.type2 && (
                        <span className="px-2 py-1 bg-pokemon-blue text-white rounded-full text-sm">
                          {pokemon.type2}
                        </span>
                      )}
                    </div>
                    <div className="mb-4">
                      <PokemonStats
                        hp={pokemon.hp}
                        attack={pokemon.attack}
                        defense={pokemon.defense}
                        speed={pokemon.speed}
                        special={pokemon.special}
                      />
                    </div>
                    {pokemon.isListed && (
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">Listed for {pokemon.price} ETH</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(pokemon.tokenId, false);
                          }}
                          className="w-full px-4 py-2 bg-pokemon-red text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                        >
                          Cancel Listing
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {ownedPokemon.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No Pokemon in your collection
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
} 