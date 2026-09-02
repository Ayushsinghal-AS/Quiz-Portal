import { createApp } from "./app.js";
import { cacheService } from "./services/cache.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const start = async () => {
  await connectDatabase();
  await cacheService.connect();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`QuizArena API running on http://localhost:${env.PORT}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

