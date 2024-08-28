import { Document, Schema, model } from "mongoose";
import { z } from "zod";

export const roleEnum = z.enum(["User", "Admin", "Guest"]);

export type RoleEnum = z.infer<typeof roleEnum>;

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  mobileNumber: string;
  role: RoleEnum;
}

const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  mobileNumber: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  role: {
    type: String,
    required: true,
    enum: ["User", "Admin", "Guest"],
    default: "User",
  },
});

export default model<User>("User", UserSchema);
