import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Log from "@/models/Log"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Only admins can modify user records
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, registrationNumber, role, classLevel, program, semester } = await req.json()

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check email uniqueness if it's changing
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email })
      if (existingEmail) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
    }

    // Check registration number uniqueness if it's changing
    if (registrationNumber && registrationNumber !== user.registrationNumber) {
      const existingReg = await User.findOne({ registrationNumber })
      if (existingReg) {
        return NextResponse.json({ error: "Registration number already exists" }, { status: 400 })
      }
    }

    // Prepare update payload
    const updateData: any = {
      name,
      email,
      registrationNumber,
      role,
    }

    // Clear class metadata if role is not STUDENT
    if (role === "STUDENT") {
      updateData.classLevel = classLevel || ""
      updateData.program = program || ""
      updateData.semester = semester || ""
    } else {
      updateData.classLevel = ""
      updateData.program = ""
      updateData.semester = ""
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, select: "-password" }
    )

    // Log the user update
    await Log.create({
      userId: session.user.id,
      action: "USER_UPDATED",
      details: `Updated user profile for ${user.email} (${id}). Fields updated: ${JSON.stringify(updateData)}`
    })

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    // Only admins can delete users
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await User.findByIdAndDelete(id)

    // Log the deletion
    await Log.create({
      userId: session.user.id,
      action: "USER_DELETED",
      details: `Deleted user account: ${user.name} (${user.email}) - Role: ${user.role}`
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
