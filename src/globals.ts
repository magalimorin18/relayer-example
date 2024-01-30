export const RPC_ENDPOINT =
  process.env.RPC_ENDPOINT || "https://rpc.testnet.lukso.network";

export const RELAYER_PRIVATE_KEY =
  process.env.RELAYER_PRIVATE_KEY ||
  "0x04a3042380a01c4600df3cd06a86755f51426493d8a0ba12118f47f64d84471e";

export const RELAYER_BASE_URL = process.env.RELAYER_BASE_URL
  ? process.env.RELAYER_BASE_URL
  : "http://0.0.0.0:3000";
