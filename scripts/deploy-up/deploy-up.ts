/**
 * This script deploys a Universal Profiles based on the inputs variable.
 * An example of the structure of the inputs can be found in scripts/deploy-up/example-inputs.json.
 * It needs to be of type DeployUpRequest.
 *
 * Parameters :
 *`controllers` : A list of controller addresses with permissions to be set on the deployed Universal Profile.
 *`lsp3ProfileMetadata`: optional. LSP3 Metadata to set on the deployed Universal Profile.
 *
 *
 *
 * To execute the script by running the command :
 * `yarn run deploy-up`
 *
 * - The script will deploy a Universal Profile with controller addresses from the example-inputs.json file
 * and assign then the permissions you set.
 * e.g. If in the file example-inputs.json you set in the controllers array :
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
import {
  CHAIN_ID,
  RELAYER_BASE_URL,
  RELAYER_PRIVATE_KEY,
} from "../../src/globals";
import { DeployUpRequest, DeployUpResponse } from "../../src/interface";

const checkEnvVariables = () => {
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error("No RELAYER_PRIVATE_KEY provided.");
  }
  if (!CHAIN_ID) {
    throw new Error("No CHAIN_ID provided.");
  }
};

//-------------------------------INPUTS TO SET--------------------------------------------
const inputs: DeployUpRequest = {
  controllers: [
    {
      address: "0x479a0BD32ba791E92d8bF9BF263eF63780182645",
      permissions:
        "0x0000000000000000000000000000000000000000000000000000000000040000",
    },
    {
      address: "0xDD06fC1f047103ea047654c57C6f6F754E91CD24",
      permissions:
        "0x00000000000000000000000000000000000000000000000000000000003f3f7f",
    },
    {
      address: "0x55535425c795C972b2723492e76f0c8D61dBFFB4",
      permissions:
        "0x00000000000000000000000000000000000000000000000000000000003f3f7f",
    },
  ],
  lsp3ProfileMetadata:
    "0x6f357c6ae8b1db2db7ce8a555019ab31c557e9934145c0baa7fdae3f1a131e736d3d4e8e697066733a2f2f516d583543365939614a35646879697533546446704b6258797653434345386a435477514436374743784d705a31",
};
//---------------------------------------------------------------------------

const main = async () => {
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
