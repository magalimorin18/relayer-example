import { BigNumber, ethers } from "ethers";
import {
  LSP6KeyManager__factory,
  UniversalProfile__factory,
  LSP6KeyManagerInit__factory,
} from "../../types/ethers-v5";

import { getProvider } from "../libs/ethers.service";
import { TransactionParameters } from "../interface";
import { transactionGate, waitForTransaction } from "../libs/listener.service";
import { signTransaction } from "../libs/signer.service";

export const executeTransaction = async (
  address: string,
  transaction: TransactionParameters
) => {
  console.log(`📥 Received execute request for Universal Profile ${address}`);

  transactionGate();

  const { signature, nonce, abi, validityTimestamps } = transaction;

  const provider = getProvider();
  const lsp6Interface = LSP6KeyManagerInit__factory.createInterface();

  const universalProfile = UniversalProfile__factory.connect(address, provider);
  const keyManagerAddress = await universalProfile.owner();
  const keyManager = LSP6KeyManager__factory.connect(
    keyManagerAddress,
    provider
  );

  let gasLimit: BigNumber;
  try {
    gasLimit = await keyManager.estimateGas.executeRelayCall(
      signature,
      nonce,
      validityTimestamps,
      abi
    );
  } catch (error) {
    gasLimit = BigNumber.from(3000000);
    console.log(
      "⏭️ Unable to estimate gas. Setting default value to gas Limit"
    );
  }

  const transactionData = lsp6Interface.encodeFunctionData("executeRelayCall", [
    signature,
    nonce,
    validityTimestamps,
    abi,
  ]);

  const signedTransaction = await signTransaction(
    {
      to: keyManagerAddress,
      transactionData,
      gasLimit,
    },
    provider
  );

  let transactionResponse: ethers.providers.TransactionResponse;
  try {
    transactionResponse = await provider.sendTransaction(
      signedTransaction.signerSignature
    );
  } catch (error) {
    console.log("❌ Error sending transaction to the blockchain.");
    throw error;
  }

  console.log("⏳ Waiting for transaction to be mined...");

  await waitForTransaction(transactionResponse);

  const transactionHash = ethers.utils.keccak256(
    signedTransaction.signerSignature
  );

  console.log(
    `🎉 Successfully sent transaction: https://explorer.execution.testnet.lukso.network/tx/${transactionHash}`
  );

  return transactionHash;
};
