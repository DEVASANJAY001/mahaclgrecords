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
import Chatbot from '@/components/chatbot'

interface Faculty {
  id: string
  name: string
  email: string
  faculty_id: string
}

interface Department {
  id: string
  name: string
  code: string
  faculty_id: string
}

interface Subject {
  id: string
  name: string
  code: string
  department_id: string
  department_name: string
}

export default function FacultyDashboard() {
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showChatbot, setShowChatbot] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Department form states
  const [deptName, setDeptName] = useState('')
  const [deptCode, setDeptCode] = useState('')
  const [deptLoading, setDeptLoading] = useState(false)

  // Subject form states
  const [subjName, setSubjName] = useState('')
  const [subjCode, setSubjCode] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [subjLoading, setSubjLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage for faculty info
        const facultyId = localStorage.getItem('faculty_id')
        const facultyEmail = localStorage.getItem('faculty_email')

        console.log('[v0] Dashboard auth check - Faculty ID:', facultyId)

        if (!facultyId) {
          console.log('[v0] No faculty ID found, redirecting to login')
          router.push('/faculty/login')
          return
        }

        // Get faculty details
        const { data: facultyData, error: fetchError } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', facultyId)

        if (fetchError || !facultyData || facultyData.length === 0) {
          console.log('[v0] Faculty not found in database, redirecting to login')
          router.push('/faculty/login')
          return
        }

        const faculty = facultyData[0]
        setFaculty(faculty)
        loadDepartments(faculty.id)
      } catch (err) {
        console.error('[v0] Auth check error:', err)
        router.push('/faculty/login')
      }
    }

    checkAuth()
  }, [])

  const loadDepartments = async (facultyId: string) => {
    try {
      const { data: deptsData, error: deptsError } = await supabase
        .from('departments')
        .select('*')
        .eq('faculty_id', facultyId)

      if (deptsError) throw deptsError

      setDepartments(deptsData || [])

      // Load subjects
      const { data: subjsData, error: subjsError } = await supabase
        .from('subjects')
        .select('*, departments(name)')
        .eq('departments.faculty_id', facultyId)

      if (subjsError) throw subjsError

      const formattedSubjects = (subjsData || []).map((s: any) => ({
        ...s,
        department_name: s.departments?.name || 'Unknown'
      }))

      setSubjects(formattedSubjects)
      setLoading(false)
    } catch (err) {
      console.error('Load error:', err)
      setLoading(false)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!faculty) return

    setDeptLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('departments')
        .insert([
          {
            name: deptName,
            code: deptCode,
            faculty_id: faculty.id,
          },
        ])

      if (insertError) throw insertError

      setDeptName('')
      setDeptCode('')
      loadDepartments(faculty.id)
    } catch (err: any) {
      setError('Failed to create department: ' + err.message)
      setDeptLoading(false)
    }
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept) {
      setError('Please select a department')
      return
    }

    setSubjLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('subjects')
        .insert([
          {
            name: subjName,
            code: subjCode,
            department_id: selectedDept,
          },
        ])

      if (insertError) throw insertError

      setSubjName('')
      setSubjCode('')
      setSelectedDept('')
      if (faculty) loadDepartments(faculty.id)
    } catch (err: any) {
      setError('Failed to create subject: ' + err.message)
      setSubjLoading(false)
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
            <div className="flex items-center gap-3">
              <img 
                src="/images/maha-logo.png" 
                alt="Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="font-bold text-slate-900">Faculty Dashboard</h1>
                <p className="text-xs text-slate-600">{faculty?.name}</p>
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

        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="students">Manage Students</TabsTrigger>
          </TabsList>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Department</CardTitle>
                <CardDescription>Add a new academic department</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDepartment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Department Name (e.g., Computer Science)"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Department Code (e.g., CS)"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={deptLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {deptLoading ? 'Creating...' : 'Create Department'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Existing Departments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Card key={dept.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <CardDescription>Code: {dept.code}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                {departments.length === 0 && (
                  <p className="text-slate-600 col-span-full">No departments yet. Create one above.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Subject</CardTitle>
                <CardDescription>Add a new subject to a department</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateSubject} className="space-y-4">
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
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Subject Name (e.g., Data Structures)"
                      value={subjName}
                      onChange={(e) => setSubjName(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Subject Code (e.g., CS101)"
                      value={subjCode}
                      onChange={(e) => setSubjCode(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={subjLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {subjLoading ? 'Creating...' : 'Create Subject'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Existing Subjects</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <Card key={subject.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription>
                        Code: {subject.code} | Dept: {subject.department_name}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                {subjects.length === 0 && (
                  <p className="text-slate-600 col-span-full">No subjects yet. Create one above.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/faculty/manage-students">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Manage Students & Marks
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Chatbot initiallyOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  )
}
