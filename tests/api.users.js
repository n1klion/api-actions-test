import { expect, describe, test, beforeAll } from "vitest";
import { ObjectId } from "mongodb";
import pino from "pino";

import { createClient } from "../src/db";
import { createServer } from "../src/server";

const MONGO_URL = "mongodb://localhost:27017";
const MONGO_DB_NAME = "Test";

// @ts-ignore
const logger = pino({ level: "silent" });
/**
 * @type {import("fastify").FastifyInstance}
 */
let server;
/**
 * @type {import("mongodb").MongoClient}
 */
let clientDB;
/**
 * @type {import("mongodb").Db}
 */
let db;

beforeAll(async () => {
  clientDB = createClient(logger, MONGO_URL);
  db = clientDB.db(MONGO_DB_NAME);
  await db.collection("users").deleteMany({});
  server = createServer(db);

  return async () => {
    await db.collection("users").deleteMany({});
    await server.close();
    await clientDB.close();
  };
});

describe("GET /users", () => {
  test("should return 200 and empty array", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/users",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });
  test("should return 200 and users", async () => {
    await db.collection("users").insertOne({
      name: "John",
      age: 30,
      email: "john@example.com",
    });
    const response = await server.inject({
      method: "GET",
      url: "/users",
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        _id: expect.any(String),
        name: "John",
        age: 30,
        email: "john@example.com",
      },
    ]);
  });
});

describe("POST /users", () => {
  test("should return 400 if body is invalid", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/users",
      body: {
        name: "John",
        age: "abc",
        email: "john@example.com",
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid body" });
  });
  test("should return 200 and add user to the database", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/users",
      body: {
        name: "John",
        age: 30,
        email: "john@example.com",
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      _id: expect.any(String),
    });

    const user = await db.collection("users").findOne({ _id: new ObjectId(response.json()._id) });
    expect(user).toEqual({
      _id: new ObjectId(response.json()._id),
      name: "John",
      age: 30,
      email: "john@example.com",
    });
  });
});
