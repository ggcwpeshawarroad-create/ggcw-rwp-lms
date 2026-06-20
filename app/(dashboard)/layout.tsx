import DashboardLayout from "@/components/layout/DashboardLayout"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect("/")
  }

  return (
    <DashboardLayout 
      role={session.user.role as any} 
      title="Dashboard" 
      userName={session.user.name || "User"}
    >
      {children}
    </DashboardLayout>
  )
}
