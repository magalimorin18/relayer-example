import express, { Request, Response } from "express";
import { ExecutePayload } from "../interface";
import httpStatus from "http-status";
import { executeTransaction } from "./execute.service";
import { executeMiddelware } from "./execute.middelware";

const executeController = express.Router();

const execute = async (req: Request, res: Response) => {
  const { address, transaction } = req.body as ExecutePayload;

  try {
    await executeMiddelware(address, transaction);
  } catch (error: any) {
    res.status(httpStatus.UNAUTHORIZED).send(error?.message);
  }

  try {
    const transactionHash = await executeTransaction(address, transaction);
    res.send({ transactionHash });
  } catch (error: any) {
    console.log(
      "❌ An error occured when executing transaction.",
      error?.message
    );
    if (error?.message.includes("Transaction in progress")) {
      res
        .status(httpStatus.TOO_MANY_REQUESTS)
        .send({ message: error?.message });
      return;
    }

    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

executeController.post("/execute", execute);

export default executeController;
