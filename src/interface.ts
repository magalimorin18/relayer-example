import { BigNumber } from "ethers";

export interface TransactionParameters {
  abi: string;
  signature: string;
  nonce: BigNumber;
  validityTimestamps: number;
}

export interface ExecutePayload {
  address: string;
  transaction: TransactionParameters;
}

export interface SigningRequest {
  transactionData: string;
  to: string;
  gasLimit: BigNumber;
}

export interface SigningResponse {
  signerSignature: string;
  signerAddress: string;
  nonce: number;
}
