import mongoose from "mongoose";

const ModuleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Module || mongoose.model("Module", ModuleSchema);
