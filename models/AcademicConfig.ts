import mongoose from "mongoose"

const ClassEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  programs: [{ type: String }],
  semesters: [{ type: String }],
}, { _id: false })

const AcademicConfigSchema = new mongoose.Schema({
  docId: { type: String, default: "singleton", unique: true },
  classes: [ClassEntrySchema],
}, { timestamps: true })

export default mongoose.models.AcademicConfig ||
  mongoose.model("AcademicConfig", AcademicConfigSchema)
