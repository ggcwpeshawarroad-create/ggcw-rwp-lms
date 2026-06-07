import mongoose from "mongoose"

const SubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    score: {
      type: Number,
    },
    totalQuestions: {
      type: Number,
    },
    answers: [
      {
        questionIndex: Number,
        answerIndex: Number,
        isCorrect: Boolean,
      },
    ],
    assignmentFile: {
      url: String,
      name: String,
    },
    submissionText: {
      type: String, // For text-based assignments
    },
    grade: {
      type: String, // Can be "A", "85", "Pass", etc.
    },
    feedback: {
      type: String, // Teacher comments
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Submission || mongoose.model("Submission", SubmissionSchema)
