# Relayer Example

## ⛽️ Description

A Service Relayer allows to send transactions on behalf of a user to cover their gas costs.

## 🚀 Installation

To begin sending transaction with the Dummy Transaction Relayer create a `.env` file to hold configuration parameters:

```sh
cp .env.example .env
```

`UP_ADDRESS` : Universal Profile on which you want to execute a payload.
`USER_PRIVATE_KEY` : Used to sign the executeRelayCall message. This key needs to have permission on the UP_ADDRESS to execute the payload. No need of fund.
`RELAYER_PRIVATE_KEY` : Used by the relayer to send the transaction to the blockchain on behalf of the user. Need to be funded with sufficient balance to execute transactions on the blockchain.

## 🛞 Implementation

The API of the service relayer is standardized according to the [LSP15-TransactionRelayServiceAPI](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-15-TransactionRelayServiceAPI.md).

#### POST `/execute`

Executes a signed transaction on behalf of a Universal Profile using `executeRelayCall` function of the Key Manager owning this Universal Profile.

#### Request body

```json
{
  "address": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD", // Address of the UP
  "transaction": {
    "abi": "0x7f23690c5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000596f357c6aa5a21984a83b7eef4cb0720ac1fcf5a45e9d84c653d97b71bbe89b7a728c386a697066733a2f2f516d624b43744b4d7573376741524470617744687a32506a4e36616f64346b69794e436851726d3451437858454b00000000000000",
    "signature": "0x43c958b1729586749169599d7e776f18afc6223c7da21107161477d291d497973b4fc50a724b1b2ab98f3f8cf1d5cdbbbdf3512e4fbfbdc39732229a15beb14a1b",
    "nonce": 1, // KeyManager nonce
    "validityTimestamps": "0x0000000000000000000000006420f3f000000000000000000000000065ec82d0"
  }
}
```

- `address` - The address of the Universal Profile which is executing the transaction.
- `transaction` - An object containing the transaction parameters which will be executed with `executeRelayCall`.
  - `abi` - The abi-encoded transaction data (_e.g: a function call on the Universal Profile smart contract_) which will be passed as the payload parameter to the `executeRelayCall` function.
  - `signature` - The signed message according to LSP6 specification. See below for more details.
  - `nonce` - The nonce of the KeyManager fetched by calling `getNonce(address address, uint128 channelId)` on the LSP6 KeyManager contract.
  - `validityTimestamps` (optional) - Two concatenated `uint128` timestamps which indicate a time duration for which the transaction will be considered valid. If no validityTimestamps parameter is passed the relayer should assume that validityTimestamps is `0` and the transaction will be valid indefinitely until it is executed.

#### Response

The transaction hash of the executeRelayCall transaction.

```json
{
  "transactionHash": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD"
}
```

## 🖋️ LSP6 specification to construct the executeRelayCall signature

You can find an example of how to generate the signature in `scripts/generate-execute-body.ts`

### Construct the message

```
  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
    [
      LSP25 Version
      Chain Id
      Nonce,
      ValidityTimestamps
      Amount of native tokens to transfer (in Wei)
      AbiPayload,
    ]
  );
```

Example :

```
  const message = ethers.utils.solidityPack(
    ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
    [
      25,
      '4201',
      { _hex: '0x0c', _isBigNumber: true },
      0,
      0,
      0x7f23690ccafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004cafecafe00000000000000000000000000000000000000000000000000000000,
    ]
  );
```

### Sign the message

The message is signed by an address that needs to have permission on the Universal Profile in order to execute the abi Payload.

EIP191 library's function `signDataWithIntendedValidator` generate the signature.

```
const eip191Signer = new EIP191Signer();

const { signature } = eip191Signer.signDataWithIntendedValidator(
keyManagerAddress, // Key Manager of the Universal Profile
message,
privateKey // This address needs permissions on the UP_ADDRESS
);
```

## 🌉 Transaction Gate

This project does not handle concurrent transactions. To prevent nonce reuse errors, a transaction gate is implemented which will block incoming transactions if there is already a transaction pending.

## 📝 Notes

This relayer doesnt implement the `/quota` endpoint.

In new version of Smart Contract Standard, EXECUTE RELAY CALL permission must be enabled.
