import express from "express";
import cors from "cors";

const app = express();

const allowedOrigin = process.env.CLIENT_ORIGIN || "*";

app.use(cors({
  origin: allowedOrigin
}));

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
