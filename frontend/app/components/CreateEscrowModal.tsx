import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { TOKEN_MAP } from "../lib/tokenMap";
import { initializeEscrow } from "../lib/escrow";
import { PublicKey } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import { useCreateEscrow } from "../lib/query";

export function CreateEscrowModal() {
  const wallet = useWallet();
  const { toast } = useToast();
  const { connection } = useConnection();
  const createEscrow = useCreateEscrow();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    counterparty: "",
    depositAsset: Object.keys(TOKEN_MAP)[0],
    depositAmount: "",
    receiveAsset: Object.keys(TOKEN_MAP)[1],
    receiveAmount: "",
    expiry: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.counterparty ||
      !formData.depositAmount ||
      !formData.receiveAmount
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.expiry) <= new Date()) {
      toast({
        title: "Validation Error",
        description: "Invalid Expiry Date",
        variant: "destructive",
      });
      return;
    }

    const {
      counterparty,
      depositAmount,
      depositAsset,
      receiveAmount,
      receiveAsset,
      expiry,
    } = formData;

    // Create the Escrow.
    try {
      const { tx, escrowPda } = await initializeEscrow(
        connection,
        wallet!,
        uuidv4(),
        new PublicKey(counterparty),
        Number(depositAmount),
        Number(receiveAmount),
        new PublicKey(TOKEN_MAP[depositAsset as keyof typeof TOKEN_MAP].mint),
        new PublicKey(TOKEN_MAP[receiveAsset as keyof typeof TOKEN_MAP].mint),
        new Date(expiry).getTime()
      );

      // if tx and escrowPda, Save to the database
      createEscrow.mutate(
        {
          buyer: String(wallet.publicKey)!,
          seller: counterparty,
          escrowPda: String(escrowPda),
        },
        {
          onSuccess: () => {
            toast({
              title: "Escrow Created",
              description: (
                <>
                  <div>Transaction Signature: {tx}</div>
                  <div>Escrow PDA: {escrowPda.toBase58()}</div>
                </>
              ),
            });
          },
        }
      );
    } catch (error: any) {
      toast({
        title: "Error Creating Escrow",
        description: error?.message || "Unknown error occurred",
      });
    }

    setOpen(false);
    setFormData({
      counterparty: "",
      depositAsset: Object.keys(TOKEN_MAP)[0],
      depositAmount: "",
      receiveAsset: Object.keys(TOKEN_MAP)[1],
      receiveAmount: "",
      expiry: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-orange">
          <Plus className="w-5 h-5" />
          Create Escrow
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Escrow</DialogTitle>
          <DialogDescription>
            Set up a secure escrow transaction on Solana
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="counterparty">Counterparty Address *</Label>
            <Input
              id="counterparty"
              placeholder="Enter Solana wallet address"
              value={formData.counterparty}
              onChange={(e) =>
                setFormData({ ...formData, counterparty: e.target.value })
              }
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depositAsset">You Deposit *</Label>
              <Select
                value={formData.depositAsset}
                onValueChange={(value) =>
                  setFormData({ ...formData, depositAsset: value })
                }
              >
                <SelectTrigger className="bg-background border-border/50 focus:border-primary text-muted-foreground">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TOKEN_MAP).map((token: any) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Amount *</Label>
              <Input
                id="depositAmount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={formData.depositAmount}
                onChange={(e) =>
                  setFormData({ ...formData, depositAmount: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receiveAsset">You Receive *</Label>
              <Select
                value={formData.receiveAsset}
                onValueChange={(value) =>
                  setFormData({ ...formData, receiveAsset: value })
                }
              >
                <SelectTrigger className="bg-background border-border/50 focus:border-primary text-muted-foreground">
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TOKEN_MAP).map((token: any) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      {token.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiveAmount">Amount *</Label>
              <Input
                id="receiveAmount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={formData.receiveAmount}
                onChange={(e) =>
                  setFormData({ ...formData, receiveAmount: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date *</Label>

              <Input
                id="expiry"
                type="datetime-local"
                value={formData.expiry}
                onChange={(e) =>
                  setFormData({ ...formData, expiry: e.target.value })
                }
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Create Escrow
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
