'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function StudentNav() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    document.cookie = 'student_id=; max-age=0'
    router.push('/')
  }

  return (
    <nav className="bg-purple-700 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/images/maha-logo.png" alt="College Logo" className="h-10" />
          <span className="font-bold text-sm">Student Portal</span>
        </div>

        <div className="hidden md:flex gap-6 items-center">
          <Link href="/student/dashboard" className="hover:bg-purple-600 px-4 py-2 rounded">
            My Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-2">
          <Link href="/student/dashboard" className="hover:bg-purple-600 px-4 py-2 rounded block">
            My Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded w-full text-left"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
