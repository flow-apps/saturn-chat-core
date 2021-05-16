import path from "path";
import request from "supertest";
import { Connection } from "typeorm";
import createConnection from "../../src/database";
import { http } from "../../src/http";

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

  it("Should be not able create user without required data", async () => {
    const response = await request(http).post("/users");

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("Should be able to create a user", async () => {
    const response = await request(http)
      .post("/users")
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

  it("Should be not able create user with duplicate email", async () => {
    const response = await request(http)
      .post("/users")
      .field("name", "User Test")
      .field("email", "user@example.com")
      .field("password", "Test123")
      .attach(
        "avatar",
        path.join(__dirname, "..", "..", "uploads", "files", "avatar.test.jpeg")
      );

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("Should be able get the created user", async () => {
    const response = await request(http).get(`/users/${userID}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.id).toEqual(userID);
  });

  it("Should be able delete the created user", async () => {
    const response = await request(http).delete(`/users/${userID}`);

    expect(response.statusCode).toBe(204);
    expect(response.ok).toBe(true);
  });
});
