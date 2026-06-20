import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    emailVerified: {
      type: Date,
    },
    image: {
      type: String,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["ADMIN", "TEACHER", "STUDENT"],
      default: "STUDENT",
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    lastLogin: {
      type: Date,
    },
    classLevel: {
      type: String,
    },
    program: {
      type: String,
    },
    semester: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Force delete and re-register model to pick up schema changes in HMR
delete mongoose.models.User
export default mongoose.model("User", UserSchema)
