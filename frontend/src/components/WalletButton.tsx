import { Wallet } from "lucide-react";
import { Button } from "./ui/button";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export const WalletButton = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const shortAddress = publicKey
    ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}`
    : "";

  const handleOpenModal = () => {
    setVisible(true);
  };

  if (connected) {
    return (
      <Button
        variant="outline"
        onClick={disconnect}
        className="gap-2 border-primary/30 bg-card/50 hover:bg-card/70 backdrop-blur-sm text-secondary"
      >
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        {shortAddress}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleOpenModal}
      className="gap-2 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
};
