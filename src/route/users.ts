import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import "dotenv/config";
import User, { roleEnum, User as IUser } from "../model";
import { JWTPayload } from "hono/utils/jwt/types";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

type Variables = {
  user: IUser & JWTPayload;
};

const users = new Hono<{ Variables: Variables }>().basePath("/users");

const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header("authorization")?.split(" ")[1];

  if (token) {
    try {
      const jwt = await verify(token, process.env.JWT_SECRET!);

      c.set("user", jwt);
      await next();
    } catch (err) {
      return c.json({
        message: "Unauthorized",
      });
    }
  }
  {
    return c.json(
      {
        message: "Access denied.",
      },
      400
    );
  }
});

users.use(authMiddleware);

const querySchema = z.object({
  search: z.string().nullish(),
  role: roleEnum.nullish(),
  page: z.string().nullish(),
  limit: z.string().nullish(),
});

users.get("/", zValidator("query", querySchema), async (c) => {
  const { role, search, limit, page } = c.req.valid("query");

  const filter: any = {};

  if (search) {
    const searchRegex = new RegExp(search as string, "i");
    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { mobileNumber: searchRegex },
    ];
  }

  if (role) {
    filter.role = role;
  }

  try {
    const pageNumber = parseInt(page?.toString() ?? 1?.toString());
    const pageSize = parseInt(limit?.toString() ?? 10?.toString());

    const totalDocs = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalDocs / pageSize);
    const users =
      (
        await User.find(filter)
          .skip((pageNumber - 1) * pageSize)
          .limit(pageSize)
      ).map((user) => ({
        id: user.id as unknown as string,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      })) ?? [];

    const paginatedResponse = {
      users,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
      limit: pageSize,
      nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
      page: pageNumber,
      pagingCounter: (pageNumber - 1) * pageSize + 1,
      prevPage: pageNumber > 1 ? pageNumber - 1 : null,
      totalDocs: totalDocs || null,
      totalPages: totalPages || null,
    };

    return c.json(paginatedResponse);
  } catch (error) {
    return c.json({ message: "Server error" }, 500);
  }
});

export default users;
