"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import type { EscrowStatus } from "./types/escrow";
import { StatusBadge } from "./components/StatusBadge";
import { CreateEscrowModal } from "./components/CreateEscrowModal";
import { EscrowDetailModal } from "./components/EscrowDetailModal";
import { Search, Filter, AlertCircle } from "lucide-react";
import { useGetEscrows } from "./lib/query";
import { getEscrowViaPda } from "./lib/escrow";
import { PublicKey } from "@solana/web3.js";
import { cleanOnChainEscrow } from "./lib/utils";
import { MINT_TO_TOKEN } from "./lib/tokenMap";

export default function Home() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const {
    data: dbEscrows = [],
    isLoading,
    isError,
  } = useGetEscrows(wallet?.publicKey?.toString()!);
  const [onChainEscrows, setOnChainEscrows] = useState<any[]>([]);
  const [loadingOnChain, setLoadingOnChain] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEscrow, setSelectedEscrow] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Set use Effect
  // Fetch on-chain escrow data
  useEffect(() => {
    if (!wallet.connected || !wallet?.publicKey || dbEscrows.length === 0)
      return;

    const fetchOnChain = async () => {
      setLoadingOnChain(true);

      const results = await Promise.all(
        dbEscrows.map(async (escrow) => {
          try {
            const onChainData: any = await getEscrowViaPda(
              connection,
              wallet!,
              new PublicKey(escrow.escrowPda)
            );

            const cleanedOnChainData = await cleanOnChainEscrow(
              onChainData,
              connection
            );

            return { ...escrow, ...cleanedOnChainData };
          } catch (err) {
            console.error(
              "Error fetching on-chain escrow",
              escrow.escrowPda,
              err
            );
            return { ...escrow };
          }
        })
      );

      setOnChainEscrows(results);
      setLoadingOnChain(false);
    };

    fetchOnChain();
  }, [dbEscrows, wallet.connected, wallet.publicKey]);

  const { connected, publicKey } = useWallet();
  // Filter escrows for connected wallet
  const userEscrows =
    wallet.connected && publicKey
      ? onChainEscrows?.filter(
          (e) =>
            e.buyer === publicKey.toString() ||
            e.seller === publicKey.toString()
        ) ?? []
      : [];

  const filteredEscrows = userEscrows.filter((escrow) => {
    const matchesSearch =
      escrow.escrowPda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.seller.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || escrow.state === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, asset: string) => {
    return `${amount.toLocaleString()} ${MINT_TO_TOKEN[asset]}`; // TODO: adjust this
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleRowClick = (escrow: any) => {
    setSelectedEscrow(escrow);
    setDetailModalOpen(true);
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-12 glass-card text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Please connect your Solana wallet to view and manage your escrows
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Escrow Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your Solana escrow transactions
            </p>
          </div>
          <CreateEscrowModal />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 glass-card">
            <p className="text-sm text-muted-foreground mb-2">Active Escrows</p>
            <p className="text-3xl font-bold">
              {userEscrows.filter((e) => e.state === "active").length}
            </p>
          </Card>
          <Card className="p-6 glass-card">
            <p className="text-sm text-muted-foreground mb-2">Total Escrows</p>
            <p className="text-3xl font-bold">{userEscrows.length}</p>
          </Card>
          <Card className="p-6 glass-card">
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <p className="text-3xl font-bold">
              {userEscrows.filter((e) => e.state === "released").length}
            </p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 glass-card">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, buyer, or seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="assetSent">AssetSent</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Escrows Table */}
        <Card className="glass-card overflow-hidden">
          {filteredEscrows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No escrows found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escrow ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEscrows.map((escrow) => (
                    <TableRow
                      key={escrow._id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleRowClick(escrow)}
                    >
                      <TableCell className="font-mono font-medium">
                        {shortenAddress(escrow.escrowPda)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatAmount(
                              escrow.depositAmount,
                              escrow.depositMint
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            →{" "}
                            {formatAmount(
                              escrow.receiveAmount,
                              escrow.receiveMint
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={escrow.state as EscrowStatus} />
                      </TableCell>
                      <TableCell>{formatDate(escrow.createdAt)}</TableCell>
                      <TableCell>{formatDate(escrow.expiry)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(escrow);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <EscrowDetailModal
        escrow={selectedEscrow}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
