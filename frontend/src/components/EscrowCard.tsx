import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, User, ArrowRight, Coins } from "lucide-react";
import { cn } from "../lib/utils";

interface EscrowCardProps {
  id: string;
  buyer: string;
  seller: string;
  depositAmount: number;
  depositToken: string;
  receiveAmount: number;
  receiveToken: string;
  status: "pending" | "funded" | "completed" | "cancelled";
  createdAt: string;
  onClick: () => void;
}

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  funded: "bg-primary/20 text-primary border-primary/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export const EscrowCard = ({
  id,
  buyer,
  seller,
  depositAmount,
  depositToken,
  receiveAmount,
  receiveToken,
  status,
  createdAt,
  onClick,
}: EscrowCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="p-6 bg-gradient-card backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-glow-primary group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground font-mono">
            #{id.slice(0, 8)}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn("capitalize", statusColors[status])}
        >
          {status}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Buyer</p>
              <p className="text-sm font-mono">
                {buyer.slice(0, 6)}...{buyer.slice(-4)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Deposits</p>
            <p className="text-sm font-semibold text-primary">
              {depositAmount} {depositToken}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-accent group-hover:translate-x-1 transition-transform" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Seller</p>
              <p className="text-sm font-mono">
                {seller.slice(0, 6)}...{seller.slice(-4)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Receives</p>
            <p className="text-sm font-semibold text-primary">
              {receiveAmount} {receiveToken}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{createdAt}</span>
      </div>
    </Card>
  );
};
