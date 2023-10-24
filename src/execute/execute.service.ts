import { Transaction } from "./interface";

export const executeTransaction = async (
  universalProfileAddress: string,
  transaction: Transaction
) => {
  console.log("executing Transaction");
  console.log(universalProfileAddress);
  console.log(transaction);

  return "0x...";
};
