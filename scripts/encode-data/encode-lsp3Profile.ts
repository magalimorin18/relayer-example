import { readFileSync } from "fs";
import ERC725 from "@erc725/erc725.js";
import LSP3Schema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { ethers } from "ethers";

const erc725 = new ERC725(LSP3Schema);

const main = () => {
  const profileImg = readFileSync(
    "scripts/encode-data/assets/profileImg.png"
  ).toString("hex");
  const profileImgUrl =
    "ipfs://QmREb7vNeWN2mNueByCLSDkkp9ovNE9ytnyHiXmEwSqjzg/";
  const backgroundImg = readFileSync(
    "scripts/encode-data/assets/backgroundImg.png"
  ).toString("hex");
  const backgroundImgUrl =
    "ipfs://bafybeid2tcmtlzmpmrlg4h4eomajvt2vpzpq7bo76ymwcyw5f5oedhyvc4/";

  const json = {
    LSP3Profile: {
      name: "Sam Kerr",
      description:
        "Some nice things about Sam and her goals. Best attacker in the world",
      links: [
        {
          title: "Twitter",
          url: "htps://twitter.com/",
        },
      ],
      tags: ["foot", "samKerr"],

      profileImage: [
        {
          width: 1024,
          height: 1024,
          url: profileImgUrl,
          verification: {
            method: "keccak256(bytes)",
            data: ethers.utils.keccak256(`0x${profileImg}`),
          },
        },
      ],
      backgroundImage: [
        {
          width: 1500,
          height: 500,
          url: backgroundImgUrl,
          verification: {
            method: "keccak256(bytes)",
            data: ethers.utils.keccak256(`0x${backgroundImg}`),
          },
        },
      ],
    },
  };

  //Upload the JSONURL on IPFS and update the link
  const jsonUrl = "ipfs://<cid>";

  const { keys, values } = erc725.encodeData([
    {
      keyName: "LSP3Profile",
      value: {
        url: jsonUrl,
        json,
      },
    },
  ]);

  console.log(`keys: ${keys}`);
  console.log(`values: ${values}`);
};

main();
