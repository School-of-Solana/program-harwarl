"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
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

// Mock data
const mockEscrows = [
  {
    id: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    buyer: "8h1fAn67wKhmatHS52HQBeYhM5JHEJap43U6YC4AT95x",
    seller: "9yKLpg3FX98d87TXJSDpbD5jBkheTqA83TzPosdBcV",
    depositAsset: "SOL",
    depositAmount: 50,
    receiveAsset: "USDC",
    receiveAmount: 5000,
    status: "pending",
    description: "Purchase USDC tokens",
    createdAt: "2025-11-20T10:30:00Z",
    expiry: "2025-11-27T10:30:00Z",
  },
  {
    id: "4pMTvg7JX23d87TXJSDpbD5jBkheTqA83KlNosgDsP",
    buyer: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    seller: "8h1fAn67wKhmatHS52HQBeYhM5JHEJap43U6YC4AT95x",
    depositAsset: "BONK",
    depositAmount: 1000000,
    receiveAsset: "SOL",
    receiveAmount: 10,
    status: "pending",
    description: "Sell BONK for SOL",
    createdAt: "2025-11-19T14:20:00Z",
    expiry: "2025-11-26T14:20:00Z",
  },
];

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEscrow, setSelectedEscrow] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filter escrows for connected wallet
  const userEscrows =
    connected && publicKey
      ? mockEscrows.filter(
          (e) =>
            e.buyer === publicKey.toString() ||
            e.seller === publicKey.toString()
        )
      : [];

  const filteredEscrows = userEscrows.filter((escrow) => {
    const matchesSearch =
      escrow.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.buyer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escrow.seller.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || escrow.status === statusFilter;

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
    return `${amount.toLocaleString()} ${asset}`;
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
              {userEscrows.filter((e) => e.status === "active").length}
            </p>
          </Card>
          <Card className="p-6 glass-card">
            <p className="text-sm text-muted-foreground mb-2">Total Escrows</p>
            <p className="text-3xl font-bold">{userEscrows.length}</p>
          </Card>
          <Card className="p-6 glass-card">
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <p className="text-3xl font-bold">
              {userEscrows.filter((e) => e.status === "released").length}
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
                <SelectItem value="requested_release">
                  Release Requested
                </SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
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
                      key={escrow.id}
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleRowClick(escrow)}
                    >
                      <TableCell className="font-mono font-medium">
                        {shortenAddress(escrow.id)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {formatAmount(
                              escrow.depositAmount,
                              escrow.depositAsset
                            )}
                          </div>
                          <div className="text-muted-foreground">
                            →{" "}
                            {formatAmount(
                              escrow.receiveAmount,
                              escrow.receiveAsset
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={escrow.status as EscrowStatus} />
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
