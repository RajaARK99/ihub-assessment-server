import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Argon2id } from "oslo/password";
import { sign } from "hono/jwt";
import { TimeSpan } from "oslo";
import "dotenv/config";

import User from "../model";
import { emailZodSchema, passwordZodSchema, stringZodSchema } from "../lib";

const auth = new Hono().basePath("auth");

const signUpSchema = z.object({
  firstName: stringZodSchema,
  lastName: stringZodSchema,
  email: emailZodSchema,
  mobileNumber: z.string().regex(/^[6-9]\d{9}$/, {
    message:
      "Invalid mobile number. It should start with 6-9 and be 10 digits long.",
  }),
  password: passwordZodSchema,
  role: z.enum(["User", "Admin", "Guest"]).nullish(),
});

const signInSchema = z.object({
  email: emailZodSchema,
  password: passwordZodSchema,
});

auth.post("sign-up", zValidator("json", signUpSchema), async (c) => {
  const { firstName, lastName, email, mobileNumber, password, role } =
    c.req.valid("json");

  try {
    const existUser = await User.findOne({
      email,
    });
    const argon2id = new Argon2id();
    const passwordHash = await argon2id.hash(password);

    if (!existUser) {
      const newUser = await User.create({
        firstName,
        lastName,
        email,
        mobileNumber,
        role,
        passwordHash,
      });
      const savedUser = await newUser.save();

      return c.json({
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        mobileNumber: savedUser.mobileNumber,
        role: savedUser.role,
      });
    } else {
      return c.json(
        {
          message: "User already exist.",
        },
        400
      );
    }
  } catch (err) {
    return c.json({ message: "Server error" }, 500);
  }
});

auth.post("sign-in", zValidator("json", signInSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return c.json({
        message: "User not found.",
      });
    } else {
      const argon2id = new Argon2id();
      const validPassword = await argon2id.verify(user?.passwordHash, password);

      if (validPassword) {
        const jwt = await sign(
          {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
          },
          process.env.JWT_SECRET!
        );

        return c.json({
          token: jwt,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
          },
        });
      } else {
        return c.json({
          message: "Invalid credential.",
        });
      }
    }
  } catch (err) {
    return c.json({ message: "Server error" }, 500);
  }
});
export default auth;
