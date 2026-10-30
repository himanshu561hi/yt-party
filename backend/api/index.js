import app from "../src/app.js";
import connectDB from "../src/config/db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return app(req, res);
  }
  await connectDB();
  return app(req, res);
}

