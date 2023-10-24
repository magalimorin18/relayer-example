export interface Transaction {
  abi: string;
  signature: string;
  nonce: number;
}

export interface ExecutePayload {
  universalProfileAddress: string;
  transaction: Transaction;
}
