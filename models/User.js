import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  investedAt: { type: Date, required: true },
  lastInterestClaimed: { type: Date, required: true },
  availableInterest: { type: Number, default: 0 } // 👈 new field
});


const userSchema = new mongoose.Schema({
  walletAddress: { type: String, unique: true, required: true },
  coins: { type: Number, default: 0 },
  investments: [InvestmentSchema]
});

export default mongoose.model("User", userSchema);