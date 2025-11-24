import mongoose from "mongoose";

const EscrowSchema = new mongoose.Schema(
  {
    buyer: {
      type: String,
      required: true,
    },
    seller: {
      type: String,
      required: true,
    },
    escrowPda: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: false }
);

export default mongoose.models.Escrow || mongoose.model("Escrow", EscrowSchema);
