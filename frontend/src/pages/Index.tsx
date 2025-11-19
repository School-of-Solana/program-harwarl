import { useState } from "react";
import { WalletButton } from "../components/WalletButton";
import { CreateEscrowModal } from "../components/CreateEscrowModal";
import { EscrowCard } from "../components/EscrowCard";
import { EscrowDetailModal } from "../components/EscrowDetailModal";
import { Coins } from "lucide-react";

// Mock data for demonstration
const mockEscrows = [
  {
    id: "7xKz4mN9pQwR2vLt8eHb6sUj3FaY1DcG5TzM9PqN8Wr7",
    buyer: "8xKz4mN9pQwR2vLt8eHb6sUj3FaY1DcG",
    seller: "9yLm5nP0qRxS3wMu9fIc7tVk4GbZ2EdH",
    depositAmount: 2.5,
    depositToken: "SOL",
    receiveAmount: 100,
    receiveToken: "USDC",
    status: "pending" as const,
    createdAt: "2024-01-15 14:30",
  },
  {
    id: "4aFd2qN3rTxV5yOw1gKd9vXm6LcP8BjS",
    buyer: "5bGe3rO4sUyW6zPx2hLe0wYn7MdQ9CkT",
    seller: "6cHf4sP5tVzX7aQy3iMf1xZo8NeR0DlU",
    depositAmount: 1000,
    depositToken: "USDC",
    receiveAmount: 5.2,
    receiveToken: "SOL",
    status: "funded" as const,
    createdAt: "2024-01-14 10:15",
  },
  {
    id: "9mQz7pS6wUyD4cLv8jNh2tBx5FaK3EnP",
    buyer: "3dJg8qT7xWzE5dMw9kOi3uCy6GbM4FoQ",
    seller: "4eKh9rU8yXaF6eNx0lPj4vDz7HcN5GpR",
    depositAmount: 0.5,
    depositToken: "SOL",
    receiveAmount: 50,
    receiveToken: "RAY",
    status: "completed" as const,
    createdAt: "2024-01-13 16:45",
  },
];

const Index = () => {
  const [selectedEscrow, setSelectedEscrow] = useState<
    (typeof mockEscrows)[0] | null
  >(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleEscrowClick = (escrow: (typeof mockEscrows)[0]) => {
    setSelectedEscrow(escrow);
    setDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-primary">
              <Coins className="h-6 w-6 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Solana Escrow
              </h1>
              <p className="text-xs text-muted-foreground">
                Secure peer-to-peer transactions
              </p>
            </div>
          </div>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 text-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Escrows</h2>
            <p className="text-muted-foreground">
              Manage your secure transactions on Solana
            </p>
          </div>
          <CreateEscrowModal />
        </div>

        {/* Escrow Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockEscrows.map((escrow) => (
            <EscrowCard
              key={escrow.id}
              {...escrow}
              onClick={() => handleEscrowClick(escrow)}
            />
          ))}
        </div>

        {/* Empty State (hidden when there are escrows) */}
        {mockEscrows.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex h-20 w-20 rounded-full bg-gradient-card items-center justify-center mb-4">
              <Coins className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No escrows yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first escrow to get started
            </p>
            <CreateEscrowModal />
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <EscrowDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        escrow={selectedEscrow}
      />
    </div>
  );
};

export default Index;
