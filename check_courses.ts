import dotenv from "dotenv";
dotenv.config();
import connectDB from "./lib/db";
import Course from "./models/Course";
import User from "./models/User";

async function check() {
  await connectDB();
  console.log("Connected to DB");

  const teachers = await User.find({ role: "TEACHER" }, "_id").lean();
  const teacherUserIds = teachers.map(t => t._id);
  console.log("Teacher IDs:", teacherUserIds);

  const allCourses = await Course.find({}).populate("teacherId", "name role").lean();
  console.log("\nTotal Courses:", allCourses.length);
  
  allCourses.forEach((c, idx) => {
    console.log(`\n[${idx + 1}] Title: ${c.title}`);
    console.log(`    TeacherId: ${c.teacherId?._id} (${c.teacherId?.name}, ${c.teacherId?.role})`);
    console.log(`    Published: ${c.published}`);
  });

  // Simulate teacherCatalog query for a specific teacher
  // (Assuming we don't have a specific teacher ID handy, we'll just check against the list)
  const query = {
    $or: [
      { teacherId: { $exists: false } },
      { teacherId: null },
      { teacherId: { $nin: teacherUserIds } },
    ],
  };

  const visibleCourses = await Course.find(query).lean();
  console.log("\nVisible to Teachers for claiming:", visibleCourses.length);
  visibleCourses.forEach(c => console.log(` - ${c.title}`));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
