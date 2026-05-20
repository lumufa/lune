import { config as loadDotenv } from "dotenv";
import { resolve } from "path";
loadDotenv({ path: resolve(__dirname, "..", ".env") });

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? "3000");
  const host = process.env.HOST ?? "0.0.0.0";
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true
    })
  );

  if (!process.env.LLM_ENDPOINT || !process.env.LLM_API_KEY) {
    Logger.warn(
      "LLM_ENDPOINT or LLM_API_KEY not set — /cycles/ai-interpretation will return 503",
      "Bootstrap"
    );
  }

  await app.listen(port, host);
}

void bootstrap();
