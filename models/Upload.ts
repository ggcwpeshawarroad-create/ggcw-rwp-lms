import mongoose from "mongoose"

const UploadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    data: {
      type: Buffer,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.Upload || mongoose.model("Upload", UploadSchema)
