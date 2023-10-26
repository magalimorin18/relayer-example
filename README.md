# Relayer Example

## ⛽️ Description

A Service Relayer allows to send transactions on behalf of a user to cover their gas costs.

## 🚀 Installation

To begin sending transaction with the Dummy Transaction Relayer create a `.env` file to hold configuration parameters:

```sh
cp .env.example .env
```

- `RELAYER_PRIVATE_KEY` : Used by the relayer to send the transaction to the blockchain on behalf of the user. Need to be funded with sufficient LYX balance to execute transactions on the blockchain.
  To fund this key use the faucet : `https://faucet.testnet.lukso.network`

To run the project

```sh
yarn dev
```

This command will generate the types and start the server at default address `http://0.0.0.0:3000`

## 🛞 Implementation

### POST `/execute`

Executes a signed transaction on behalf of a Universal Profile using `executeRelayCall` function of the Key Manager owning this Universal Profile.

#### Request body

```json
{
  "address": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD", // Address of the Universal Profile
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

#### 🖋️ LSP6 specification to construct the executeRelayCall signature

You can find an example of how to generate the signature in `scripts/generate-execute-body.ts`

##### Construct the message

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

##### Sign the message

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

#### 🌉 Transaction Gate

This project does not handle concurrent transactions. To prevent nonce reuse errors, a transaction gate is implemented which will block incoming transactions if there is already a transaction pending.

### POST `/universal-profile`

Deploy a Universal Profile with controller addresses and LSP3 Metadata.

```json
{
  "controllers": [
    {
      "address": "0x479a0BD32ba791E92d8bF9BF263eF63780182645",
      "permissions": "0x0000000000000000000000000000000000000000000000000000000000040000"
    },
    {
      "address": "0xDD06fC1f047103ea047654c57C6f6F754E91CD24",
      "permissions": "0x00000000000000000000000000000000000000000000000000000000003f3f7f"
    }
  ],
  "lsp3ProfileMetadata": "0x6f357c6ae8b1db2db7ce8a555019ab31c557e9934145c0baa7fdae3f1a131e736d3d4e8e697066733a2f2f516d583543365939614a35646879697533546446704b6258797653434345386a435477514436374743784d705a31"
}
```

- `controllers` - The addresses and permissions to set on the deployed Universal Profile. In order to encode and decode permissions you can use [ERC725 Inspect](https://erc725-inspect.lukso.tech/key-manager)
- `lsp3ProfileMetadata` - optional. LSP3 Metadata to set on the deployed Universal Profile.

#### Response

The transaction hash of the executeRelayCall transaction.

```json
{
  "universalProfileAddress": "0x8303Aa4dAD1825e524868E4224020f04D2446db5",
  "transactionHash": "0x58b473fef1c52da3ff32d77d11da15079ca12d1688db3b431d0a12cb3a600f56"
}
```

#### 🆙 How the deployement of a Universal Profile works.

Deploying a Universal Profile requires to deploy smart contracts that need to intereact with each other. The steps are the following :

1. Deploying a ERC725Account contract
2. Deploying a LSP6 Key Manager and linking it to the previously deployed ERC725Account contract
3. Optional : Setting additional data on the deployed ERC725Account contract like a Universal Receiver Delegate or LSP3 Metadata.

LSP23 standard is used in oder to deploy these contracts interdependently but also linked together.
In fact, these contracts require each other's addresses at the time of deployment and LSP23 manages this by deploying a primary contract (ERC725Account contract) and a secondary contracts (LSP6 Key Manager contract), linking them together.

To use the LSP23 standard, we need to interact with the LSP23LinkedContractsFactory deployed on LUKSO Testnet at address: `0x2300000A84D25dF63081feAa37ba6b62C4c89a30`.

LSP23 allows to deploy contracts and also ERC1167 minimal proxies. In my case I used `deployERC1167Proxies` to deploy a Universal Profile with the following implementation contract addresses :

```
universalProfileInitAddress="0x0000000000e6300463CDbbF7ECF223a63397C489";
keyManagerInitAddress="0x000000000A6cAE9b1bB3d9DA92BFf3569b77707E";
```

In order to set data on the deployed contracts, we need to use the postDeploymentModule deployed on LUKSO Testnet at address: `0x000000000066093407b6704B89793beFfD0D8F00`.

In this relayer implementation, the postDeploymentModule sets the following data on the deployed Universal Profile.

- A Universal Receiver Delegate deployed on LUKSO Testnet at address `0xA20454137b47440C71fE4DD203D25D69F0b34535`
- Optional : LSP3 Profile Metadata passed by the user as parameter of the script.

More detailed information on [LSP-23-LinkedContractsFactory](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-23-LinkedContractsFactory.md#deployerc1167proxies)

## 📝 Scripts

### Execute relay call

Find more information on this script : `scripts/execute-relay-call/execute.ts`

To execute the script : `yarn run execute`

### Deploy a Universal Profile

Find more information on this script : `scripts/deploy-up/deploy-up.ts`

To execute the script : `yarn run deploy-up`

## 👀 Notes

This relayer doesn't implement the `/quota` endpoint standardized in the [LSP15-TransactionRelayServiceAPI](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-15-TransactionRelayServiceAPI.md).

In version `0.12` of `@lukso/lsp-smart-contracts`, userPrivateKey must have permission EXECUTE_RELAY_CALL on the Universal Profile in order to be able to sign an ExecuteRelayCall.

## 🪩 Ideas for hackaton

### Nonce management

Come up with nice nonce management systems so that the relayer can have multiple keys that sign transaction in parallel.

### Batch transaction

In order to reduce the cost of gas fee, send transaction to the blockchain in batch.

### Quota management

Come up with nice ways to manage user's quota.

- How to make user pay for quota
- How and when to refill user's quota
