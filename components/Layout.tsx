import { useRouter } from 'next/router';
import Link from 'next/link';
import { useWeb3 } from '../context/Web3Context';
import { shortenAddress } from '../utils/address';
import { FaWallet } from 'react-icons/fa';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { account, connectWallet, disconnectWallet } = useWeb3();

  const navigation = [
    { name: 'Marketplace', href: '/' },
    { name: 'Mint', href: '/mint' },
    { name: 'List', href: '/list' },
    { name: 'About', href: '/about' }
  ];

  return (
    <div className="min-h-screen">
      <nav className="bg-pokemon-red shadow-pokemon">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 relative">
                  <Image
                    src="/pokeball.png"
                    alt="Pokeball"
                    width={40}
                    height={40}
                    className="hover:animate-spin"
                  />
                </div>
                <h1 className="text-2xl font-bold text-white">Pokemon NFT</h1>
              </div>
              <div className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                <Link 
                    key={item.name}
                    href={item.href}
                  className="text-white hover:text-pokemon-yellow transition-colors duration-200"
                >
                    {item.name}
                </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              {account ? (
                <div className="flex items-center space-x-4">
                  <span className="text-white font-medium">
                    {shortenAddress(account)}
                  </span>
                  <div className="relative group">
                  <button
                    onClick={disconnectWallet}
                    className="flex items-center px-4 py-2 border-2 border-white text-sm font-medium rounded-md text-white hover:bg-white hover:text-pokemon-red transition-colors duration-200"
                  >
                    Disconnect
                  </button>
                    <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-72 bg-white text-pokemon-red text-base font-bold rounded-lg border-2 border-pokemon-red shadow-lg px-4 py-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex flex-col items-center">
                      <span>
                        If you are using MetaMask, you may need to connect, disconnect, or change accounts directly in the MetaMask extension for full control.
                      </span>
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white border-t-0"></span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="flex items-center px-4 py-2 border-2 border-white text-sm font-medium rounded-md text-white hover:bg-white hover:text-pokemon-red transition-colors duration-200"
                >
                  <FaWallet className="mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-pokemon-yellow block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 