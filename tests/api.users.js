import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { ObjectId } from "mongodb";
import pino from "pino";

import { createClient } from "../src/db.js";
import { createServer } from "../src/server.js";

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

before(async () => {
  clientDB = createClient(logger, MONGO_URL);
  db = clientDB.db(MONGO_DB_NAME);
  await db.collection("users").deleteMany({});
  server = createServer(db);
});

after(async () => {
  await db.collection("users").deleteMany({});
  await server.close();
  await clientDB.close();
});

describe("GET /users", () => {
  it("should return 200 and empty array", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/users",
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), []);
  });

  it("should return 200 and users", async () => {
    await db.collection("users").insertOne({
      name: "John",
      age: 30,
      email: "john@example.com",
    });
    const response = await server.inject({
      method: "GET",
      url: "/users",
    });
    assert.equal(response.statusCode, 200);

    assert.ok(Array.isArray(response.json()));
    assert.equal(response.json().length, 1);
    assert.equal(response.json()[0].name, "John");
    assert.equal(response.json()[0].age, 30);
    assert.equal(response.json()[0].email, "john@example.com");
  });
});

describe("POST /users", () => {
  it("should return 400 if body is invalid", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/users",
      body: {
        name: "John",
        age: "abc",
        email: "john@example.com",
      },
    });
    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { error: "Invalid body" });
  });

  it("should return 200 and add user to the database", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/users",
      body: {
        name: "John",
        age: 30,
        email: "john@example.com",
      },
    });
    assert.equal(response.statusCode, 200);
    assert.ok(response.json()._id);
    assert.ok(typeof response.json()._id === "string");
    assert.ok(response.json()._id.length > 0);

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(response.json()._id) });

    assert.deepEqual(user, {
      _id: new ObjectId(response.json()._id),
      name: "John",
      age: 30,
      email: "john@example.com",
    });
  });
});
