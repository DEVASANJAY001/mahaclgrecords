'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    UserCircle,
    GraduationCap,
    FileText,
    LogOut,
    Menu,
    X,
    Bell,
    Settings,
    Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
}

interface DashboardLayoutProps {
    children: React.ReactNode
    navItems: NavItem[]
    userName: string
    userRole: string
    onLogout: () => void
}

export default function DashboardLayout({
    children,
    navItems,
    userName,
    userRole,
    onLogout
}: DashboardLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Default closed on mobile
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className={cn(
                "bg-card border-r border-border transition-all duration-300 ease-in-out z-50 fixed lg:static h-full shadow-2xl lg:shadow-none",
                isSidebarOpen ? "w-64 translate-x-0" : "w-0 lg:w-20 -translate-x-full lg:translate-x-0 overflow-hidden"
            )}>
                <div className="h-full flex flex-col">
                    {/* Logo Section */}
                    <div className="p-4 lg:p-6 flex items-center gap-3 border-b border-border">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary rounded-lg lg:rounded-xl flex items-center justify-center text-primary-foreground shadow-premium">
                            <GraduationCap size={18} className="lg:hidden" />
                            <GraduationCap size={24} className="hidden lg:block" />
                        </div>
                        {isSidebarOpen && (
                            <span className="font-bold text-lg lg:text-xl tracking-tight text-foreground truncate">MAHAREGEN</span>
                        )}
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <item.icon size={20} className={cn(
                                        "shrink-0",
                                        isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"
                                    )} />
                                    {isSidebarOpen && (
                                        <span className="font-medium">{item.label}</span>
                                    )}
                                    {!isSidebarOpen && (
                                        <div className="absolute left-14 bg-foreground text-background px-2 py-1 rounded text-xs invisible group-hover:visible whitespace-nowrap z-50">
                                            {item.label}
                                        </div>
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="p-3 lg:p-4 border-t border-border bg-muted/30">
                        {isSidebarOpen && (
                            <div className="mb-3 px-2">
                                <p className="font-semibold text-xs lg:text-sm text-foreground truncate">{userName}</p>
                                <p className="text-[10px] lg:text-xs text-muted-foreground truncate capitalize">{userRole}</p>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 text-xs lg:text-sm",
                                !isSidebarOpen && "px-2 lg:px-3"
                            )}
                            onClick={onLogout}
                        >
                            <LogOut size={18} className="shrink-0" />
                            {isSidebarOpen && <span className="ml-2 lg:ml-3 font-medium">Logout</span>}
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-14 lg:h-16 bg-card/80 backdrop-blur-md border-b border-border px-3 lg:px-8 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-muted-foreground w-8 h-8 lg:w-10 lg:h-10"
                        >
                            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
                        </Button>

                        <div className="hidden md:flex relative max-w-sm w-48 lg:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-8 lg:h-9 bg-muted/50 border-none text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-1 lg:gap-4">
                        <Button variant="ghost" size="icon" className="text-muted-foreground relative w-8 h-8 lg:w-10 lg:h-10">
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full border border-card" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground w-8 h-8 lg:w-10 lg:h-10">
                            <Settings size={18} />
                        </Button>
                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground overflow-hidden ml-1 lg:ml-2 shadow-sm">
                            <UserCircle size={24} className="text-muted-foreground lg:hidden" />
                            <UserCircle size={28} className="text-muted-foreground hidden lg:block" />
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-3 lg:p-8 bg-background/50">
                    <div className="max-w-7xl mx-auto space-y-4 lg:space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
