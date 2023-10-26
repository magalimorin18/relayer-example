import { BigNumber, BytesLike } from "ethers";

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
export interface DeployUpRequest {
  controllers: Controllers[];
  lsp3ProfileMetadata?: string;
}

export interface DeployUpResponse {
  universalProfileAddress: string;
  keyManagerAddress: string;
  transactionHash: string;
}

export interface ExecuteRequest {
  universalProfileAddress: string;
  userPrivateKey: string;
  abi?: string;
}

export interface Controllers {
  address: string;
  permissions: BytesLike;
}
