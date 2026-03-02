'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function FacultyNav() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('faculty_id')
    localStorage.removeItem('faculty_email')
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/faculty/dashboard" className="flex items-center gap-3">
              <img src="/images/maha-logo.png" alt="College Logo" className="h-10 w-auto" />
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">Faculty Portal</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Management System</p>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex gap-4 items-center">
            <Link href="/faculty/dashboard">
              <Button variant="ghost" className="text-slate-600 hover:text-purple-600">Dashboard</Button>
            </Link>
            <Link href="/faculty/manage-students">
              <Button variant="ghost" className="text-slate-600 hover:text-purple-600">Students</Button>
            </Link>
            <Link href="/faculty/add-marks">
              <Button variant="ghost" className="text-slate-600 hover:text-purple-600">Add Marks</Button>
            </Link>
            <Link href="/faculty/marks-list">
              <Button variant="ghost" className="text-slate-600 hover:text-purple-600">Marks List</Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 ml-4 bg-transparent"
            >
              Logout
            </Button>
          </div>

          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-slate-100 flex flex-col gap-2">
            <Link href="/faculty/dashboard" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
            </Link>
            <Link href="/faculty/manage-students" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Students</Button>
            </Link>
            <Link href="/faculty/add-marks" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Add Marks</Button>
            </Link>
            <Link href="/faculty/marks-list" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Marks List</Button>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 mt-2 bg-transparent"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
