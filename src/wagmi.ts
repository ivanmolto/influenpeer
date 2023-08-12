import {
  getDefaultWallets,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig } from "wagmi";
import {
  optimism,
  optimismGoerli,
  zora,
  zoraTestnet,
  base,
  baseGoerli,
} from "wagmi/chains";

import { publicProvider } from "wagmi/providers/public";

const walletConnectProjectId = "6cdf7c57d5bd02d4138b12590e7a4c93";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [zora, zoraTestnet, optimism, optimismGoerli, base, baseGoerli],
  [publicProvider()],
);

const { wallets } = getDefaultWallets({
  appName: "Influenpeer",
  chains,
  projectId: walletConnectProjectId,
});

const connectors = connectorsForWallets([...wallets]);

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains };
