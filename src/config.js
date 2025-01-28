import { z } from "zod";

const configSchema = z.object({
  port: z.number().int().positive().min(3000).max(65535),
  logLevel: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
  mongoURI: z.string(),
  mongoDBName: z.string()
});

const parsedConfig = configSchema.parse({
  port: Number.parseInt(process.env.PORT ?? "3000"),
  logLevel: process.env.LOG_LEVEL ?? "info",
  mongoURI: process.env.MONGODB_URI,
  mongoDBName: process.env.MONGODB_NAME
});

export default parsedConfig;
