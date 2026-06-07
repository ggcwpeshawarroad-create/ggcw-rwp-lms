import mongoose, { Document } from "mongoose"

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer?: number;
}

export interface ILesson extends Document {
  title: string;
  type: "LECTURE" | "QUIZ" | "ASSIGNMENT" | "DOCUMENT" | "ANNOUNCEMENT" | "SLIDER";
  content?: string;
  videoUrl?: string;
  chapterId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  order: number;
  attachments: {
    name: string;
    url: string;
  }[];
  quizData?: IQuizQuestion[];
  startDate?: Date;
  endDate?: Date;
  isRetakeAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["LECTURE", "QUIZ", "ASSIGNMENT", "DOCUMENT", "ANNOUNCEMENT", "SLIDER"],
      default: "LECTURE",
    },
    content: {
      type: String, // HTML/Markdown content for lectures or instructions
    },
    videoUrl: {
      type: String, // For lecture video links (YouTube/Vimeo)
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        name: String,
        url: String,
      },
    ],
    // For quizzes and assignments
    quizData: [
      {
        question: String,
        options: [String],
        correctAnswer: Number, // index
      },
    ],
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isRetakeAllowed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Delete cached model to ensure updated enum values are always picked up
delete mongoose.models.Lesson
export default mongoose.model<ILesson>("Lesson", LessonSchema)
