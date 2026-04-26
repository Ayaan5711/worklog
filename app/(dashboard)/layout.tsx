import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SideNav from "@/components/side-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <SideNav user={session.user} />
      <main className="flex-1 ml-0 md:ml-60 px-4 md:px-10 pt-20 md:pt-12 pb-28 md:pb-12">
        <div className="max-w-2xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
