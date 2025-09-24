import User from "../models/User.js";
import { calculateInterest } from "../utils/calculateInterest.js";

export const getAvailableInterest = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // calculate simple 2% interest
    const interest = user.userAmount * 0.02;

    // compound interest
    user.updatedAmount += interest;

    // add interest to ROI (track unclaimed pool)
    user.ROI += interest;

    // log statement
    user.statement.push({
      type: "INTEREST",
      amount: interest,
      date: new Date(),
      description: `Added interest of ${interest}`
    });

    await user.save();

    res.json({
      success: true,
      addedInterest: interest,
      updatedAmount: user.updatedAmount,
      ROI: user.ROI
    });
  } catch (err) {
    console.error("Error in getAvailableInterest:", err.message);
    res.status(500).json({ error: err.message });
  }
};




function generateUserId() {
  // Example: RTX + random 6 digits
  return "RTX" + Math.floor(100000 + Math.random() * 900000);
}

export const registerUser = async (req, res) => {
  try {
    const { walletAddress, sponserId } = req.body;

    let user = await User.findOne({ walletAddress });

    if (!user) {
      user = new User({
        id: generateUserId(),
        date: Date.now(),
        walletAddress,
        sponserId: sponserId || null,

        // 🔹 base values
        userAmount: 0,
        updatedAmount: 0,
        coins: 0,
        ROI: 0,
        hourlyCycle: 0,
        unlockedLevel: 0,
        refTeam: {},
        totalLevelIncome: {},
        completeTotalIncome: 0,
        parentDetail: [],
        directFriends: [],
        team: {},
        statement: []
      });

      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error in registerUser:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const investAmount = async (req, res) => {
  try {
    let { walletAddress, amount } = req.body;
    amount = Number(amount);

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const coinRate = 1; // set your conversion rate
    const coinsToAdd = amount * coinRate;

    // increase balances
    user.userAmount += amount;
    user.updatedAmount = user.userAmount;
    user.coins += coinsToAdd;

    user.statement.push({
      type: "INVESTMENT",
      amount,
      date: new Date(),
      description: `Invested ${amount} (converted to ${coinsToAdd} coins)`
    });

    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error in investAmount:", err.message);
    res.status(500).json({ error: err.message });
  }
};



export const claimInterest = async (req, res) => {
  try {
    let { walletAddress, claimAmount } = req.body;
    claimAmount = Number(claimAmount);

    if (!claimAmount || claimAmount <= 0) {
      return res.status(400).json({ error: "claimAmount must be greater than 0" });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    // available interest = ROI
    const availableInterest = user.ROI;

    if (availableInterest <= 0) {
      return res.json({ message: "No new interest available yet." });
    }

    if (claimAmount > availableInterest) {
      return res.status(400).json({ error: "Not enough interest to claim" });
    }

    // Apply 10% fee
    const fee = claimAmount * 0.1;
    const withdrawable = claimAmount - fee;

    // Deduct claimed interest from ROI
    user.ROI -= claimAmount;

    // Deduct claimed interest from updatedAmount
    user.updatedAmount -= claimAmount;

    // Add withdrawable coins
    user.coins += withdrawable;

    // log statement
    user.statement.push({
      type: "CLAIM_INTEREST",
      amount: claimAmount,
      fee,
      withdrawable,
      date: new Date(),
      description: `Claimed interest ${claimAmount}, Fee ${fee}`
    });

    await user.save();

    res.json({
      success: true,
      claimed: claimAmount,
      withdrawable,
      fee,
      remainingInterest: user.ROI,
      ROI: user.ROI
    });
  } catch (err) {
    console.error("Error in claimInterest:", err.message);
    res.status(500).json({ error: err.message });
  }
};




export const withdrawPrincipal = async (req, res) => {
  try {
    let { walletAddress, amount } = req.body;
    amount = Number(amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (amount > user.userAmount) {
      return res.status(400).json({ error: "Insufficient investment amount" });
    }

    // Calculate how many months have passed since registration (or first invest)
    const monthsPassed =
      (new Date() - new Date(user.date)) / (1000 * 60 * 60 * 24 * 30);

    let feeRate = 0;
    if (monthsPassed < 1) {
      feeRate = 0.25; // 25% in 1st month
    } else if (monthsPassed < 2) {
      feeRate = 0.15; // 15% in 2nd month
    }

    const fee = amount * feeRate;
    const withdrawable = amount - fee;

    // Deduct from user balances
    user.userAmount -= amount;
    user.updatedAmount -= amount;

    // Add withdrawable to wallet
    user.coins += withdrawable;

    // Log transaction
    user.statement.push({
      type: "WITHDRAW_PRINCIPAL",
      amount,
      fee,
      withdrawable,
      date: new Date(),
      description: `Withdrew principal of ${amount} with fee ${fee}`
    });

    await user.save();

    res.json({ success: true, withdrawable, fee, remainingPrincipal: user.userAmount });
  } catch (err) {
    console.error("Error in withdrawPrincipal:", err.message);
    res.status(500).json({ error: err.message });
  }
};
