import axios from "axios";
import {
  CHAIN_ID,
  RELAYER_BASE_URL,
  RELAYER_PRIVATE_KEY,
  UP_ADDRESS,
  USER_PRIVATE_KEY,
} from "../src/globals";
import { generateExecuteParameters } from "./generate-execute-body";

const checkEnvVariables = () => {
  if (!UP_ADDRESS) {
    throw new Error("No UP_ADDRESS provided.");
  }
  if (!RELAYER_PRIVATE_KEY) {
    throw new Error("No SIGNER_PRIVATE_KEY provided.");
  }
  if (!CHAIN_ID) {
    throw new Error("No CHAIN_ID provided.");
  }

  if (!USER_PRIVATE_KEY) {
    throw new Error("No USER_PRIVATE_KEY provided.");
  }
};

const main = async () => {
  checkEnvVariables();
  const body = await generateExecuteParameters();

  let response;
  try {
    console.log("🏁 Sending executeRelayCall request ...");
    response = await axios.post(RELAYER_BASE_URL + "/execute", body);
  } catch (error: any) {
    console.log(
      `❌ Error executing /execute endpoint: ${error.response.data.message}`
    );
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
