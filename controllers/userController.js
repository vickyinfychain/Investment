import User from "../models/User.js";
import { calculateInterest } from "../utils/calculateInterest.js";

export const getAvailableInterest = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    let totalInterest = 0;

    user.investments.forEach((inv) => {
      const interest = calculateInterest(inv);
      totalInterest += interest;
    });

    await user.save();

    console.log(`User ${walletAddress} earned: ${totalInterest}, new principal updated`);

    res.json({
      success: true,
      addedInterest: totalInterest,
      investments: user.investments
    });
  } catch (err) {
    console.error("Error in getAvailableInterest:", err.message);
    res.status(500).json({ error: err.message });
  }
};



export const registerUser = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    let user = await User.findOne({ walletAddress });

    if (!user) {
      user = new User({ walletAddress });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const investAmount = async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.coins += amount;
    user.investments.push({
      amount,
      investedAt: new Date(),
      lastInterestClaimed: new Date()
    });

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const claimInterest = async (req, res) => {
  try {
    const { walletAddress, claimAmount } = req.body;

    if (!claimAmount || claimAmount <= 0) {
      return res.status(400).json({ error: "claimAmount must be greater than 0" });
    }

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    let totalGrowth = 0;

    // Calculate compounding growth
    user.investments.forEach((inv) => {
      const growth = calculateInterest(inv); // updates principal
      totalGrowth += growth;
    });

    await user.save();

    if (totalGrowth === 0) {
      return res.json({ message: "No new interest available yet." });
    }

    // User cannot claim more than the new growth (freshly earned interest)
    if (claimAmount > totalGrowth) {
      return res.status(400).json({ error: "Not enough new interest to claim" });
    }

    // Apply 10% fee
    const fee = claimAmount * 0.1;
    const withdrawable = claimAmount - fee;

    // Add withdrawable to wallet
    user.coins += withdrawable;
    await user.save();

    console.log(
      `User ${walletAddress} claimed ${claimAmount}. Withdrawable: ${withdrawable}, Fee: ${fee}`
    );

    res.json({
      success: true,
      claimed: claimAmount,
      withdrawable,
      fee,
      totalGrowth
    });
  } catch (err) {
    console.error("Error in claimInterest:", err.message);
    res.status(500).json({ error: err.message });
  }
};





export const withdrawPrincipal = async (req, res) => {
  try {
    const { walletAddress, amount } = req.body;
    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: "User not found" });

    const investment = user.investments.find((inv) => inv.amount >= amount);
    if (!investment) {
      return res.status(400).json({ error: "Insufficient investment amount" });
    }

    const monthsPassed =
      (new Date() - new Date(investment.investedAt)) / (1000 * 60 * 60 * 24 * 30);

    let feeRate = 0;
    if (monthsPassed < 1) {
      feeRate = 0.25;
    } else if (monthsPassed < 2) {
      feeRate = 0.15;
    }

    const fee = amount * feeRate;
    const withdrawable = amount - fee;

    investment.amount -= amount;
    if (investment.amount <= 0) {
      user.investments = user.investments.filter((inv) => inv.amount > 0);
    }

    user.coins += withdrawable;
    await user.save();

    res.json({ success: true, withdrawable, fee, amount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};