import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { env } from "../config/env.js";
import { hashPassword } from "../utils/auth.js";
import { QuestionModel } from "../models/Question.js";
import { QuizModel } from "../models/Quiz.js";
import { UserModel } from "../models/User.js";

const quizTemplates = [
  {
    title: "JavaScript Arena Warmup",
    description:
      "A quick warmup quiz covering core JavaScript fundamentals, runtime behavior, and common syntax questions.",
    durationMinutes: 10,
    status: "published" as const,
    questions: [
      {
        questionText: "What is the result of typeof null?",
        options: [
          { id: "a", text: "null" },
          { id: "b", text: "object" },
          { id: "c", text: "undefined" },
          { id: "d", text: "number" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 1,
      },
      {
        questionText: "Which array method returns a new array without mutating the original one?",
        options: [
          { id: "a", text: "splice" },
          { id: "b", text: "push" },
          { id: "c", text: "map" },
          { id: "d", text: "sort" },
        ],
        correctOptionId: "c",
        points: 10,
        order: 2,
      },
      {
        questionText: "Which keyword creates a block-scoped variable?",
        options: [
          { id: "a", text: "var" },
          { id: "b", text: "let" },
          { id: "c", text: "function" },
          { id: "d", text: "constantly" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 3,
      },
    ],
  },
  {
    title: "React Fundamentals Sprint",
    description:
      "Template quiz for React basics including rendering, hooks, and state-driven UI updates.",
    durationMinutes: 12,
    status: "published" as const,
    questions: [
      {
        questionText: "Which hook is used to store local component state?",
        options: [
          { id: "a", text: "useMemo" },
          { id: "b", text: "useState" },
          { id: "c", text: "useEffect" },
          { id: "d", text: "useContext" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 1,
      },
      {
        questionText: "What is the correct term for passing data from parent to child in React?",
        options: [
          { id: "a", text: "Events" },
          { id: "b", text: "Hooks" },
          { id: "c", text: "Props" },
          { id: "d", text: "Reducers" },
        ],
        correctOptionId: "c",
        points: 10,
        order: 2,
      },
      {
        questionText: "Why does React require a unique key when rendering a list?",
        options: [
          { id: "a", text: "To style each item differently" },
          { id: "b", text: "To help React track item identity between renders" },
          { id: "c", text: "To keep arrays sorted automatically" },
          { id: "d", text: "To enable server-side rendering" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 3,
      },
    ],
  },
  {
    title: "Node.js Backend Basics",
    description:
      "Starter quiz for backend interviews covering Express, async behavior, and API responses.",
    durationMinutes: 15,
    status: "published" as const,
    questions: [
      {
        questionText: "Which package is commonly used to build HTTP APIs in a Node.js project?",
        options: [
          { id: "a", text: "Express" },
          { id: "b", text: "Tailwind CSS" },
          { id: "c", text: "Vite" },
          { id: "d", text: "Prettier" },
        ],
        correctOptionId: "a",
        points: 10,
        order: 1,
      },
      {
        questionText: "What does async/await help simplify in JavaScript?",
        options: [
          { id: "a", text: "CSS animations" },
          { id: "b", text: "Database schemas" },
          { id: "c", text: "Asynchronous promise-based flows" },
          { id: "d", text: "Type inference" },
        ],
        correctOptionId: "c",
        points: 10,
        order: 2,
      },
      {
        questionText: "Which HTTP status code usually indicates a resource was created successfully?",
        options: [
          { id: "a", text: "200" },
          { id: "b", text: "201" },
          { id: "c", text: "204" },
          { id: "d", text: "404" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 3,
      },
    ],
  },
  {
    title: "HTML & CSS Essentials",
    description:
      "Draft template for frontend styling practice with semantic HTML, layout, and responsive design.",
    durationMinutes: 8,
    status: "draft" as const,
    questions: [
      {
        questionText: "Which HTML element is most appropriate for a site-wide navigation block?",
        options: [
          { id: "a", text: "<nav>" },
          { id: "b", text: "<aside>" },
          { id: "c", text: "<footer>" },
          { id: "d", text: "<span>" },
        ],
        correctOptionId: "a",
        points: 10,
        order: 1,
      },
      {
        questionText: "Which CSS layout method is best suited for one-dimensional alignment?",
        options: [
          { id: "a", text: "float" },
          { id: "b", text: "position: absolute" },
          { id: "c", text: "flexbox" },
          { id: "d", text: "table" },
        ],
        correctOptionId: "c",
        points: 10,
        order: 2,
      },
      {
        questionText: "What does a media query help you do?",
        options: [
          { id: "a", text: "Store browser cookies" },
          { id: "b", text: "Apply styles based on viewport or device characteristics" },
          { id: "c", text: "Compress image files" },
          { id: "d", text: "Validate HTML forms" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 3,
      },
    ],
  },
  {
    title: "AloT-POWERED ELDERLY MONITORING",
    description:
      "Test your understanding of loT-driven elderly monitoring systems, from connected devices and real-time data to intelligent health monitoring.",
    durationMinutes: 10,
    status: "draft" as const,
    questions: [
      {
        questionText: "Which endpoint naming style best represents a collection of quizzes?",
        options: [
          { id: "a", text: "/getAllQuizzes" },
          { id: "b", text: "/quiz-list" },
          { id: "c", text: "/quizzes" },
          { id: "d", text: "/fetch/quizzes" },
        ],
        correctOptionId: "c",
        points: 10,
        order: 1,
      },
      {
        questionText: "Which HTTP method is the best default choice for updating an existing resource fully?",
        options: [
          { id: "a", text: "GET" },
          { id: "b", text: "POST" },
          { id: "c", text: "PUT" },
          { id: "d", text: "TRACE" },
        ],
        correctOptionId: "c",
        points: 10,
        order: 2,
      },
      {
        questionText: "What is a common purpose of returning a structured error body from an API?",
        options: [
          { id: "a", text: "To make HTML templates render faster" },
          { id: "b", text: "To help clients handle failures consistently" },
          { id: "c", text: "To avoid using HTTP status codes" },
          { id: "d", text: "To reduce server memory usage" },
        ],
        correctOptionId: "b",
        points: 10,
        order: 3,
      },
    ],
  },
] as const;

const seed = async () => {
  await connectDatabase();

  let admin = await UserModel.findOne({ email: env.SEED_ADMIN_EMAIL.toLowerCase() });
  if (!admin) {
    admin = await UserModel.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL.toLowerCase(),
      passwordHash: await hashPassword(env.SEED_ADMIN_PASSWORD),
      role: "admin",
    });
  }

  for (const template of quizTemplates) {
    let quiz = await QuizModel.findOne({ title: template.title, createdBy: admin._id });
    if (!quiz) {
      quiz = await QuizModel.create({
        title: template.title,
        description: template.description,
        durationMinutes: template.durationMinutes,
        status: template.status,
        createdBy: admin._id,
      });
    }

    const questionCount = await QuestionModel.countDocuments({ quizId: quiz._id });
    if (questionCount === 0) {
      await QuestionModel.insertMany(
        template.questions.map((question) => ({
          quizId: quiz._id,
          questionText: question.questionText,
          options: question.options,
          correctOptionId: question.correctOptionId,
          points: question.points,
          order: question.order,
        })),
      );
    }
  }

  await disconnectDatabase();
};

seed().catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});
