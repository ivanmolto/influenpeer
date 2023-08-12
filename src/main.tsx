import React from "react";
import ReactDOM from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { lightTheme, RainbowKitProvider, Theme } from "@rainbow-me/rainbowkit";
import { WagmiConfig } from "wagmi";
import { chains, config } from "./wagmi";
import {
  LivepeerConfig,
  createReactClient,
  studioProvider,
} from "@livepeer/react";
import merge from "lodash.merge";
import App from "./App";
import "./index.css";

const liveClient = createReactClient({
  provider: studioProvider({ apiKey: import.meta.env.VITE_LIVEPEER_API_CORS }),
});

const myTheme = merge(lightTheme(), {
  colors: {
    accentColor: "#4f46e5",
  },
} as Theme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <LivepeerConfig client={liveClient}>
        <RainbowKitProvider theme={myTheme} chains={chains}>
          <App />
        </RainbowKitProvider>
      </LivepeerConfig>
    </WagmiConfig>
  </React.StrictMode>,
);
