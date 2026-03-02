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
import DashboardLayout from '@/components/dashboard-layout'
import { cn } from '@/lib/utils'
import {
  Search,
  Filter,
  UserPlus,
  GraduationCap,
  Users,
  Calendar,
  Trash2,
  Edit,
  ChevronRight,
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  FileText
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const navItems = [
  { label: 'Overview', href: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'Manage Students', href: '/faculty/manage-students', icon: Users },
  { label: 'Add Marks', href: '/faculty/add-marks', icon: PlusCircle },
  { label: 'Marks List', href: '/faculty/marks-list', icon: ListOrdered },
]

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
        const deptIds = deptsData.map((d: any) => d.id)
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
    localStorage.removeItem('faculty_id')
    localStorage.removeItem('faculty_email')
    await supabase.auth.signOut()
    router.push('/')
  }

  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 text-foreground" />
          <Skeleton className="h-5 w-96 text-muted-foreground" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-12 w-48 rounded-2xl" />
        <Skeleton className="h-12 w-48 rounded-2xl" />
      </div>
      <Card className="border-none shadow-premium h-24 w-full rounded-2xl" />
      <Card className="border-none shadow-premium h-64 w-full rounded-2xl" />
    </div>
  )

  return (
    <DashboardLayout
      navItems={navItems}
      userName={faculty?.name || 'Faculty'}
      userRole="Administrator"
      onLogout={handleLogout}
    >
      {loading ? <LoadingSkeleton /> : (
        <>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Student Management
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Register new students and manage existing academic profiles.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/faculty/add-marks">
                <Button className="gap-2 shadow-premium bg-primary hover:bg-primary/90">
                  <PlusCircle size={18} />
                  Add Marks
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className={cn(
              "px-6 py-4 rounded-2xl animate-in fade-in slide-in-from-top-4 border",
              error.includes('✓')
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              <p className="font-bold flex items-center gap-2">
                <span>{error.includes('✓') ? '✨' : '⚠️'}</span> {error}
              </p>
            </div>
          )}

          <Tabs defaultValue="list" className="w-full space-y-8">
            <div className="flex items-center justify-between">
              <TabsList className="bg-secondary/50 p-1 rounded-2xl border border-border/50">
                <TabsTrigger value="list" className="rounded-xl px-8 py-2.5 data-[state=active]:shadow-premium">Student Directory</TabsTrigger>
                <TabsTrigger value="add" className="rounded-xl px-8 py-2.5 data-[state=active]:shadow-premium">Register New Student</TabsTrigger>
              </TabsList>
            </div>

            {/* Student List Tab */}
            <TabsContent value="list" className="space-y-6">
              {/* Advanced Filters */}
              <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-visible z-20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                    <div className="md:col-span-5 space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Search Database</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <Input
                          placeholder="Search by name or roll number..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 rounded-xl border-border/50 h-11 bg-background"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Filter by Department</label>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <select
                          value={selectedFilterDept}
                          onChange={(e) => setSelectedFilterDept(e.target.value)}
                          className="w-full pl-10 pr-4 h-11 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm appearance-none cursor-pointer"
                        >
                          <option value="">All Departments</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-3">
                      <Button
                        onClick={() => {
                          setSearchQuery('')
                          setSelectedFilterDept('')
                        }}
                        variant="outline"
                        className="w-full h-11 rounded-xl border-border/50 bg-background hover:bg-secondary transition-all"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Table */}
              <Card className="border-none shadow-premium overflow-hidden bg-card/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-wider">Student Identification</th>
                        <th className="px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-left text-xs font-black text-muted-foreground uppercase tracking-wider">Date of Birth</th>
                        <th className="px-6 py-4 text-center text-xs font-black text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="group hover:bg-primary/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground leading-tight">{student.name}</p>
                                <p className="text-xs font-black text-primary uppercase tracking-tighter mt-0.5">{student.roll_number}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-black uppercase border border-border/50">
                              {student.department_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar size={14} />
                              {formatDOB(student.date_of_birth)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link href={`/faculty/marks-list`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary-foreground hover:bg-primary rounded-lg group-hover:scale-105 transition-all gap-1.5"
                              >
                                <FileText size={14} />
                                View Records
                                <ChevronRight size={14} />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-2 opacity-30">
                              <Users size={48} />
                              <p className="font-bold text-lg">No Matching Records</p>
                              <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredStudents.length > 0 && (
                  <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-between items-center">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Showing {filteredStudents.length} of {students.length} Total Students
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Add Student Tab */}
            <TabsContent value="add" className="max-w-2xl mx-auto">
              <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">New Registration</CardTitle>
                  <CardDescription>Create a secure profile for an incoming student.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateStudent} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Target Department</label>
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="w-full px-4 h-12 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select Department...</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Full Student Name</label>
                        <Input
                          placeholder="e.g. Rahul Sharma"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          required
                          className="rounded-xl border-border/50 h-12 bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Unique Roll Number</label>
                        <Input
                          placeholder="e.g. 24CS001"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          required
                          className="rounded-xl border-border/50 h-12 bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Date of Birth (Login Credential)</label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          required
                          max={new Date().toISOString().split('T')[0]}
                          className="rounded-xl border-border/50 h-12 bg-background pr-10"
                        />
                      </div>
                      {dob && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-xs font-bold animate-in fade-in zoom-in-95">
                          <GraduationCap size={14} />
                          Login Password Set: {new Date(dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={studentLoading}
                      className="w-full h-12 rounded-xl shadow-premium font-bold text-lg transition-all"
                    >
                      {studentLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Finalizing Registration...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <UserPlus size={20} />
                          Complete Registration
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardLayout>
  )
}
