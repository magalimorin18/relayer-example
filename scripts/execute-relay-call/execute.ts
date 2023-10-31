/**
 * This script executes a relay call on a Universal Profile based on the inputs variable.
 * An example of the structure of the inputs can be found in scripts/execute-relay-call/example-execute-inputs.json. It needs to be of type ExecuteRequest.
 *
 * Parameters :
 *`universalProfileAddress` : Universal Profile on which you want to execute an abi.
 *`userPrivateKey` : private key to sign the executeRelayCall message. This key needs to have permission on the universalProfileAddress to execute the payload. This key doesnt need to have LYX on it.
 *`abi`: optional. An abi to execute on the universal profile. By default, a SET_DATA will be executed.
 *
 * IMPORTANT : If you don't specify an abi parameters in the inputs variable, make sure the userPrivateKey has SET_DATA
 * permission on the Universal Profile as by default a SET_DATA transaction will be executed as the execute relay call.
 *
 * ⚠️ Update from the oral prensentation: The parameters are loaded from the json file directly.
 * To execute the script:
 * `yarn run execute example-execute-inputs.json`
 *
 * The file example-execute-inputs.json needs to be in the same folder as execute.ts file.
 *
 * It is important that the userPrivateKey in the inputs has permissions to execute the payload you want on the Universal Profile.
 * e.g. if you choose to execute a payload that TRANSFER_VALUE on the Universal Profile then the user private key needs TRANSFER_VALUE permission.
 *
 */

import axios from "axios";
import {
  CHAIN_ID,
  RELAYER_BASE_URL,
  RELAYER_PRIVATE_KEY,
} from "../../src/globals";
import { generateExecuteParameters } from "./generate-body-execute";
import { ExecuteRequest } from "../../src/interface";

const fileName = process.argv[2];

const checkInputVariables = async () => {
  if (!fileName) {
    throw new Error(
      "Please specify the file name containing the execute parameters."
    );
  }
  const filePath = "./" + fileName;
  console.log("📁 Loading execute parameters from path:", filePath);
  const inputs: ExecuteRequest = await import(filePath);

  if (!inputs?.universalProfileAddress) {
    throw new Error(
      "No universalProfileAddress provided in the inputs variable."
    );
  }

  if (!inputs?.userPrivateKey) {
    throw new Error("No userPrivateKey provided in the inputs variable.");
  }

  return inputs;
};

const checkEnvVariables = () => {
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error("No RELAYER_PRIVATE_KEY provided.");
  }

  if (!CHAIN_ID) {
    throw new Error("No CHAIN_ID provided.");
  }
};

const main = async () => {
  const inputs = await checkInputVariables();
  checkEnvVariables();

  const body = await generateExecuteParameters(
    inputs.universalProfileAddress,
    inputs.userPrivateKey,
    inputs?.abi
  );

  let response;
  try {
    console.log("⏳ Sending Execute Relay Call request ...");
    response = await axios.post(RELAYER_BASE_URL + "/execute", body);
  } catch (error: any) {
    console.log(`❌ Error executing /execute endpoint`);
    error?.response?.data?.message && console.log(error.response.data.message);
    return;
  }

  console.log(
    `🎉 Successfully sent transaction: https://explorer.execution.testnet.lukso.network/tx/${response.data.transactionHash}`
  );
};

main()
  .then(() => {
    console.log("✅Done.");
  })
  .catch((error: any) => {
    console.log("❌", error);
  });
