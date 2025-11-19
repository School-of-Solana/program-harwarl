import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Copy,
  ExternalLink,
  User,
  Coins,
  ArrowRight,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useToast } from "../hooks/use-toast";

interface EscrowDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escrow: {
    id: string;
    buyer: string;
    seller: string;
    depositAmount: number;
    depositToken: string;
    receiveAmount: number;
    receiveToken: string;
    status: "pending" | "funded" | "completed" | "cancelled";
    createdAt: string;
  } | null;
}

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  funded: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export const EscrowDetailModal = ({
  open,
  onOpenChange,
  escrow,
}: EscrowDetailModalProps) => {
  const { toast } = useToast();

  if (!escrow) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(escrow.id);
    toast({
      title: "Copied!",
      description: "Escrow ID copied to clipboard",
    });
  };

  const handleViewExplorer = () => {
    window.open(`https://explorer.solana.com/address/${escrow.id}`, "_blank");
  };

  const handleAction = (action: string) => {
    toast({
      title: `${action} Transaction`,
      description: `Processing ${action.toLowerCase()} transaction...`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border/50 backdrop-blur-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              Escrow Details
            </DialogTitle>
            <Badge
              variant="outline"
              className={cn("capitalize", statusColors[escrow.status])}
            >
              {escrow.status}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-2 mt-2">
            <span className="font-mono text-xs">
              #{escrow.id.slice(0, 16)}...
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyId}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleViewExplorer}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Buyer</h3>
            </div>
            <div className="pl-6 space-y-2">
              <p className="text-sm font-mono text-foreground">
                {escrow.buyer}
              </p>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Deposits:</span>
                <span className="text-sm font-semibold text-primary">
                  {escrow.depositAmount} {escrow.depositToken}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-primary" />
          </div>

          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Seller</h3>
            </div>
            <div className="pl-6 space-y-2">
              <p className="text-sm font-mono text-foreground">
                {escrow.seller}
              </p>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Receives:</span>
                <span className="text-sm font-semibold text-primary">
                  {escrow.receiveAmount} {escrow.receiveToken}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Created:</span>
            <span className="text-sm text-foreground">{escrow.createdAt}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            <Button
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
              onClick={() => handleAction("Fund")}
              disabled={escrow.status !== "pending"}
            >
              Fund
            </Button>
            <Button
              variant="outline"
              className="border-success/30 hover:bg-success/10 text-success"
              onClick={() => handleAction("Claim")}
              disabled={escrow.status !== "funded"}
            >
              Claim
            </Button>
            <Button
              variant="outline"
              className="border-destructive/30 hover:bg-destructive/10 text-destructive"
              onClick={() => handleAction("Cancel")}
              disabled={
                escrow.status === "completed" || escrow.status === "cancelled"
              }
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
