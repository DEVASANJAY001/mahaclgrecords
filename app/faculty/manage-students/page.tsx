'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDOB } from '@/lib/date-utils'

interface Faculty {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

interface Student {
  id: string
  roll_number: string
  name: string
  date_of_birth: string
  department_id: string
  department_name: string
}

export default function ManageStudents() {
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Student form states
  const [studentName, setStudentName] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [dob, setDob] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [studentLoading, setStudentLoading] = useState(false)

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedFilterDept, setSelectedFilterDept] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const facultyId = localStorage.getItem('faculty_id')
        
        if (!facultyId) {
          router.push('/faculty/login')
          return
        }

        const { data: facultyArray, error: fetchError } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', facultyId)

        if (fetchError || !facultyArray || facultyArray.length === 0) {
          router.push('/faculty/login')
          return
        }

        setFaculty(facultyArray[0])
        loadData(facultyId)
      } catch (err) {
        console.error('Auth error:', err)
        router.push('/faculty/login')
      }
    }

    checkAuth()
  }, [])

  // Filter students based on search and department
  useEffect(() => {
    let result = students

    // Filter by department
    if (selectedFilterDept) {
      result = result.filter(s => s.department_id === selectedFilterDept)
    }

    // Filter by search query (roll number or name)
    if (searchQuery.trim()) {
      result = result.filter(s =>
        s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredStudents(result)
  }, [students, searchQuery, selectedFilterDept])

  const loadData = async (facultyId: string) => {
    try {
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .eq('faculty_id', facultyId)

      setDepartments(deptsData || [])

      if (deptsData && deptsData.length > 0) {
        const deptIds = deptsData.map(d => d.id)
        const { data: studentsData } = await supabase
          .from('students')
          .select('*, departments(name)')
          .in('department_id', deptIds)

        const formattedStudents = (studentsData || []).map((s: any) => ({
          ...s,
          department_name: s.departments?.name || 'Unknown'
        }))

        setStudents(formattedStudents)
      }

      setLoading(false)
    } catch (err) {
      console.error('Load error:', err)
      setLoading(false)
    }
  }

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept) {
      setError('Please select a department')
      return
    }

    setStudentLoading(true)
    setError('')

    try {
      // Call API to create student
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName,
          roll_number: rollNumber,
          department_id: selectedDept,
          dob,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create student')
      }

      // Show success message
      const successMsg = `✓ Student created successfully!\nRoll: ${rollNumber}\nName: ${studentName}`
      setError(successMsg)

      setStudentName('')
      setRollNumber('')
      setDob('')
      setSelectedDept('')
      setStudentLoading(false)
      
      // Reload after showing success
      setTimeout(() => {
        setError('')
        if (faculty) loadData(faculty.id)
      }, 2500)
    } catch (err: any) {
      setError('Failed to create student: ' + err.message)
      setStudentLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/faculty/dashboard">
                <Button variant="outline" className="text-purple-600 bg-transparent">
                  ← Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-slate-900">Manage Students</h1>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="text-purple-600 bg-transparent"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Add Student</TabsTrigger>
            <TabsTrigger value="list">Student List</TabsTrigger>
          </TabsList>

          {/* Add Student Tab */}
          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Student</CardTitle>
                <CardDescription>Create a new student account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Department
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    placeholder="Student Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />

                  <Input
                    placeholder="Roll Number"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date of Birth - This will be the login credential
                    </label>
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {dob && (
                      <p className="text-xs text-green-600 mt-2 font-semibold">
                        ✓ Selected: {new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit"
                    disabled={studentLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {studentLoading ? 'Creating...' : 'Add Student'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student List Tab */}
          <TabsContent value="list" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Students List</h3>
              <Link href="/faculty/add-marks">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Enter Marks
                </Button>
              </Link>
            </div>

            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Search (Roll No. or Name)
                </label>
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Filter by Department
                </label>
                <select
                  value={selectedFilterDept}
                  onChange={(e) => setSelectedFilterDept(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- All Departments --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedFilterDept('')
                  }}
                  variant="outline"
                  className="w-full bg-transparent border-slate-300"
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Results Info */}
            <p className="text-sm text-slate-600 mb-2">
              Showing {filteredStudents.length} of {students.length} students
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">Roll No.</th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">Name</th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">Department</th>
                    <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">DOB</th>
                    <th className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-4 py-2 font-medium text-purple-700">{student.roll_number}</td>
                      <td className="border border-slate-300 px-4 py-2">{student.name}</td>
                      <td className="border border-slate-300 px-4 py-2 text-sm text-slate-600">{student.department_name}</td>
                      <td className="border border-slate-300 px-4 py-2">
                        {formatDOB(student.date_of_birth)}
                      </td>
                      <td className="border border-slate-300 px-4 py-2 text-center">
                        <Link href={`/faculty/marks-list`}>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            title="View marksheet for this student"
                          >
                            View Marksheet
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 px-4 py-2 text-center text-slate-600">
                        {searchQuery || selectedFilterDept ? 'No students match your filters.' : 'No students yet. Add one above.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
