import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema } from "schema";

// 🆕 import email sender
import { sendContactMail, sendAutoReply } from "./mail";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);

      // 1️⃣ Save to storage (DB or memory)
      const submission = await storage.createContactSubmission(validatedData);

      // 2️⃣ Send email (fire-and-forget)
      sendContactMail(submission)
        .then(() => console.log("[mail] admin sent"))
        .catch(err => console.error("[mail] admin error", err));

      sendAutoReply({ name: submission.name, email: submission.email, service: submission.service })
        .then(() => console.log("[mail] autoresply sent"))
        .catch(err => console.error("[mail] autoresply error", err));

      // 3️⃣ Respond to frontend immediately
      res.json({ success: true, data: submission });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({ error: "Invalid input data", details: error });
      } else {
        console.error(error);
        res.status(500).json({ error: "Failed to submit contact form" });
      }
    }
  });

  app.get("/api/contact-submissions", async (_req, res) => {
    try {
      const submissions = await storage.getAllContactSubmissions();
      res.json({ success: true, data: submissions });
    } catch (error) {
      console.error("[contact-submissions] error:", error);
      res.status(500).json({ error: "Failed to retrieve contact submissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
