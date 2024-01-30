/**
 * This script deploys a Universal Profiles based on the inputs variable.
 * An example of the structure of the inputs can be found in scripts/deploy-up/example-up-inputs.json.
 * It needs to be of type DeployUpRequest.
 *
 * Parameters :
 *`controllers` : A list of controller addresses with permissions to be set on the deployed Universal Profile.
 *`lsp3ProfileMetadata`: optional. LSP3 Metadata to set on the deployed Universal Profile.
 *
 * ⚠️ Update from the oral prensentation: The parameters are loaded from the json file directly.
 * To execute the script:
 * `yarn run deploy-up example-up-inputs.json`
 *
 * The file example-up-inputs.json needs to be in the same folder as deploy-up.ts file.
 *
 * - The script will deploy a Universal Profile with controller addresses from the example-up-inputs.json file
 * and assign then the permissions you set.
 * e.g. If in the file example-up-inputs.json you set in the controllers array :
 *    {
 *     "address": "0x479a0BD32ba791E92d8bF9BF263eF63780182645",
 *    "permissions": "0x0000000000000000000000000000000000000000000000000000000000040000"
 *    }
 * Then, the address 0x479a0BD32ba791E92d8bF9BF263eF63780182645 will have SET_DATA permission on the UP.
 * In order to encode and decode permission you can use : `https://erc725-inspect.lukso.tech/key-manager`
 *
 * - The script will set a Universal Receiver Delegate on the deployed Universal Profile.
 *
 * - If you provide lsp3ProfileMetadata in the example-inputs file, the script will set LSP3 metadata on the deployed Universal Profile.
 *
 */

import axios from "axios";
import { RELAYER_BASE_URL, RELAYER_PRIVATE_KEY } from "../../src/globals";
import { DeployUpRequest, DeployUpResponse } from "../../src/interface";

const fileName = process.argv[2];

const checkInputVariables = async () => {
  if (!fileName) {
    throw new Error(
      "Please specify the file name containing the deploy-up parameters."
    );
  }
  const filePath = "./" + fileName;
  console.log("📁 Loading deploy-up parameters from path:", filePath);
  const inputs: DeployUpRequest = await import(filePath);

  if (!inputs?.controllers) {
    throw new Error("No controllers provided in the inputs variable.");
  }

  inputs.controllers.forEach((controller) => {
    if (!controller?.address || !controller?.permissions) {
      throw new Error("Invalid input parameters for controllers.");
    }
  });

  return inputs;
};

const checkEnvVariables = () => {
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error("No RELAYER_PRIVATE_KEY provided.");
  }
};

const main = async () => {
  const inputs = await checkInputVariables();
  checkEnvVariables();

  let response;
  try {
    console.log("⏳ Sending Universal Profile deployment request ...");
    response = await axios.post(
      RELAYER_BASE_URL + "/universal-profile",
      inputs
    );

    const { universalProfileAddress, transactionHash, keyManagerAddress } =
      response?.data as DeployUpResponse;

    console.log(
      `🎉 Successfully sent transaction: https://explorer.execution.testnet.lukso.network/tx/${transactionHash}`
    );
    console.log(
      `🆙 Universal Profile deployed at address ${universalProfileAddress} with 🔑 Key Manager ${keyManagerAddress}`
    );
  } catch (error: any) {
    console.log(
      `❌ Error executing /universal-profile endpoint: ${error?.response?.data?.message}`
    );
    return;
  }
};

main()
  .then(() => {
    console.log("✅Done.");
  })
  .catch((error: any) => {
    console.log("❌", error);
  });
