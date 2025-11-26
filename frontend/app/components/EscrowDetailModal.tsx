import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { MINT_TO_TOKEN } from "../lib/tokenMap";
import { acceptEscrow, getEscrowBalances, closeEscrow } from "../lib/escrow";

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
  const { connection } = useConnection();
  const wallet = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const connectedAddress = wallet.publicKey?.toString();
  const [depositBalance, setDepositBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!escrow) return;
    const fetchBalances = async () => {
      const { depositBalance } = await getEscrowBalances(
        connection,
        wallet,
        escrow.escrowPda,
        escrow.depositMint,
        escrow.receiveMint
      );
      setDepositBalance(depositBalance);
    };
    fetchBalances();
  }, [escrow]);

  if (!escrow) return null;

  const isOwner = connectedAddress === escrow.owner;
  const isReceiver = connectedAddress === escrow.receiver;

  const copyEscrowId = () => {
    navigator.clipboard.writeText(escrow.escrowPda);
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

  const handleAction = async (action: string) => {
    let fn: (() => Promise<{ tx: string; escrowPda: string }>) | null = null;

    switch (action) {
      case "accept":
        fn = () => acceptEscrow(connection, wallet, escrow.escrowPda);
        break;

      case "close":
        fn = () => closeEscrow(connection, wallet, escrow.escrowPda);
        break;

      default:
        console.warn("Unknown action:", action);
        return;
    }

    if (!fn) return;

    try {
      const { tx, escrowPda } = await fn();

      toast({
        title: `${
          action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()
        } Initiated`,
        description: `Tx Completed - ${tx}`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Transaction Failed",
        description: error?.message ?? "Unexpected error during transaction",
        variant: "destructive",
      });
    }
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
                  href={`https://explorer.solana.com/tx/${escrow.escrowPda}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
            <StatusBadge status={escrow.state as EscrowStatus} />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Assets Exchange */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 items-center">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                You Deposit
              </Badge>
              <div className="p-4 rounded-lg border border-primary/30 bg-gradient-card">
                <p className="text-2xl font-bold text-primary-foreground">
                  {escrow.depositAmount}
                </p>
                <p className="text-sm text-primary-foreground/80 mb-1">
                  {MINT_TO_TOKEN[escrow.depositMint]}
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
                <p className="text-2xl font-bold">
                  {escrow.receiveAmount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mb-1">
                  {MINT_TO_TOKEN[escrow.receiveMint]}
                </p>
              </div>
            </div>
          </div>
          <Separator />
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Owner</p>
              <p className="font-mono text-sm">
                {shortenAddress(escrow.owner)}
              </p>
              {isOwner && (
                <Badge variant="default" className="mt-1">
                  You
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Receiver</p>
              <p className="font-mono text-sm">
                {shortenAddress(escrow.receiver)}
              </p>
              {isReceiver && (
                <Badge variant="default" className="mt-1">
                  You
                </Badge>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="font-medium">{formatDate(escrow.createdAt)}</p>
            </div>
          </div>

          <Separator />
          {/* ESCROW CONTRACT BALANCE */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Deposited Balance in Escrow
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <div className="rounded-lg border border-primary/30 p-3 bg-muted/20">
                <p className="text-xs text-muted-foreground mb-1">
                  Deposit Token Balance
                </p>
                <p className="text-lg font-semibold">
                  {depositBalance !== null ? depositBalance : "Loading..."}
                </p>
                <p className="text-xs text-muted-foreground">
                  {MINT_TO_TOKEN[escrow.depositMint]}
                </p>
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
                {isReceiver && escrow.state === "active" && (
                  <Button
                    onClick={() => handleAction("accept")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept
                  </Button>
                )}
                {isOwner && ["completed", "active"].includes(escrow.state) && (
                  <Button
                    onClick={() => handleAction("close")}
                    className="gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Close Escrow
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
