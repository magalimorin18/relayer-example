import { BigNumber, ethers } from "ethers";

import { getProvider } from "./ethers.service";
import { RELAYER_PRIVATE_KEY } from "../globals";
import { SigningRequest, SigningResponse } from "../interface";

let signer: ethers.Wallet;

async function getSigner() {
  const provider = getProvider();

  if (!RELAYER_PRIVATE_KEY) {
    throw new Error("No signing key set");
  }

  if (!signer) {
    signer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
  }

  return signer;
}

export async function signTransaction(
  signingRequest: SigningRequest,
  provider: ethers.providers.JsonRpcProvider
): Promise<SigningResponse> {
  const signer = await getSigner();

  let signerBalanceInWei: ethers.BigNumber;
  try {
    signerBalanceInWei = await signer.getBalance();
  } catch (error) {
    console.log("❌ Unable to get signing key balance.");
    throw error;
  }

  console.log(
    `💰 Signer address ${
      signer?.address
    } has a balance of ${ethers.utils.formatEther(signerBalanceInWei)} LYX`
  );

  const { to, gasLimit, transactionData } = signingRequest;

  if (Number(gasLimit) > Number(signerBalanceInWei)) {
    const errorMessage = `😢 Insufficiant balance. Gas Limit : ${gasLimit} SignerKeyBalance : ${signerBalanceInWei}`;
    throw new Error(errorMessage);
  }

  const signerAddress = signer.address;
  console.log(`🖋️ Signing transaction with signing key ${signerAddress}`);

  let signerNonce: number;
  try {
    signerNonce = await provider.getTransactionCount(signerAddress);
  } catch (error) {
    console.log("❌ Unable to get signing key nonce.");
    throw error;
  }
  const chainId = (await provider.getNetwork()).chainId;

  const transactionParameters = {
    to,
    from: signerAddress,
    nonce: signerNonce,
    gasLimit,
    value: 0,
    type: 2,
    chainId,
    data: transactionData,
  };

  let populatedTransaction;
  try {
    populatedTransaction = await signer.populateTransaction(
      transactionParameters
    );
  } catch (error) {
    console.log(`❌ Unable to populate transaction ${transactionParameters}.`);
    throw error;
  }

  let signerSignature: string;
  try {
    signerSignature = await signer.signTransaction(populatedTransaction);
  } catch (error) {
    console.log(`❌ Error signing transaction ${populatedTransaction}`);
    throw error;
  }

  return {
    signerSignature,
    signerAddress: signerAddress,
    nonce: signerNonce,
  };
}
