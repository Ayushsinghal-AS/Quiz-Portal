import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app.js";
import { AnswerModel } from "../src/models/Answer.js";
import { AttemptModel } from "../src/models/Attempt.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { UserModel } from "../src/models/User.js";
import { hashPassword } from "../src/utils/auth.js";
import { QuestionModel } from "../src/models/Question.js";
import { QuizModel } from "../src/models/Quiz.js";
import { cacheService } from "../src/services/cache.js";

let mongoServer: MongoMemoryServer;
const app = createApp();

const adminCredentials = { email: "admin@test.dev", password: "Admin123!" };
const participantCredentials = {
  name: "Player One",
  email: "player@test.dev",
};

const createQuizPayload = {
  title: "Node.js Basics",
  description: "A quick quiz about Node.js runtime, modules, and common backend concepts.",
  durationMinutes: 5,
  status: "draft" as const,
};

const questionPayload = {
  questionText: "Which API is used to create an HTTP server in Node.js?",
  options: [
    { id: "a", text: "http.createServer" },
    { id: "b", text: "fs.createServer" },
    { id: "c", text: "net.buildServer" },
    { id: "d", text: "process.createServer" },
  ],
  correctOptionId: "a",
  points: 10,
  order: 1,
};

const withCsrf = async (agent: request.SuperAgentTest) => {
  const response = await agent.get("/api/auth/csrf-token");
  return response.body.csrfToken as string;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
  await cacheService.connect();

  await UserModel.create({
    name: "Admin Test",
    email: adminCredentials.email,
    passwordHash: await hashPassword(adminCredentials.password),
    role: "admin",
  });
});

afterAll(async () => {
  await disconnectDatabase();
  await cacheService.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = [AnswerModel, AttemptModel, QuizModel, QuestionModel];
  for (const collection of collections) {
    await collection.deleteMany({});
  }
  await UserModel.deleteMany({ role: "participant" });
  await cacheService.clearAll();
});

describe("QuizArena API", () => {
  it("supports register/me/logout for participants", async () => {
    const agent = request.agent(app);
    const csrfToken = await withCsrf(agent);
    const registerResponse = await agent
      .post("/api/auth/register")
      .set("x-csrf-token", csrfToken)
      .send(participantCredentials);
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.role).toBe("participant");
    const sessionCsrf = registerResponse.body.csrfToken;

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(participantCredentials.email);

    const logoutResponse = await agent.post("/api/auth/logout").set("x-csrf-token", sessionCsrf);
    expect(logoutResponse.status).toBe(204);

    const anonymousMeResponse = await agent.get("/api/auth/me");
    expect(anonymousMeResponse.status).toBe(200);
    expect(anonymousMeResponse.body.user).toBeNull();
  });

  it("re-registering with the same email re-enters the same participant account without a password", async () => {
    const firstAgent = request.agent(app);
    const firstCsrf = await withCsrf(firstAgent);
    const firstResponse = await firstAgent
      .post("/api/auth/register")
      .set("x-csrf-token", firstCsrf)
      .send(participantCredentials);
    const firstId = firstResponse.body.user.id;

    const secondAgent = request.agent(app);
    const secondCsrf = await withCsrf(secondAgent);
    const secondResponse = await secondAgent
      .post("/api/auth/register")
      .set("x-csrf-token", secondCsrf)
      .send(participantCredentials);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.user.id).toBe(firstId);
  });

  it("allows admin quiz CRUD and publish flow", async () => {
    const agent = request.agent(app);
    const csrfToken = await withCsrf(agent);
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("x-csrf-token", csrfToken)
      .send(adminCredentials);
    const sessionCsrf = loginResponse.body.csrfToken;

    const createResponse = await agent
      .post("/api/quizzes")
      .set("x-csrf-token", sessionCsrf)
      .send(createQuizPayload);
    expect(createResponse.status).toBe(201);
    const quizId = createResponse.body.id;

    const addQuestionResponse = await agent
      .post(`/api/quizzes/${quizId}/questions`)
      .set("x-csrf-token", sessionCsrf)
      .send(questionPayload);
    expect(addQuestionResponse.status).toBe(201);

    const publishResponse = await agent
      .patch(`/api/quizzes/${quizId}/publish`)
      .set("x-csrf-token", sessionCsrf);
    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.status).toBe("published");

    const listResponse = await agent.get("/api/quizzes");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);

    const updateResponse = await agent
      .put(`/api/quizzes/${quizId}`)
      .set("x-csrf-token", sessionCsrf)
      .send({
        ...createQuizPayload,
        title: "Node.js Basics Updated",
        status: "published",
      });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.title).toBe("Node.js Basics Updated");

    const deleteResponse = await agent
      .delete(`/api/quizzes/${quizId}`)
      .set("x-csrf-token", sessionCsrf);
    expect(deleteResponse.status).toBe(204);
  });

  it("blocks participant from admin endpoints", async () => {
    const agent = request.agent(app);
    const csrfToken = await withCsrf(agent);
    await agent.post("/api/auth/register").set("x-csrf-token", csrfToken).send(participantCredentials);

    const response = await agent.post("/api/quizzes").set("x-csrf-token", csrfToken).send(createQuizPayload);
    expect(response.status).toBe(403);
  });

  it("hides unpublished quizzes from public listings but keeps them visible to their owner", async () => {
    const adminAgent = request.agent(app);
    const adminCsrf = await withCsrf(adminAgent);
    const adminLoginResponse = await adminAgent
      .post("/api/auth/login")
      .set("x-csrf-token", adminCsrf)
      .send(adminCredentials);
    const adminSessionCsrf = adminLoginResponse.body.csrfToken;

    const createResponse = await adminAgent
      .post("/api/quizzes")
      .set("x-csrf-token", adminSessionCsrf)
      .send(createQuizPayload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe("draft");

    const publicListResponse = await request(app).get("/api/quizzes");
    expect(publicListResponse.status).toBe(200);
    expect(publicListResponse.body).toHaveLength(0);

    const publicDetailResponse = await request(app).get(`/api/quizzes/${createResponse.body.id}`);
    expect(publicDetailResponse.status).toBe(404);

    const ownerListResponse = await adminAgent.get("/api/quizzes");
    expect(ownerListResponse.status).toBe(200);
    expect(ownerListResponse.body).toHaveLength(1);
    expect(ownerListResponse.body[0].status).toBe("draft");

    const ownerDetailResponse = await adminAgent.get(`/api/quizzes/${createResponse.body.id}`);
    expect(ownerDetailResponse.status).toBe(200);
    expect(ownerDetailResponse.body.status).toBe("draft");
  });

  it("supports start, answer, manual submit, leaderboard, and analytics", async () => {
    const adminAgent = request.agent(app);
    const adminCsrf = await withCsrf(adminAgent);
    const adminLoginResponse = await adminAgent
      .post("/api/auth/login")
      .set("x-csrf-token", adminCsrf)
      .send(adminCredentials);
    const adminSessionCsrf = adminLoginResponse.body.csrfToken;

    const quizResponse = await adminAgent
      .post("/api/quizzes")
      .set("x-csrf-token", adminSessionCsrf)
      .send({
        ...createQuizPayload,
        status: "published",
      });
    const quizId = quizResponse.body.id;
    await adminAgent
      .post(`/api/quizzes/${quizId}/questions`)
      .set("x-csrf-token", adminSessionCsrf)
      .send(questionPayload);
    await adminAgent
      .post(`/api/quizzes/${quizId}/questions`)
      .set("x-csrf-token", adminSessionCsrf)
      .send({
        ...questionPayload,
        questionText: "Which file usually defines npm scripts?",
        options: [
          { id: "a", text: "package.json" },
          { id: "b", text: "npm.config.js" },
          { id: "c", text: "scripts.json" },
          { id: "d", text: "server.json" },
        ],
        correctOptionId: "a",
        order: 2,
      });

    const participantAgent = request.agent(app);
    const participantCsrf = await withCsrf(participantAgent);
    const participantRegisterResponse = await participantAgent
      .post("/api/auth/register")
      .set("x-csrf-token", participantCsrf)
      .send(participantCredentials);
    const participantSessionCsrf = participantRegisterResponse.body.csrfToken;

    const startResponse = await participantAgent
      .post(`/api/quizzes/${quizId}/start`)
      .set("x-csrf-token", participantSessionCsrf);
    expect(startResponse.status).toBe(201);
    expect(startResponse.body.questions).toHaveLength(2);
    expect(startResponse.body.questions[0].options[0]).toEqual({
      id: "a",
      text: "http.createServer",
    });

    const detailResponse = await request(app).get(`/api/quizzes/${quizId}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.questions[0].options[0]).toEqual({
      id: "a",
      text: "http.createServer",
    });

    const attemptId = startResponse.body.attemptId;
    const sessionResponse = await participantAgent.get(`/api/attempts/${attemptId}/session`);
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.questions[0].options[0]).toEqual({
      id: "a",
      text: "http.createServer",
    });

    await participantAgent
      .post(`/api/attempts/${attemptId}/answer`)
      .set("x-csrf-token", participantSessionCsrf)
      .send({
        questionId: startResponse.body.questions[0].id,
        selectedOptionId: "a",
      });
    await participantAgent
      .post(`/api/attempts/${attemptId}/answer`)
      .set("x-csrf-token", participantSessionCsrf)
      .send({
        questionId: startResponse.body.questions[1].id,
        selectedOptionId: "a",
      });

    const submitResponse = await participantAgent
      .post(`/api/attempts/${attemptId}/submit`)
      .set("x-csrf-token", participantSessionCsrf);
    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.score).toBe(20);

    const resultResponse = await participantAgent.get(`/api/attempts/${attemptId}/result`);
    expect(resultResponse.status).toBe(200);
    expect(resultResponse.body.correctCount).toBe(2);

    const leaderboardResponse = await adminAgent.get(`/api/quizzes/${quizId}/leaderboard`);
    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboardResponse.body[0].rank).toBe(1);
    expect(leaderboardResponse.body[0].participantEmail).toBe(participantCredentials.email);

    const anonymousLeaderboardResponse = await request(app).get(`/api/quizzes/${quizId}/leaderboard`);
    expect(anonymousLeaderboardResponse.status).toBe(401);

    const analyticsResponse = await adminAgent.get(`/api/quizzes/${quizId}/analytics`);
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body.totalParticipants).toBe(1);
    expect(analyticsResponse.body.leaderboard).toHaveLength(1);
    expect(analyticsResponse.body.publishedAt).not.toBeNull();
  });

  it("auto-submits expired attempts", async () => {
    const adminAgent = request.agent(app);
    const adminCsrf = await withCsrf(adminAgent);
    const adminLoginResponse = await adminAgent
      .post("/api/auth/login")
      .set("x-csrf-token", adminCsrf)
      .send(adminCredentials);
    const adminSessionCsrf = adminLoginResponse.body.csrfToken;

    const quizResponse = await adminAgent
      .post("/api/quizzes")
      .set("x-csrf-token", adminSessionCsrf)
      .send({
        ...createQuizPayload,
        durationMinutes: 1,
        status: "published",
      });
    const quizId = quizResponse.body.id;
    await adminAgent
      .post(`/api/quizzes/${quizId}/questions`)
      .set("x-csrf-token", adminSessionCsrf)
      .send(questionPayload);

    const secondParticipant = {
      name: "Player Two",
      email: "player2@test.dev",
    };

    const participantAgent = request.agent(app);
    const participantCsrf = await withCsrf(participantAgent);
    const participantRegisterResponse = await participantAgent
      .post("/api/auth/register")
      .set("x-csrf-token", participantCsrf)
      .send(secondParticipant);
    const participantSessionCsrf = participantRegisterResponse.body.csrfToken;

    const startResponse = await participantAgent
      .post(`/api/quizzes/${quizId}/start`)
      .set("x-csrf-token", participantSessionCsrf);
    const attemptId = startResponse.body.attemptId;

    const attempt = await (await import("../src/models/Attempt.js")).AttemptModel.findById(attemptId).orFail();
    attempt.startedAt = new Date(Date.now() - 61_000);
    await attempt.save();

    const submitResponse = await participantAgent
      .post(`/api/attempts/${attemptId}/submit`)
      .set("x-csrf-token", participantSessionCsrf);
    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.status).toBe("auto_submitted");
  });
});
