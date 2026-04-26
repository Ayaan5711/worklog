"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { PlusCircle, List, Star, MessageSquare, BarChart2, Database, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/log",       label: "New Log",    icon: PlusCircle },
  { href: "/timeline",  label: "Timeline",   icon: List },
  { href: "/brag",      label: "Brag Sheet", icon: Star },
  { href: "/standup",   label: "Standup",    icon: MessageSquare },
  { href: "/stats",     label: "Stats",      icon: BarChart2 },
  { href: "/data",      label: "Data",       icon: Database },
];

export default function SideNav({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (
    <nav className="flex-1 px-3 py-5 space-y-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/timeline" && pathname.startsWith(href));
        return (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active ? "bg-[#6c9fff]/10 text-[#6c9fff] border border-[#6c9fff]/20" : "text-[#8690a5] hover:text-white hover:bg-white/5 border border-transparent"
            }`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const userSection = (
    <div className="px-3 py-4 border-t border-[#2a3040]">
      <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
        {user.image && <img src={user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" />}
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{user.name}</p>
          <p className="text-[10px] text-[#556] truncate">{user.email}</p>
        </div>
      </div>
      <button onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[#556] hover:text-white hover:bg-white/5 transition-all">
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-[#141820] border-r border-[#2a3040] flex-col hidden md:flex z-20">
        <div className="px-5 py-6 border-b border-[#2a3040]">
          <h1 className="text-lg font-bold font-mono tracking-tight">worklog<span className="text-[#6c9fff]">.</span>ai</h1>
          <p className="text-xs text-[#8690a5] mt-1">AI work tracker</p>
        </div>
        {navLinks}
        {userSection}
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-20 md:hidden bg-[#141820] border-b border-[#2a3040] flex items-center justify-between px-5 py-4">
        <h1 className="text-base font-bold font-mono">worklog<span className="text-[#6c9fff]">.</span>ai</h1>
        <button onClick={() => setMobileOpen(o => !o)} className="text-[#8690a5] hover:text-white p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-10 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-12 left-0 right-0 bg-[#141820] border-b border-[#2a3040] flex flex-col"
            onClick={e => e.stopPropagation()}>
            {navLinks}
            {userSection}
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-[#141820] border-t border-[#2a3040] flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/timeline" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                active ? "text-[#6c9fff]" : "text-[#556] hover:text-[#8690a5]"
              }`}>
              <Icon className="w-4 h-4" />
              {label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
