import { Connection, createConnection } from "typeorm";
import request from "supertest";
import { http } from "../../src/http";
import path from "path";
import { User } from "../../src/entities/User";
import { Group } from "../../src/entities/Group";

describe("Groups Test", () => {
  jest.setTimeout(30000);
  let connection: Connection;
  let user: User;
  let group: Group;
  const avatar = path.join(
    __dirname,
    "..",
    "..",
    "uploads",
    "files",
    "avatar.test.jpeg"
  );

  beforeAll(async () => {
    connection = await createConnection();
    await connection.synchronize();
    await connection.runMigrations();
    user = (
      await request(http)
        .post("/users")
        .field("name", "User Test")
        .field("email", "user@example.com")
        .field("password", "Test123")
        .attach("avatar", avatar)
    ).body as User;
  });

  afterAll(async () => {
    await connection.dropDatabase();
  });

  it("Should be not able create a group without required data", async () => {
    const response = await request(http).post("/groups").send();

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("Should be able create a group", async () => {
    const response = await request(http)
      .post("/groups")
      .field("name", "Example Group")
      .field("description", "A very cool description")
      .field("privacy", "PUBLIC")
      .field("owner_id", user.id)
      .attach("group_avatar", avatar);

    group = response.body;
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.owner_id).toBe(user.id);
    expect(response.body).toHaveProperty("group_avatar.url");
  });

  it("Should be able to get created group", async () => {
    const response = await request(http).get(`/groups/${group.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.id).toBe(group.id);
    expect(response.body.owner.id).toBe(user.id);
    expect(response.body).toHaveProperty("group_avatar.id");
  });

  it("Should be able delete the group", async () => {
    const response = await request(http).delete(`/groups/${group.id}`);

    expect(response.statusCode).toBe(204);
    expect(response.ok).toBe(true);
    expect(response.body).toEqual({});
  });
});
