import supertest from "supertest";

import { app } from "../src/server.js";

const request = supertest(app);

describe("GET /", () => {
  afterAll(async (done) => {
    done();
  });
  it("should return 200 OK", async () => {
    const response = await request.get("/");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("appName");
    expect(response.body).toHaveProperty("appVersion");
    expect(response.body).toHaveProperty("nodeVersion");
  });
});
