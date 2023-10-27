# Relayer Example

[Slides](https://drive.google.com/file/d/1HY87a4yj06YxAg7FyTPnfXq0PxOkng93/view?usp=sharing) of the workshop presentation.

## ⛽️ Description

A Service Relayer allows to send transactions on behalf of users to cover their gas costs.

## 🚀 Installation

To begin sending transaction with the Relayer create a `.env` file to hold configuration parameters:

```sh
cp .env.example .env
```

- `RELAYER_PRIVATE_KEY` : Used by the relayer to send the transaction to the blockchain on behalf of the user. Need to be funded with sufficient LYX balance to execute transactions on the blockchain.
  To fund this key use the [faucet](https://faucet.testnet.lukso.network)

Install dependencies

```sh
yarn
```

Run the project

```sh
yarn dev
```

This command will generate the types of the smart contracts and start the server at default address `http://0.0.0.0:3000`

## 📝 Scripts

### Execute relay call

Parameters to set:

```json
{
  "universalProfileAddress": "0xda09F6F4acC07647C275319A7176A2D96E7cbA5c", //Universal Profile on which you want to execute the transaction.

  "userPrivateKey": "0x04a3042380a01c4600df3cd06a86755f51426493d8a0ba12118f47f64d84471e", //Private key to sign the executeRelayCall transaction. It needs permission on the Universal Profile to execute the given transaction. It doesnt need to have LYX on it.

  "abi": "0x.." // optional. The abi-encoded transaction data (e.g: a function call on the Universal Default value: SET_DATA abi-encoded transaction.
}
```

Execute the script :

```sh
yarn run execute
```

Find more information on this script : `scripts/execute-relay-call/execute.ts`

### Deploy a Universal Profile

Parameters to set :

```json
{
  "controllers": [
    {
      "address": "0x479a0BD32ba791E92d8bF9BF263eF63780182645",
      "permissions": "0x0000000000000000000000000000000000000000000000000000000000040000"
    }
  ], // A list of controller addresses with permissions to be set on the deployed Universal Profile.

  "lsp3ProfileMetadata": "0x.." //optional. LSP3 Metadata to set on the deployed Universal Profile.
}
```

Encode and decode permissions: [ERC725-Inspect](https://erc725-inspect.lukso.tech/key-manager)

Execute the script:

```sh
yarn run deploy-up
```

Find more information on this script : `scripts/deploy-up/deploy-up.ts`

## 🛞 Endpoints

### POST `/execute`

Executes a transaction on behalf of a user using `executeRelayCall` function of the Key Manager owning the user's Universal Profile.

#### Request body

```json
{
  "address": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD",
  "transaction": {
    "abi": "0x7f23690c5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000596f357c6aa5a21984a83b7eef4cb0720ac1fcf5a45e9d84c653d97b71bbe89b7a728c386a697066733a2f2f516d624b43744b4d7573376741524470617744687a32506a4e36616f64346b69794e436851726d3451437858454b00000000000000",
    "signature": "0x43c958b1729586749169599d7e776f18afc6223c7da21107161477d291d497973b4fc50a724b1b2ab98f3f8cf1d5cdbbbdf3512e4fbfbdc39732229a15beb14a1b",
    "nonce": 1,
    "validityTimestamps": "0x0000000000000000000000006420f3f000000000000000000000000065ec82d0"
  }
}
```

- `address` - The address of the Universal Profile.
- `transaction` - An object containing the transaction parameters which will be executed with `executeRelayCall`.
  - `abi` - The abi-encoded transaction data (_e.g: a function call on the Universal Profile smart contract_) which will be passed as the payload parameter to the `executeRelayCall` function.
  - `signature` - The signed message. See section below for how to construct the signature.
  - `nonce` - The nonce of the user key signing the transaction. Fetched by calling `getNonce(address address, uint128 channelId)` on the LSP6 KeyManager contract of the Universal Profile.
  - `validityTimestamps` (optional) - Two concatenated `uint128` timestamps which indicate a time duration for which the transaction will be considered valid. If no validityTimestamps parameter is passed the relayer should assume that validityTimestamps is `0` and the transaction will be valid indefinitely until it is executed.

#### Response

The transaction hash of the executeRelayCall transaction.

```json
{
  "transactionHash": "0xBB645D97B0c7D101ca0d73131e521fe89B463BFD"
}
```

#### 🖋️ Specification to construct the executeRelayCall signature

##### Construct the message

```typescript
const message = ethers.utils.solidityPack(
  ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes"],
  [
    25, //LSP25 Version
    "4201", //Chain Id
    { _hex: "0x0c", _isBigNumber: true }, //Nonce of the user signing key
    0, //Validity Timestamps
    0, //Amount of native tokens to transfer (in Wei)
    0x7f23690ccafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000004cafecafe00000000000000000000000000000000000000000000000000000000, //Abi payload
  ]
);
```

##### Sign the message

_Important_ : The message must be signed by a key belonging to the user that has permissions on the Universal Profile in order to execute the abi payload. This key doesn't need LYX.

[EIP191 signer](https://www.npmjs.com/package/@lukso/eip191-signer.js) library is used to generate the signature using the function `signDataWithIntendedValidator`.

```typescript
const eip191Signer = new EIP191Signer();

const { signature } = eip191Signer.signDataWithIntendedValidator(
  keyManagerAddress, // Key Manager of the Universal Profile
  message, // Constructed message as shown in the section above
  privateKey // User key with permissions on the Universal Profile
);
```

#### 🌉 Transaction Gate

This implementation of the relayer can only process one transaction at a time. To prevent nonce reuse errors, a transaction gate is implemented which will block incoming transactions if there is already a transaction pending.

### POST `/universal-profile`

Deploy a Universal Profile with given controller addresses and LSP3 Metadata. Universal Profiles will by default be deployed with a Universal Receiver Delegate.

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

```json
{
  "universalProfileAddress": "0x8303Aa4dAD1825e524868E4224020f04D2446db5",
  "transactionHash": "0x58b473fef1c52da3ff32d77d11da15079ca12d1688db3b431d0a12cb3a600f56"
}
```

#### 🆙 How the deployement of a Universal Profile works.

Deploying a Universal Profile requires to deploy smart contracts that need to interact with each others. The steps are the following :

1. 👤 Deploying a ERC725Account contract
2. 🔑 Deploying a LSP6 Key Manager and linking it to the previously deployed ERC725Account contract
3. 🎨 Optional : Setting additional data on the deployed ERC725Account contract like a Universal Receiver Delegate or LSP3 Metadata.

LSP23 standard is used in oder to deploy these contracts interdependently but also linked together as some contracts require other contracts addresses at the time of their deployment. LSP23 manages this by deploying a primary contract (in our case an ERC725Account contract) and a secondary contracts (in our case a LSP6 Key Manager contract), linking them together.

To use the LSP23 standard, one can interact with the LSP23LinkedContractsFactory deployed on LUKSO Testnet at address: `0x2300000A84D25dF63081feAa37ba6b62C4c89a30`.

In this repository, I used LSP23 to deploy ERC1167 minimal proxies with the following base contract addresses:

```typescript
universalProfileInitAddress = "0x0000000000e6300463CDbbF7ECF223a63397C489";
keyManagerInitAddress = "0x000000000A6cAE9b1bB3d9DA92BFf3569b77707E";
postDeploymentModuleAddress = "0x000000000066093407b6704B89793beFfD0D8F00";
```

In this relayer implementation, the Post Deployment Module sets the following data on the deployed Universal Profile:

- A Universal Receiver Delegate deployed on LUKSO Testnet at address `0xA20454137b47440C71fE4DD203D25D69F0b34535`
- Optional : LSP3 Profile Metadata if passed by the user as parameter.

More detailed information on [LSP23-LinkedContractsFactory](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-23-LinkedContractsFactory.md#deployerc1167proxies)

## 👀 Notes

This relayer doesn't implement the `/quota` endpoint standardized in the [LSP15-TransactionRelayServiceAPI](https://github.com/lukso-network/LIPs/blob/main/LSPs/LSP-15-TransactionRelayServiceAPI.md). You can find an example of this endpoint in this [repository](https://github.com/CallumGrindle/dummy-transaction-relayer) made by Callum Grindle which shows another example of a relayer service.

In version `0.12` of `@lukso/lsp-smart-contracts` library, `userPrivateKey` will need to have permission `EXECUTE_RELAY_CALL` on the Universal Profile.

## 🪩 Ideas for hackaton

### Nonce management

Nonce management systems to allow the relayer to process concurrent transaction. Multiple keys can sign transactions in parallel.

### Batch transaction

Send transaction to the blockchain in batch using `executeRelayCallBatch` function.

Advantages:

- Reduce cost of gas fee

Disadvantages:

- If one transaction fails from the batch then the whole batch fails.
- Users can receive the transaction hash of their transaction.

### Quota management

Manage user's quota.

- How users retribute the relayer.
- How / when quota is refilled.
