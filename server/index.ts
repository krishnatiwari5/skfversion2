// server/index.ts
import express, { type Request, Response, NextFunction } from "express"
import { registerRoutes } from "./routes"
import dotenv from "dotenv"
import rateLimit from "express-rate-limit"
import cors from "cors"


dotenv.config()

const app = express()

const allowedOrigins = [
  "http://localhost:5173",             
  "https://skfversion2.vercel.app",  
]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)


// simple logger (replacing log from vite.ts)
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
  console.log(`${formattedTime} [${source}] ${message}`)
}

// trust proxy if you're behind one (uncomment if needed)
// app.set("trust proxy", 1)

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown
  }
}

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  max: Number(process.env.RATE_LIMIT_MAX ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
})

app.use("/api/contact", limiter)

app.use(
  express.json({
    verify: (req, _res, buf) => {
      ;(req as any).rawBody = buf
    },
  })
)
app.use(express.urlencoded({ extended: false }))

app.use((req, res, next) => {
  const start = Date.now()
  const path = req.path
  let capturedJsonResponse: Record<string, any> | undefined = undefined

  const originalResJson = res.json.bind(res) as any
  ;(res as any).json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson
    return originalResJson(bodyJson, ...args)
  }

  res.on("finish", () => {
    const duration = Date.now() - start
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`
      if (capturedJsonResponse)
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`
      if (logLine.length > 180) logLine = logLine.slice(0, 179) + "…"
      log(logLine)
    }
  })

  next()
})

;(async () => {
  // just register routes, don’t integrate Vite
  await registerRoutes(app)

  // centralized error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err?.status || err?.statusCode || 500
    const message = err?.message || "Internal Server Error"
    console.error("[server error]", err)
    res.status(status).json({ message })
  })

  const port = parseInt(process.env.PORT || "5000", 10)
  app.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`)
  })
})()
