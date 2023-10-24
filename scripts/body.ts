import { BigNumber, Wallet, ethers } from "ethers";
import { getProvider } from "../src/libs/ethers.service";
import {
  LSP6KeyManager__factory,
  UniversalProfile__factory,
} from "../types/ethers-v5";
import { EIP191Signer } from "@lukso/eip191-signer.js";
import { CHAIN_ID, SIGNER_PRIVATE_KEY, UP_ADDRESS } from "../src/globals";

export const generateExecuteBody = async () => {
  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(
    UP_ADDRESS,
    provider
  );
  console.log(`🆙 Universal Profile address : ${UP_ADDRESS}`);

  const keyManagerAddress = await universalProfile.owner();
  console.log(`🔑 Key Manager address : ${keyManagerAddress}`);

  const keyManager = LSP6KeyManager__factory.connect(
    keyManagerAddress,
    provider
  );
  const wallet = new Wallet(SIGNER_PRIVATE_KEY, provider);
  const walletAddress = wallet.address;
  console.log(
    `💳 Wallet address signing transaction (Need permission on the UP_ADDRESS): ${walletAddress}`
  );

  let nonce: BigNumber;
  try {
    nonce = await keyManager.getNonce(walletAddress, 0); //Use of channel 0
  } catch (error) {
    throw new Error(
      `❌ Error while fetching nonce of the Key Manager. ${error}`
    );
  }

  const abiPayload = universalProfile.interface.encodeFunctionData("setData", [
    "0xcafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe",
    "0xcafecafe",
  ]);

  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
    [
      25, // LSP25 Version
      CHAIN_ID,
      nonce,
      0, // validity timestamps
      0, // the amount of native tokens to transfer (in Wei)
      abiPayload,
    ]
  );

  const eip191Signer = new EIP191Signer();
  const { signature } = eip191Signer.signDataWithIntendedValidator(
    keyManagerAddress,
    message,
    SIGNER_PRIVATE_KEY // This address needs permissions on the UP_ADDRESS
  );

  const transactionObject = {
    abi: abiPayload,
    signature: signature,
    nonce, // Nonce has to be a Big number
  };

  return {
    address: UP_ADDRESS,
    transaction: transactionObject,
  };
};
