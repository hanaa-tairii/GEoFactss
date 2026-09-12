import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { optionalAuth } from "./middleware/auth";
import { apiLimiter, loginLimiter, registerLimiter, verifyRequestOrigin } from "./middleware/security";
import { errorHandler } from "./middleware/errors";
import countries from "./routes/countries";
import auth from "./routes/auth";
import community from "./routes/community";

export const app = express();
app.set("query parser", "simple");
app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", config.clientOrigin],
    },
  },
}));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use(apiLimiter);
app.use(verifyRequestOrigin);
app.use(optionalAuth);
app.get("/api/health", (_request, response) => response.json({ status: "ok", service: "geofacts-api" }));
app.use("/api/countries", countries);
app.use("/api/countries", community);
app.use("/api/auth/register", registerLimiter);
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", auth);
app.use(errorHandler);
