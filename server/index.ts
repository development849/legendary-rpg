import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`serving on port ${port}`);
      try {
        const { npcLog } = await import("@shared/schema");
        const { db } = await import("./db");
        const { and, eq, like, isNull, inArray, or } = await import("drizzle-orm");

        const bogus1 = await db.delete(npcLog)
          .where(and(
            or(
              like(npcLog.notes, "%Auto-detected from narrative%"),
              like(npcLog.notes, "%GM forgot to emit NPC_MET%"),
            ),
            or(
              eq(npcLog.role, "unknown"),
              like(npcLog.description, "%Named character mentioned%"),
              like(npcLog.description, "%Character encountered in the narrative%"),
            ),
          ))
          .returning({ id: npcLog.id, name: npcLog.name });

        const KNOWN_BAD_PARTY = "2952f487-3029-4ecb-a73a-59659b00a17d";
        const KNOWN_BAD_NAMES = ["Seagull", "Rusty", "Adventurers"];
        const bogus2 = await db.delete(npcLog)
          .where(and(
            eq(npcLog.partyId, KNOWN_BAD_PARTY),
            inArray(npcLog.name, KNOWN_BAD_NAMES),
          ))
          .returning({ id: npcLog.id, name: npcLog.name });

        const GENERIC_ROLES = ["noble", "travellers", "travelers", "unknown", "citizen", "commoner"];
        const bogus3 = await db.delete(npcLog)
          .where(and(
            or(
              isNull(npcLog.notes),
              eq(npcLog.notes, ""),
            ),
            inArray(npcLog.role, GENERIC_ROLES),
            or(
              like(npcLog.description, "%looms ahead%"),
              like(npcLog.description, "%weathered sign%"),
              like(npcLog.description, "%creaking%"),
              like(npcLog.description, "%a diverse group%"),
            ),
          ))
          .returning({ id: npcLog.id, name: npcLog.name });

        const allBogus = [...bogus1, ...bogus2, ...bogus3];
        const unique = [...new Map(allBogus.map(b => [b.id, b])).values()];
        if (unique.length > 0) {
          log(`Cleaned up ${unique.length} bogus NPCs: ${unique.map(b => b.name).join(", ")}`);
        }
      } catch (e) {
        log(`NPC cleanup error: ${e}`);
      }
    },
  );
})();
