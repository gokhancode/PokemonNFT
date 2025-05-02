import type { AppProps } from 'next/app';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ProviderWrapper } from '../context/Web3Context';
import '../styles/globals.css';

function getLibrary(provider: any) {
  return new Web3Provider(provider);
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderWrapper>
        <Component {...pageProps} />
      </Web3ProviderWrapper>
    </Web3ReactProvider>
  );
}

export default MyApp; 