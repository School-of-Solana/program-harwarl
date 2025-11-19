import { useState } from "react";
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
import { Plus, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "../hooks/use-toast";

export const CreateEscrowModal = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    buyer: "",
    seller: "",
    depositAmount: "",
    depositToken: "SOL",
    receiveAmount: "",
    receiveToken: "SOL",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Placeholder for escrow creation logic
    toast({
      title: "Escrow Created",
      description: "Your escrow has been created successfully.",
    });

    setOpen(false);
    setFormData({
      buyer: "",
      seller: "",
      depositAmount: "",
      depositToken: "SOL",
      receiveAmount: "",
      receiveToken: "SOL",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300">
          <Plus className="h-4 w-4" />
          Create Escrow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-card border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create New Escrow
          </DialogTitle>
          <DialogDescription>
            Set up a new escrow transaction between buyer and seller.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="buyer" className="text-muted-foreground">
                Buyer Address
              </Label>
              <Input
                id="buyer"
                placeholder="Enter buyer's wallet address"
                value={formData.buyer}
                onChange={(e) =>
                  setFormData({ ...formData, buyer: e.target.value })
                }
                className="bg-background/50 border-border/50 focus:border-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller" className="text-muted-foreground">
                Seller Address
              </Label>
              <Input
                id="seller"
                placeholder="Enter seller's wallet address"
                value={formData.seller}
                onChange={(e) =>
                  setFormData({ ...formData, seller: e.target.value })
                }
                className="bg-background/50 border-border/50 focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary">
              Buyer Deposits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="depositAmount"
                  className="text-muted-foreground"
                >
                  Amount
                </Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  value={formData.depositAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, depositAmount: e.target.value })
                  }
                  className="bg-background border-border/50 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositToken" className="text-muted-foreground">
                  Token
                </Label>
                <Select
                  value={formData.depositToken}
                  onValueChange={(value) =>
                    setFormData({ ...formData, depositToken: value })
                  }
                >
                  <SelectTrigger className="bg-background border-border/50 focus:border-primary text-muted-foreground">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="BONK">BONK</SelectItem>
                    <SelectItem value="TRUMP">TRUMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-accent" />
          </div>

          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-primary">
              Seller Receives
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="receiveAmount"
                  className="text-muted-foreground"
                >
                  Amount
                </Label>
                <Input
                  id="receiveAmount"
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  value={formData.receiveAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, receiveAmount: e.target.value })
                  }
                  className="bg-background border-border/50 focus:border-primary "
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiveToken" className="text-muted-foreground">
                  Token
                </Label>
                <Select
                  value={formData.receiveToken}
                  onValueChange={(value) =>
                    setFormData({ ...formData, receiveToken: value })
                  }
                >
                  <SelectTrigger className="bg-background border-border/50 focus:border-primary text-muted-foreground">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="BONK">BONK</SelectItem>
                    <SelectItem value="TRUMP">TRUMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:shadow-glow-primary transition-all duration-300"
          >
            Create Escrow
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
