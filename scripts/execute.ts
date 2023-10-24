import axios from "axios";
import { executeTransaction } from "../src/execute/execute.service";
import {
  CHAIN_ID,
  RELAYER_BASE_URL,
  SIGNER_PRIVATE_KEY,
  UP_ADDRESS,
} from "../src/globals";
import { generateExecuteBody } from "./body";

const checkEnvVariables = () => {
  if (!UP_ADDRESS) {
    throw new Error("No UP_ADDRESS provided.");
  }
  if (!SIGNER_PRIVATE_KEY) {
    throw new Error("No SIGNER_PRIVATE_KEY provided.");
  }
  if (!CHAIN_ID) {
    throw new Error("No CHAIN_ID provided.");
  }
};

const main = async () => {
  checkEnvVariables();
  const executeBody = await generateExecuteBody();

  let response;
  try {
    console.log("🏁 Generating executeRelayCall request ...");
    response = await axios.post(RELAYER_BASE_URL + "/execute", executeBody);
  } catch (error) {
    console.log(`❌ Error executing /execute endpoint ${error}`);
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
