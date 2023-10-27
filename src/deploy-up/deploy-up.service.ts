import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";
import { BigNumber, Wallet } from "ethers";
import {
  BytesLike,
  defaultAbiCoder,
  hexZeroPad,
  randomBytes,
} from "ethers/lib/utils";

// types
import {
  LSP23LinkedContractsFactory__factory,
  LSP6KeyManagerInit__factory,
  UniversalProfileInit__factory,
} from "../../types/ethers-v5";
import { RELAYER_PRIVATE_KEY } from "../globals";
import { getProvider } from "../libs/ethers.service";
import { Controllers } from "../interface";

/// ------ DO NOT CHNAGE ------
const lsp23Address = "0x2300000A84D25dF63081feAa37ba6b62C4c89a30";
const upPostDeploymentModuleAddress =
  "0x000000000066093407b6704B89793beFfD0D8F00";

const universalProfileInitAddress =
  "0x0000000000e6300463CDbbF7ECF223a63397C489";
const keyManagerInitAddress = "0x000000000A6cAE9b1bB3d9DA92BFf3569b77707E";
const universalReceiverDelegateAddress =
  "0xA20454137b47440C71fE4DD203D25D69F0b34535";
/// ---------------------------

export const deployUpWithKm = async (
  controllers: Controllers[],
  lsp3ProfileMetadata?: string
) => {
  /// ------ Contract Instance for the `LSP23LinkedContractsFactory` ------
  const LSP23LinkedContractsFactory =
    new LSP23LinkedContractsFactory__factory().attach(lsp23Address);
  /// ---------------------------------------------------------------------

  /// ------ Contract Instance for the `UniversalProfileInit` ------
  const universalProfileInit = new UniversalProfileInit__factory().attach(
    universalProfileInitAddress
  );
  /// ---------------------------------------------------------------------

  /// ------ Contract Instance for the `LSP6KeyManagerInit` ------
  const keyManagerInit = new LSP6KeyManagerInit__factory().attach(
    keyManagerInitAddress
  );
  /// ---------------------------------------------------------------------

  /// ------ Generate Random Salt for Universal Profile deployment (we can also use custom salt) ------
  const salt = randomBytes(32);
  /// -------------------------------------------------------------------------------------------------

  /// ------ Data for Universal Profile deployment ------
  const primaryContractDeploymentInit = {
    salt,
    fundingAmount: 0,
    implementationContract: universalProfileInit.address,
    initializationCalldata: universalProfileInit.interface.encodeFunctionData(
      "initialize",
      [upPostDeploymentModuleAddress]
    ),
  };
  /// ---------------------------------------------------

  /// ------ Data for Key Manager deployment ------
  const secondaryContractDeploymentInit = {
    fundingAmount: 0,
    implementationContract: keyManagerInit.address,
    addPrimaryContractAddress: true,
    initializationCalldata:
      universalProfileInit.interface.getSighash("initialize"),
    extraInitializationParams: "0x",
  };
  /// ---------------------------------------------------

  /// ------ Encode Data Keys & Values for updating permissions & LSP3Metadata ------

  const controllerKeys = controllers.flatMap((controller, index) => [
    ERC725YDataKeys.LSP6["AddressPermissions[]"].index +
      hexZeroPad(BigNumber.from(index).toHexString(), 16).slice(2), //Key of the controller address index

    ERC725YDataKeys.LSP6["AddressPermissions:Permissions"] +
      controller.address.slice(2), // Key of the controller address permission
  ]);

  const controllerValues = controllers.flatMap((controller) => [
    controller.address,
    controller.permissions,
  ]);

  const data = [
    {
      key: ERC725YDataKeys.LSP1.LSP1UniversalReceiverDelegate,
      value: universalReceiverDelegateAddress,
    },
  ];

  if (lsp3ProfileMetadata) {
    data.push({
      key: ERC725YDataKeys.LSP3.LSP3Profile,
      value: lsp3ProfileMetadata,
    });
  }

  const dataKeys = data ? data.map(({ key }) => key) : [];
  const dataValues = data ? data.map(({ value }) => value) : [];

  const encodedSetData = defaultAbiCoder.encode(
    ["bytes32[]", "bytes[]"],
    [
      [
        ERC725YDataKeys.LSP6["AddressPermissions[]"].length,
        ...controllerKeys,
        ...dataKeys,
      ],
      [
        hexZeroPad(BigNumber.from(controllers.length).toHexString(), 16),
        ...controllerValues,
        ...dataValues,
      ],
    ]
  );
  /// -------------------------------------------------------------------------------

  const provider = getProvider();
  const signer = new Wallet(RELAYER_PRIVATE_KEY, provider);

  /// ------ Pre-calculate the addresses for the Universal Profile & Key Manager ------
  const [universalProfileAddress, keyManagerAddress] =
    await LSP23LinkedContractsFactory.connect(
      signer
    ).callStatic.deployERC1167Proxies(
      primaryContractDeploymentInit,
      secondaryContractDeploymentInit,
      upPostDeploymentModuleAddress,
      encodedSetData
    );

  console.log(
    `🆙 Deploying Universal Profile at address ${universalProfileAddress} with 🔑Key Manager ${keyManagerAddress}...`
  );
  /// ---------------------------------------------------------------------------------

  /// ------ Deploy the Universal Profile & Key Manager ------
  const deploymentTransaction = await LSP23LinkedContractsFactory.connect(
    signer
  ).deployERC1167Proxies(
    primaryContractDeploymentInit,
    secondaryContractDeploymentInit,
    upPostDeploymentModuleAddress,
    encodedSetData
  );
  /// --------------------------------------------------------

  console.log(
    `🎉 Transaction sent https://explorer.execution.testnet.lukso.network/tx/${deploymentTransaction.hash}`
  );

  await deploymentTransaction.wait(1);

  return {
    universalProfileAddress,
    keyManagerAddress,
    transactionHash: deploymentTransaction.hash,
  };
};
