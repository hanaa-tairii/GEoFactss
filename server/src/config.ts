import "dotenv/config";

const nodeEnv = process.env.NODE_ENV;
if (nodeEnv !== "development" && nodeEnv !== "production") throw new Error("NODE_ENV must be explicitly set to development or production.");
const isProduction = nodeEnv === "production";
const secret = process.env.JWT_SECRET || (isProduction ? "" : "local-development-secret-change-me");
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
let parsedClientUrl: URL;
try {
  parsedClientUrl = new URL(clientUrl);
} catch {
  throw new Error("CLIENT_URL must be an absolute URL.");
}
if (!secret || secret.length < 32 || (isProduction && !process.env.JWT_SECRET)) throw new Error("JWT_SECRET must contain at least 32 characters in all environments, and must be explicitly provided in production.");
if (isProduction && parsedClientUrl.protocol !== "https:") throw new Error("CLIENT_URL must use HTTPS in production.");
const port = Number(process.env.API_PORT || 4000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("API_PORT must be a valid TCP port.");

const trustProxy = process.env.TRUST_PROXY?.trim() || "";
const trustProxySetting: boolean | string[] = trustProxy
  ? trustProxy.split(",").map((value) => value.trim()).filter(Boolean)
  : false;
export const config = {
  port,
  clientUrl,
  clientOrigin: parsedClientUrl.origin,
  jwtSecret: secret,
  isProduction,
  trustProxy: trustProxySetting,
  cookieName: "geofacts_token",
};
