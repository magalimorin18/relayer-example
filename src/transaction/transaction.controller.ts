import express, { Request, Response } from "express";
import { ExecuteRequest } from "../interface";
import httpStatus from "http-status";
import { generateExecuteRelayCallTransaction } from "./transaction.service";

const transactionController = express.Router();

const generateTransaction = async (req: Request, res: Response) => {
  const { universalProfileAddress, userPrivateKey, abi } =
    req.body as ExecuteRequest;

  console.log(universalProfileAddress, userPrivateKey);

  try {
    const executeRelayCallTransaction =
      await generateExecuteRelayCallTransaction(
        universalProfileAddress,
        userPrivateKey,
        abi
      );
    res.send(executeRelayCallTransaction);
  } catch (error: any) {
    console.log(
      "❌ An error occured when generating execute relay call transaction.",
      error?.message
    );

    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

transactionController.post("/transaction", generateTransaction);

export default transactionController;
