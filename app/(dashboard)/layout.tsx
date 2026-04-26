import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SideNav from "@/components/side-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <SideNav user={session.user} />
      <main className="flex-1 ml-0 md:ml-56 p-4 md:p-8 max-w-3xl">{children}</main>
    </div>
  );
}
