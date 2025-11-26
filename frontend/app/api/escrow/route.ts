import { NextRequest } from "next/server";
import Escrow from "../../models/escrow";
import dbConnect from "@/app/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    dbConnect();
    const createEscrowPayload = await req.json();

    if (!createEscrowPayload) {
      return new Response(
        JSON.stringify({
          error: "Missing Payload",
        }),
        {
          status: 500,
        }
      );
    }

    const { owner, receiver, escrowPda, description } = createEscrowPayload;

    if (!owner || !receiver || !escrowPda) {
      return new Response(
        JSON.stringify({
          error: "Missing Fields",
        }),
        {
          status: 400,
        }
      );
    }

    const alreadyExists = await Escrow.findOne({ escrowPda });

    if (alreadyExists) {
      return new Response(
        JSON.stringify({
          error: "Already Existing data",
        }),
        {
          status: 400,
        }
      );
    }

    const data = await Escrow.create({
      owner,
      receiver,
      description: description || "",
      escrowPda,
    });

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.log({ error });
    return new Response(
      JSON.stringify({
        error: "Failed to create escrow",
      }),
      {
        status: 500,
      }
    );
  }
}
