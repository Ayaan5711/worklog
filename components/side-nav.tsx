"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { PlusCircle, List, Star, MessageSquare, BarChart2, Database, LogOut } from "lucide-react";

const NAV = [
  { href: "/log",       label: "New Log",    icon: PlusCircle },
  { href: "/dashboard", label: "Timeline",   icon: List },
  { href: "/brag",      label: "Brag Sheet", icon: Star },
  { href: "/standup",   label: "Standup",    icon: MessageSquare },
  { href: "/stats",     label: "Stats",      icon: BarChart2 },
  { href: "/data",      label: "Data",       icon: Database },
];

export default function SideNav({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#141820] border-r border-[#2a3040] flex flex-col hidden md:flex z-10">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#2a3040]">
        <h1 className="text-lg font-bold font-mono tracking-tight">
          worklog<span className="text-[#6c9fff]">.</span>ai
        </h1>
        <p className="text-xs text-[#8690a5] mt-0.5">AI work tracker</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-[#6c9fff]/10 text-[#6c9fff] border border-[#6c9fff]/20"
                  : "text-[#8690a5] hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-[#2a3040]">
        <div className="flex items-center gap-2 px-2 mb-2">
          {user.image && (
            <img src={user.image} alt="" className="w-6 h-6 rounded-full" />
          )}
          <span className="text-xs text-[#8690a5] truncate">{user.name || user.email}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8690a5] hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
