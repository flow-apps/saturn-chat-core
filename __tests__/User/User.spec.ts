import fs from "fs";
import path from "path";
import request from "supertest";
import { Connection } from "typeorm";
import createConnection from "../../src/database";
import { app } from "../../src/http";

describe("Users Tests", () => {
  let connection: Connection;
  let userID: string;

  beforeAll(async () => {
    connection = await createConnection();
    await connection.synchronize();
    await connection.runMigrations();
  });

  afterAll(async () => {
    await connection.dropDatabase();
  });

  it("Should be able to create a user", async () => {
    const response = await request(app)
      .post("/api/users")
      .field("name", "User Test")
      .field("email", "user@example.com")
      .field("password", "Test123")
      .attach(
        "avatar",
        path.join(__dirname, "..", "..", "uploads", "files", "avatar.test.jpeg")
      );

    userID = response.body.id;

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("avatar.id");
  });

  it("Should be able get the created user", async () => {
    const response = await request(app).get(`/api/users/${userID}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toEqual(userID);
  });
});
