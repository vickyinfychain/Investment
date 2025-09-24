import express from "express";
import {
  registerUser,
  investAmount,
  claimInterest,
  withdrawPrincipal,
  getAvailableInterest
} from "../controllers/userController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/invest", investAmount);
router.post("/claim-interest", claimInterest);
router.post("/withdraw-principal", withdrawPrincipal);
router.post("/get-interest", getAvailableInterest);

export default router;