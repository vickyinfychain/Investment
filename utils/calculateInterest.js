export const calculateInterest = (investment) => {
  const now = new Date();
  const secondsPassed = Math.floor((now - investment.lastInterestClaimed) / 1000);

  if (secondsPassed >= 10) {
    const periods = Math.floor(secondsPassed / 10);
    const interest = investment.amount * 0.02 * periods;

    console.log(
      `Compounding: on ${investment.amount} = +${interest} (for ${periods} cycles of 10s)`
    );

    // Add interest directly into investment (compounding)
    investment.amount += interest;
    investment.lastInterestClaimed = new Date();

    return interest;
  }
  return 0;
};
