import mongoose from "mongoose";

const EscrowSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
    },
    receiver: {
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
  { timestamps: true }
);

export default mongoose.models.Escrow || mongoose.model("Escrow", EscrowSchema);
