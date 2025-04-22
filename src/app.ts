import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import os from "os";
import globalErrorHandler from "./app/middleware/globalErrorHandler";
import notFound from "./app/middleware/notFound";
import router from "./app/routes";
// import seedAdmin from './app/DB/seed';

const app: Application = express();
app.use(express.json());
// Middleware setup
app.use(cors({ origin: ["https://ecom-nexa-web.vercel.app","https://nexa-server.vercel.app/api/v1/ssl/ipn"], credentials: true }));
app.use(cookieParser());


app.use("/api/v1", router);

// seedAdmin();

// Test route
app.get("/", (req: Request, res: Response, next: NextFunction) => {
  const currentDateTime = new Date().toISOString();
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const serverHostname = os.hostname();
  const serverPlatform = os.platform();
  const serverUptime = os.uptime();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Welcome to the Nexa Api  🎉",
    version: "1.0.0",
    clientDetails: {
      ipAddress: clientIp,
      accessedAt: currentDateTime,
    },
    serverDetails: {
      hostname: serverHostname,
      platform: serverPlatform,
      uptime: `${Math.floor(serverUptime / 60 / 60)} hours ${Math.floor(
        (serverUptime / 60) % 60
      )} minutes`,
    },
    developerContact: {
      email: "mrshakilhossain@outlook.com",
      website: "https://shakil-tawny.vercel.app",
    },
  });
});

app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;
