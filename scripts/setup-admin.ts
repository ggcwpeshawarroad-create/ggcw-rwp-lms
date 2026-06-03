import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not defined in .env file");
  process.exit(1);
}

// User Schema (Simplified for extraction/setup)
const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String },
  role: { type: String, enum: ["ADMIN", "TEACHER", "STUDENT"], default: "STUDENT" },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function setupAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("❌ Usage: npx tsx scripts/setup-admin.ts <email> <password>");
    process.exit(1);
  }

  try {
    console.log("⏳ Connecting to database...");
    await mongoose.connect(DATABASE_URL!);
    console.log("✅ Connected to database");

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(`⏳ Updating existing user: ${email}...`);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "ADMIN";
      await existingAdmin.save();
      console.log(`✅ Super Admin updated successfully: ${email}`);
    } else {
      console.log(`⏳ Creating new super admin: ${email}...`);
      await User.create({
        name: "Super Admin",
        email,
        password: hashedPassword,
        role: "ADMIN",
      });
      console.log(`✅ Super Admin created successfully: ${email}`);
    }
  } catch (error) {
    console.error("❌ Error setting up super admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setupAdmin();
