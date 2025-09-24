import mongoose from "mongoose";



const UserSchema = new mongoose.Schema(
  {
    investments: [
  {
    amount: { type: Number, required: true },
    investedAt: { type: Date, default: Date.now },
    lastInterestClaimed: { type: Date, default: Date.now }
  }
],


    id: { type: String, required: true, unique: true }, // like RTX431284
    date: { type: Number, required: true }, // timestamp (epoch style)

    walletAddress: { type: String, required: true, unique: true },
    sponserId: { type: String }, // reference sponsor wallet

    userAmount: { type: Number, default: 0 }, // principal investment
    updatedAmount: { type: Number, default: 0 }, // latest updated amount
    coins: { type: Number, default: 0 }, // withdrawable coins
    ROI: { type: Number, default: 0 }, // return on investment
    hourlyCycle: { type: Number, default: 0 }, // cycle counter for interest

    unlockedLevel: { type: Number, default: 0 },

    refTeam: { type: Object, default: {} },
    totalLevelIncome: { type: Object, default: {} },
    completeTotalIncome: { type: Number, default: 0 },

    parentDetail: { type: Array, default: [] }, // could also be [Schema.Types.Mixed]
    directFriends: { type: Array, default: [] },
    team: { type: Object, default: {} },

    statement: { type: Array, default: [] }, // transaction or log history
  },
  { timestamps: true } // 👈 adds createdAt & updatedAt automatically
);

const User = mongoose.model("User", UserSchema);

export default User;
