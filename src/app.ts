import express, { Express, Request, Response } from "express";
import http from "http";
import { AddressInfo } from "net";
import executeController from "./execute-relay-call/execute.controller";
import deployUpController from "./deploy-up/deploy-up.controller";
import transactionController from "./transaction/transaction.controller";

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "3001";

const createApp = () => {
  const app: Express = express();

  // Configure the app to be able to receive different types of payload
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Security : do not display the technology used to power the server
  app.disable("x-powered-by");

  app.get("/health", (_req: Request, res: Response) => {
    res.send("Backend is running.");
  });

  return app;
};

const startServer = () => {
  const app = createApp();

  app.use("/", executeController);
  app.use("/", deployUpController);
  app.use("/", transactionController);

  const server = http.createServer(app).listen({ host, port }, () => {
    const serverInfo = server.address() as AddressInfo;

    console.log(
      `✅ Server successfully started at http://${serverInfo.address}:${serverInfo.port}`
    );
  });

  const signalTraps: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGUSR2"];
  signalTraps.forEach((type) => {
    process.once(type, async () => {
      console.log(`process.once ${type}`);
      server.close(() => {
        console.log("Closing server.");
      });
    });
  });
};

startServer();
