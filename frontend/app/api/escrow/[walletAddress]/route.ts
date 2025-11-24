import { NextRequest } from "next/server";
import Escrow from "../../../models/escrow";
import dbConnect from "@/app/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  try {
    dbConnect();
    const walletAddress = (await params).walletAddress;

    const escrows = await Escrow.find({
      $or: [{ buyer: walletAddress }, { seller: walletAddress }],
    });

    return new Response(JSON.stringify(escrows), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: "Failed to fetch swap tokens",
      }),
      {
        status: 500,
      }
    );
  }
}
