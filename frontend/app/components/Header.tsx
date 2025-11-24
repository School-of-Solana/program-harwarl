import { ThemeToggle } from "./ThemeToggle";
import { WalletButton } from "./WalletButton";
import { Coins } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-orange shadow-orange flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold">SolEscrow</h1>
              <p className="text-xs text-muted-foreground">
                Secure Solana Escrow Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
