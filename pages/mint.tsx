import { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getRandomPokemon } from '../utils/pokemonData';
import Layout from '../components/Layout';
import Image from 'next/image';

export default function MintPage() {
  const { account, pokemonNFT } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [mintedPokemon, setMintedPokemon] = useState<null | {
    name: string;
    imageUrl: string;
    description: string;
  }>(null);

  const handleMint = async () => {
    if (!pokemonNFT || !account) return;

    try {
      setLoading(true);
      const startTime = Date.now();
      const pokemon = getRandomPokemon();
      
      const tx = await pokemonNFT.mintPokemon(
        pokemon.number,
        pokemon.name,
        pokemon.type1,
        pokemon.type2,
        pokemon.hp,
        pokemon.attack,
        pokemon.defense,
        pokemon.speed,
        pokemon.special,
        pokemon.imageUrl,
        pokemon.description
      );

      await tx.wait();
      setMintedPokemon({
        name: pokemon.name,
        imageUrl: pokemon.imageUrl,
        description: pokemon.description
      });
      
      // Ensure loading shows for at least 1 second
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsedTime));
      }
    } catch (error) {
      console.error('Error minting Pokemon:', error);
      alert('Failed to mint Pokemon NFT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Video Background - Bottom most layer */}
      <div className="fixed top-0 left-0 w-full h-full -z-50">
        <video
          autoPlay
          loop={true}
          muted
          playsInline
          className="w-full h-full object-cover"
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate"
          onEnded={(e) => {
            const video = e.target as HTMLVideoElement;
            video.play().catch(error => console.log('Video autoplay failed:', error));
          }}
        >
          <source src="/background.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Black overlay - Second bottom most layer */}
      <div className="fixed top-0 left-0 w-full h-full -z-40 bg-black bg-opacity-30" />

    <Layout>
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-6 backdrop-blur-sm bg-opacity-60">
          {mintedPokemon ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
              <p className="text-lg mb-4">You minted a {mintedPokemon.name}!</p>
              <img
                src={mintedPokemon.imageUrl}
                alt={mintedPokemon.name}
                className="w-48 h-48 mx-auto mb-4 object-contain"
              />
                <p className="text-gray-600 mb-6 italic break-words whitespace-pre-line">
                  {mintedPokemon.description}
                </p>
              <button
                onClick={() => setMintedPokemon(null)}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Mint Another Pokemon
              </button>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Mint a Random Pokemon</h2>
                {loading ? (
                  <div className="py-8">
                    <div className="relative w-72 h-72 mx-auto">
                      <Image
                        src="/pokeball-loading.gif"
                        alt="Minting Pokemon..."
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    <p className="mt-8 text-gray-600 text-2xl">Minting your Pokemon...</p>
                  </div>
                ) : (
                  <>
              <p className="text-gray-600 mb-6">
                Click the button below to mint a random Pokemon from the original 151 Pokemon!
              </p>
              <button
                onClick={handleMint}
                      disabled={!account}
                className={`px-6 py-3 border border-transparent text-lg font-medium rounded-md text-white 
                        ${!account ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
              >
                      Mint Random Pokemon
              </button>
                  </>
                )}
            </div>
          )}
        </div>
      </main>
    </Layout>
    </>
  );
} 