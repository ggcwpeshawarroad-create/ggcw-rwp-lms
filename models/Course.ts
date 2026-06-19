import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    published: {
      type: Boolean,
      default: false,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

export default mongoose.models.Course || mongoose.model("Course", CourseSchema);
