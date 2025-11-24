import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/seperator";
import { StatusBadge } from "./StatusBadge";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import type { Escrow, EscrowStatus } from "../types/escrow";

interface EscrowDetailModalProps {
  escrow: Escrow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EscrowDetailModal({
  escrow,
  open,
  onOpenChange,
}: EscrowDetailModalProps) {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  if (!escrow) return null;

  const connectedAddress = publicKey?.toString();
  const isBuyer = connectedAddress === escrow.buyer;
  const isSeller = connectedAddress === escrow.seller;

  useEffect(() => {
    if (!escrow.id) return;

    const run = async () => {
      // get the pda data
      // TODO:
    };

    run();
  }, [escrow]);

  const copyEscrowId = () => {
    navigator.clipboard.writeText(escrow.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Escrow ID Copied",
      description: "Escrow ID copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTimeRemaining = () => {
    const now = new Date();
    const expiry = new Date(escrow.expiry);
    const diff = expiry.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const handleAction = (action: string) => {
    toast({
      title: `${action} Initiated`,
      description: "Processing your transaction...",
    });
    onOpenChange(false);
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="font-mono text-lg">
                {escrow.id}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyEscrowId}
                className="h-7 w-7 p-0"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                <a
                  href={`https://explorer.solana.com/tx/${escrow.id}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <StatusBadge status={escrow.status as EscrowStatus} />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Assets Exchange */}
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                You Deposit
              </Badge>
              <div className="p-4 rounded-lg border border-primary/30 bg-gradient-card">
                <p className="text-sm text-primary-foreground/80 mb-1">
                  {escrow.depositAsset}
                </p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {escrow.depositAmount}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-primary" />
            </div>

            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                You Receive
              </Badge>
              <div className="p-4 rounded-lg bg-gradient-card border border-primary/30">
                <p className="text-sm text-muted-foreground mb-1">
                  {escrow.receiveAsset}
                </p>
                <p className="text-2xl font-bold">
                  {escrow.receiveAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Buyer</p>
              <p className="font-mono text-sm">
                {shortenAddress(escrow.buyer)}
              </p>
              {isBuyer && (
                <Badge variant="default" className="mt-1">
                  You
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Seller</p>
              <p className="font-mono text-sm">
                {shortenAddress(escrow.seller)}
              </p>
              {isSeller && (
                <Badge variant="default" className="mt-1">
                  You
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{formatDate(escrow.createdAt)}</p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-muted-foreground mb-1">Expires In</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <p className="font-medium">{calculateTimeRemaining()}</p>
              </div>
            </div>
          </div>

          {escrow.description && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Description
                </p>
                <p className="text-foreground">{escrow.description}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Available Actions</p>

            {
              <div className="grid grid-cols-2 gap-3">
                {isSeller && escrow.status === "pending" && (
                  <Button
                    onClick={() => handleAction("accept")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept
                  </Button>
                )}
                {isBuyer && escrow.status === "active" && (
                  <Button
                    onClick={() => handleAction("fund")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Fund Escrow
                  </Button>
                )}
                {isSeller && escrow.status === "funded" && (
                  <Button
                    onClick={() => handleAction("sendAsset")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Send Asset
                  </Button>
                )}
                {isBuyer && escrow.status === "assetSent" && (
                  <Button
                    onClick={() => handleAction("confirm")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm And Release
                  </Button>
                )}
                {(isSeller || isBuyer) && escrow.status != "released" && (
                  <Button onClick={() => handleAction("")} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Request Refund
                  </Button>
                )}
              </div>
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
