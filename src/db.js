import { MongoClient } from "mongodb";

/**
 * @param {import("pino").Logger} logger
 * @param {string} mongodbUri
 * @returns {import("mongodb").MongoClient}
 */
export function createClient(logger, mongodbUri) {
  const client = new MongoClient(mongodbUri);
  client.on("open", () => {
    logger.info("MongoDB connection opened");
  });
  client.on("error", (error) => {
    logger.error(error);
  });
  client.on("close", () => {
    logger.info("MongoDB connection closed");
  });

  return client;
}
