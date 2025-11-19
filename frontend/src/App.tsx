// import { Toaster } from "./components/ui/toaster";
// import { Toaster as Sonner } from "./components/ui/sonner";
// import { TooltipProvider } from "./components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Index from "./pages/Index";
// import NotFound from "./pages/NotFound";

// // SOLANA Wallet Adapter Setup
// import {
//   ConnectionProvider,
//   WalletProvider,
// } from "@solana/wallet-adapter-react";
// import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// import {
//   PhantomWalletAdapter,
//   SolflareWalletAdapter,
//   // BackpackWalletAdapter
// } from "@solana/wallet-adapter-wallets";

// const queryClient = new QueryClient();

// const App = () => {
//   const endpoint = "https://api.mainnet-beta.solana.com";

//   const wallets = [
//     new PhantomWalletAdapter(),
//     new SolflareWalletAdapter(),
//     // new BackpackWalletAdapter(),
//   ];

//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />

//         <ConnectionProvider endpoint={endpoint}>
//           <WalletProvider wallets={wallets} autoConnect>
//             <WalletModalProvider>
//               <BrowserRouter>
//                 <Routes>
//                   <Route path="/" element={<Index />} />
//                   <Route path="*" element={<NotFound />} />
//                 </Routes>
//               </BrowserRouter>
//             </WalletModalProvider>
//           </WalletProvider>
//         </ConnectionProvider>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// };

// export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient();

const App = () => {
  const network = WalletAdapterNetwork.Devnet;

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider autoConnect wallets={wallets}>
            <WalletModalProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
