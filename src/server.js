import fastify from "fastify";
import { ObjectId } from "mongodb";
import { z } from "zod";

const userQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => Number.isInteger(val) && val > 0 && val <= 100, {
      message: "Limit must be an integer between 1 and 100.",
    }),
  skip: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => Number.isInteger(val) && val >= 0, {
      message: "Skip must be a non-negative integer.",
    }),
});

const userOneQuerySchema = z.object({
  id: z.string(),
});

const userBodySchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().positive().min(1).max(100),
  email: z.string().email(),
});

/**
 * @param {import("mongodb").Db} db
 * @returns {import("fastify").FastifyInstance}
 */
export function createServer(db) {
  const server = fastify();

  server.route({
    method: "GET",
    url: "/users",
    handler: async (request, reply) => {
      const query = userQuerySchema.safeParse(request.query);
      if (!query.success) {
        reply.status(400).send({ error: "Invalid query" });
        return;
      }
      const users = await db
        .collection("users")
        .find({})
        .skip(query.data.skip)
        .limit(query.data.limit)
        .toArray();

      reply.send(users);
    },
  });

  server.route({
    method: "GET",
    url: "/users/:id",
    handler: async (request, reply) => {
      const params = userOneQuerySchema.safeParse(request.params);
      if (!params.success) {
        reply.status(400).send({ error: "Invalid params" });
        return;
      }
      const { id } = params.data;
      const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
      if (!user) {
        reply.status(404).send({ error: "User not found" });
        return;
      }

      reply.send(user);
    },
  });

  server.route({
    method: "POST",
    url: "/users",
    handler: async (request, reply) => {
      const body = userBodySchema.safeParse(request.body);
      if (!body.success) {
        reply.status(400).send({ error: "Invalid body" });
        return;
      }
      const user = {
        name: body.data.name,
        age: body.data.age,
        email: body.data.email,
      };
      const insertResult = await db.collection("users").insertOne(user);

      reply.send({
        _id: insertResult.insertedId,
      });
    },
  });

  return server;
}
