import fs from "fs";
import path from "path";
import request from "supertest";
import { Connection } from "typeorm";
import createConnection from "../../src/database";
import { app } from "../../src/http";

describe("Users Tests", () => {
  let connection: Connection;

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
      .send({
        name: "User Test",
        email: "user@example.com",
        password: "Test123",
        avatar: fs
          .readFileSync(
            path.join(
              __dirname,
              "..",
              "..",
              "uploads",
              "files",
              "avatar.test.jpeg"
            )
          )
          .toString("base64"),
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
  });
});
