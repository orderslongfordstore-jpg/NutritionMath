import "dotenv/config";
import express from "express";

export const app = express();
app.use(express.json());
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "nutritionMath" }));
app.get("/api/config", (_req, res) => res.json({ supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) }));

if (process.env.NODE_ENV !== "test") {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`nutritionMath server listening on ${port}`));
}
