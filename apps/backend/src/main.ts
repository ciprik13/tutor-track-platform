import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: config.get<string>("corsOrigin"),
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix("api");

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip câmpuri necunoscute
      forbidNonWhitelisted: true,
      transform: true, // auto-cast query params
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("TutorTrack API")
    .setDescription("REST API for managing private tutoring sessions")
    .setVersion("1.0")
    .addBearerAuth()
    .addServer(`http://localhost:${config.get("port")}`)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>("port") || 3000;
  await app.listen(port);
  console.log(`🚀 API:     http://localhost:${port}/api`);
  console.log(`📚 Swagger: http://localhost:${port}/docs`);
}
bootstrap();
