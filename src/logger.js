import config from "./config";
import pino from "pino";

/**
 * @type {import("pino").Logger}
 */
const logger = pino({
  level: config.logLevel,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
});

export default logger;
