import { ethers } from "ethers";
import { UniversalProfile__factory } from "../../types/ethers-v5";
import { getProvider } from "../libs/ethers.service";
import { EIP191Signer } from "@lukso/eip191-signer.js";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";
import ERC725 from "@erc725/erc725.js";
import { TransactionParameters } from "../interface";

const MAGIC_VALUE = "0x1626ba7e";

export const executeMiddelware = async (
  address: string,
  transaction: TransactionParameters
) => {
  const provider = getProvider();
  const chainId = (await provider.getNetwork()).chainId;

  const universalProfile = UniversalProfile__factory.connect(address, provider);

  let keyManagerAddress: string;
  try {
    keyManagerAddress = await universalProfile.owner();
  } catch {
    throw new Error(`Provided address is not a Universal Profile ${address}`);
  }

  if (!keyManagerAddress) {
    throw new Error("No keyManagerAddress");
  }

  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
    [
      25, // LSP25 Version
      chainId,
      transaction.nonce,
      transaction.validityTimestamps || "0",
      0, // the amount of native tokens to transfer (in Wei)
      transaction.abi,
    ]
  );

  const eip191Signer = new EIP191Signer();

  const messageHash = eip191Signer.hashDataWithIntendedValidator(
    keyManagerAddress,
    message
  );

  let isValidSignature: string;
  try {
    isValidSignature = await universalProfile.isValidSignature(
      messageHash,
      transaction.signature
    );
  } catch {
    throw new Error(`Invalid signature provided`);
  }

  if (isValidSignature !== MAGIC_VALUE) {
    throw new Error(`Invalid signature provided`);
  }

  const signer = eip191Signer.recover(messageHash, transaction.signature);

  const signerPermisisons = await universalProfile.getData(
    ERC725YDataKeys.LSP6["AddressPermissions:Permissions"] + signer.slice(2)
  );

  const encodedPermission = ERC725.encodePermissions({
    EXECUTE_RELAY_CALL: true,
  });

  if (
    signerPermisisons === "0x" ||
    !ERC725.checkPermissions(encodedPermission, signerPermisisons)
  ) {
    throw new Error(
      "No EXECUTE_REALY_CALL permission set on controller of Universal Profile."
    );
  }
};
