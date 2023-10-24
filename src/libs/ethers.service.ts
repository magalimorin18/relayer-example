import { ethers } from "ethers";
import { RPC_ENDPOINT } from "../globals";

let provider: ethers.providers.JsonRpcProvider;

export function getProvider() {
  if (!provider) {
    provider = new ethers.providers.JsonRpcProvider(RPC_ENDPOINT);
  }

  return provider;
}
