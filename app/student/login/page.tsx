'use client'

import React from "react"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'

export default function StudentLogin() {
  const [rollNumber, setRollNumber] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  React.useEffect(() => {
    const studentId = localStorage.getItem('student_id')
    if (studentId) {
      router.push('/student/dashboard')
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll_number: rollNumber, password, dob }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed. Please check your roll number, password, and date of birth.')
        setLoading(false)
        return
      }

      // Store student info in localStorage for client-side access
      localStorage.setItem('student_id', data.student.id)
      localStorage.setItem('student_name', data.student.name)

      // Use window.location for more reliable redirect
      window.location.href = '/student/dashboard'
    } catch (err) {
      setError('An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/images/maha-logo.png"
            alt="College Logo"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
          <p className="text-slate-600">Mahalashmi Women's College</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Login</CardTitle>
            <CardDescription>Access your academic records</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Roll Number
                </label>
                <Input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Your roll number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-600">
                Contact your faculty coordinator if you forgot your login details.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
