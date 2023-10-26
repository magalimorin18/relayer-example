import express, { Request, Response } from "express";
import { DeployUpRequest, ExecutePayload } from "../interface";
import httpStatus from "http-status";
import { deployUpWithKm } from "./deploy-up.service";

const deployUpController = express.Router();

const deployUp = async (req: Request, res: Response) => {
  const { controllers, lsp3ProfileMetadata } = req.body as DeployUpRequest;

  try {
    const response = await deployUpWithKm(controllers, lsp3ProfileMetadata);
    res.send({
      universalProfileAddress: response?.universalProfileAddress,
      transactionHash: response?.transactionHash,
      keyManagerAddress: response?.keyManagerAddress,
    });
  } catch (error: any) {
    console.log("❌ An error occured when executing transaction.", error);

    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

deployUpController.post("/universal-profile", deployUp);

export default deployUpController;
