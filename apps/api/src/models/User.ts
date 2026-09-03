import mongoose, { Schema } from "mongoose";
import type { Role } from "@quizarena/shared";

export interface UserDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ["admin", "participant"], default: "participant" },
  },
  {
    timestamps: true,
  },
);

export const UserModel = mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

