import mongoose from "mongoose";

const AttendanceRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "EXCUSED", "LEAVE"],
      default: "PRESENT",
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const AttendanceSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    records: {
      type: [AttendanceRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AttendanceSchema.index({ courseId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);
