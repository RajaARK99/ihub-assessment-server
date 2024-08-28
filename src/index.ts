import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mongoose from "mongoose";
import { cors } from "hono/cors";
import "dotenv/config";

import authRoute from "./route/auth";
import usersRoute from "./route/users";

const app = new Hono();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello welcome to assessment!.");
});

app.route("/", authRoute);
app.route("/", usersRoute);

const port = 3000;


mongoose
  .connect(process.env.DB_URL!)
  .then(() => {
    serve({
      fetch: app.fetch,
      port,
    });
  })
  .catch((err) => {
    console.error(err);
  });
