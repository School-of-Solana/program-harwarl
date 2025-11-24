import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { TOKEN_MAP } from "../lib/tokenMap";
// import type { EscrowType } from "../types/escrow";

export function CreateEscrowModal() {
  const { connected } = useWallet();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    counterparty: "",
    depositAsset: Object.keys(TOKEN_MAP)[0],
    depositAmount: "",
    receiveAsset: Object.keys(TOKEN_MAP)[1],
    receiveAmount: "",
    expiry: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected) {
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

    toast({
      title: "Escrow Created",
      description: "Your escrow transaction has been initiated",
    });

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-500">
                Expiry Date
              </label>

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
