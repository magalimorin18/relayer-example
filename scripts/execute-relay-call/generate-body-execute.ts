import { BigNumber, Wallet, ethers } from "ethers";
import { getProvider } from "../../src/libs/ethers.service";
import {
  LSP6KeyManager__factory,
  UniversalProfile__factory,
} from "../../types/ethers-v5";
import { EIP191Signer } from "@lukso/eip191-signer.js";
import { CHAIN_ID } from "../../src/globals";

export const generateExecuteParameters = async (
  universalProfileAddress: string,
  userPrivateKey: string,
  abi?: string
) => {
  const provider = getProvider();

  const universalProfile = UniversalProfile__factory.connect(
    universalProfileAddress,
    provider
  );
  console.log(`🆙 Universal Profile address : ${universalProfileAddress}`);

  const keyManagerAddress = await universalProfile.owner();
  console.log(`🔑 Key Manager address : ${keyManagerAddress}`);

  const keyManager = LSP6KeyManager__factory.connect(
    keyManagerAddress,
    provider
  );
  const wallet = new Wallet(userPrivateKey, provider);
  const walletAddress = wallet.address;
  console.log(`💳 Wallet address signing transaction : ${walletAddress}`);

  let nonce: BigNumber;
  try {
    nonce = await keyManager.getNonce(walletAddress, 0); //Use of channel 0
  } catch (error) {
    throw new Error(
      `❌ Error while fetching nonce of the Key Manager. ${error}`
    );
  }

  if (!abi) {
    abi = universalProfile.interface.encodeFunctionData("setData", [
      "0xcafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe",
      "0xcafecafe",
    ]);
  }

  const validityTimestamps = 0;

  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
    [
      25, // LSP25 Version
      CHAIN_ID,
      nonce,
      validityTimestamps,
      0, // the amount of native tokens to transfer (in Wei)
      abi,
    ]
  );

  const eip191Signer = new EIP191Signer();
  const { signature } = eip191Signer.signDataWithIntendedValidator(
    keyManagerAddress,
    message,
    userPrivateKey // This address needs permissions on the universalProfileAddress
  );

  const transactionObject = {
    abi,
    signature: signature,
    nonce, // Nonce has to be a Big number
    validityTimestamps,
  };

  return {
    address: universalProfileAddress,
    transaction: transactionObject,
  };
};
