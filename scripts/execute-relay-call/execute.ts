//-------------------------------INPUTS TO SET--------------------------------------------
const inputs: ExecuteRequest = {
  universalProfileAddress: "0xda09F6F4acC07647C275319A7176A2D96E7cbA5c",
  userPrivateKey:
    "0x04a3042380a01c4600df3cd06a86755f51426493d8a0ba12118f47f64d84471e",
};
//---------------------------------------------------------------------------

/**
 * This script executes a relay call on a Universal Profile based on the inputs variable.
 * An example of the structure of the inputs can be found in scripts/execute-relay-call/example-inputs.json. It needs to be of type ExecuteRequest.
 *
 * Parameters :
 *`universalProfileAddress` : Universal Profile on which you want to execute an abi.
 *`userPrivateKey` : private key to sign the executeRelayCall message. This key needs to have permission on the universalProfileAddress to execute the payload. This key doesnt need to have LYX on it.
 *`abi`: optional. An abi to execute on the universal profile. By default, a SET_DATA will be executed.
 *
 * IMPORTANT : If you don't specify an abi parameters in the inputs variable then make sure your private key has the SET_DATA
 * permission on the Universal Profile because a default abi SET_DATA will be executed as the execute relay call.
 *
 * To execute the script by running the command :
 * `yarn run execute`

 * It is important that the userPrivateKey in the inputs has permissions to execute the payload you want on the Universal Profile.
 * e.g. if the payload sets data on the Universal Profile then the user private key needs SET_DATA permission.
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

const checkInputVariables = () => {
  if (!inputs?.universalProfileAddress) {
    throw new Error(
      "No universalProfileAddress provided in the inputs variable."
    );
  }

  if (!inputs?.userPrivateKey) {
    throw new Error("No userPrivateKey provided in the inputs variable.");
  }
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
  checkInputVariables();
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
