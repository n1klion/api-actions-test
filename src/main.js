import config from "./config";
import logger from "./logger";
import { createClient } from "./db";
import { createServer } from "./server";

async function main() {
  logger.debug(`config: ${JSON.stringify(config, null, 2)}`);

  const client = createClient(logger, config.mongoURI);
  await client.connect();
  const db = client.db(config.mongoDBName);

  const server = createServer(db);

  server.listen(
    {
      port: config.port
    },
    () => {
      logger.info(`Server listening on port ${config.port}`);
    }
  );

  process.on("SIGINT", async () => {
    logger.info("Received SIGINT, shutting down");

    await server.close();
    await client.close();

    process.exit(0);
  });
}

main();
