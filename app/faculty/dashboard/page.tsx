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
import DashboardLayout from '@/components/dashboard-layout'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  PlusCircle,
  ListOrdered,
  Building2,
  GraduationCap,
  TrendingUp,
  Award,
  BarChart3,
  PieChart,
  ArrowUpRight,
  Target
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
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

interface SubjectPerformance {
  name: string
  average: number
  totalStudents: number
}

interface StudentTopPerformer {
  name: string
  roll_number: string
  average: number
}

interface DepartmentStats {
  name: string
  subjectCount: number
  overallAverage: number
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

  // Analytics states
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([])
  const [topPerformers, setTopPerformers] = useState<StudentTopPerformer[]>([])
  const [deptStats, setDeptStats] = useState<DepartmentStats[]>([])
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)

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
        const facultyId = localStorage.getItem('faculty_id')
        if (!facultyId) {
          router.push('/faculty/login')
          return
        }

        const { data: facultyData, error: fetchError } = await supabase
          .from('faculty')
          .select('*')
          .eq('id', facultyId)

        if (fetchError || !facultyData || facultyData.length === 0) {
          router.push('/faculty/login')
          return
        }

        const faculty = facultyData[0]
        setFaculty(faculty)
        loadDashboardData(faculty.id)
      } catch (err) {
        router.push('/faculty/login')
      }
    }

    checkAuth()
  }, [])

  const loadDashboardData = async (facultyId: string) => {
    try {
      setLoading(true)
      setIsAnalyticsLoading(true)

      // 1. Load Departments
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .eq('faculty_id', facultyId)

      const currentDepts = deptsData || []
      setDepartments(currentDepts)

      // 2. Load Subjects
      const { data: subjsData } = await supabase
        .from('subjects')
        .select('*, departments(name, faculty_id)')
        .eq('departments.faculty_id', facultyId)

      const currentSubjs = (subjsData || []).map((s: any) => ({
        ...s,
        department_name: s.departments?.name || 'Unknown'
      }))
      setSubjects(currentSubjs)

      // 3. Load Marks for Analytics
      const { data: marksData } = await supabase
        .from('marks')
        .select('*, subjects(name, department_id), students(name, roll_number)')
        .in('subject_id', currentSubjs.map((s: any) => s.id))

      if (marksData && marksData.length > 0) {
        // Process Subject Performance
        const subjectMap = new Map<string, { total: number; count: number; name: string }>()
        marksData.forEach((m: any) => {
          const sId = m.subject_id
          const sName = m.subjects?.name || 'Unknown'
          const current = subjectMap.get(sId) || { total: 0, count: 0, name: sName }
          subjectMap.set(sId, {
            total: current.total + m.marks_obtained,
            count: current.count + 1,
            name: sName
          })
        })

        const subPerf: SubjectPerformance[] = Array.from(subjectMap.values()).map((s: any) => ({
          name: s.name,
          average: Math.round(s.total / s.count),
          totalStudents: s.count
        })).sort((a: any, b: any) => b.average - a.average).slice(0, 8)
        setSubjectPerformance(subPerf)

        // Process Top Performers
        const studentMap = new Map<string, { total: number; count: number; name: string; roll: string }>()
        marksData.forEach((m: any) => {
          const sId = m.student_id
          const sName = m.students?.name || 'Unknown'
          const sRoll = m.students?.roll_number || 'N/A'
          const current = studentMap.get(sId) || { total: 0, count: 0, name: sName, roll: sRoll }
          studentMap.set(sId, {
            total: current.total + m.marks_obtained,
            count: current.count + 1,
            name: sName,
            roll: sRoll
          })
        })

        const topP: StudentTopPerformer[] = Array.from(studentMap.values()).map((s: any) => ({
          name: s.name,
          roll_number: s.roll,
          average: Math.round(s.total / s.count)
        })).sort((a: any, b: any) => b.average - a.average).slice(0, 5)
        setTopPerformers(topP)

        // Process Department Stats
        const dStats: DepartmentStats[] = currentDepts.map((d: any) => {
          const deptMarks = marksData.filter((m: any) => m.subjects?.department_id === d.id)
          const avg = deptMarks.length > 0
            ? Math.round(deptMarks.reduce((acc: number, m: any) => acc + m.marks_obtained, 0) / deptMarks.length)
            : 0
          return {
            name: d.name,
            subjectCount: currentSubjs.filter((s: any) => s.department_id === d.id).length,
            overallAverage: avg
          }
        })
        setDeptStats(dStats)
      }

      setLoading(false)
      setIsAnalyticsLoading(false)
    } catch (err) {
      setLoading(false)
      setIsAnalyticsLoading(false)
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
      loadDashboardData(faculty.id)
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
      if (faculty) loadDashboardData(faculty.id)
    } catch (err: any) {
      setError('Failed to create subject: ' + err.message)
      setSubjLoading(false)
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
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-96 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Skeleton className="lg:col-span-8 h-[400px] rounded-2xl" />
          <Skeleton className="lg:col-span-4 h-[400px] rounded-2xl" />
        </div>
      </div>
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
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 lg:gap-4">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold tracking-tight text-foreground">
                Administrative Overview
              </h1>
              <p className="text-muted-foreground mt-1 text-sm lg:text-lg">
                Manage your departments, subjects, and student records.
              </p>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <Link href="/faculty/manage-students">
                <Button variant="outline" size="sm" className="gap-2 border-border shadow-sm text-xs lg:text-sm">
                  <Users size={14} className="lg:w-4 lg:h-4" />
                  <span className="hidden sm:inline">Search</span>
                  <span className="sm:hidden text-[10px]">Search</span>
                </Button>
              </Link>
              <Button onClick={() => setShowChatbot(!showChatbot)} size="sm" className="gap-2 shadow-premium text-xs lg:text-sm">
                <Building2 size={14} className="lg:w-4 lg:h-4" />
                {showChatbot ? 'Hide AI' : 'AI Help'}
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
            <Card className="border-none shadow-premium bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="p-3 lg:p-6 lg:pb-2">
                <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1 lg:mb-2 shadow-inner border border-primary/20">
                  <Building2 size={16} className="lg:w-6 lg:h-6" />
                </div>
                <CardDescription className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] lg:text-[10px]">Departments</CardDescription>
                <CardTitle className="text-xl lg:text-4xl font-extrabold">{departments.length}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-premium bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardHeader className="p-3 lg:p-6 lg:pb-2">
                <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1 lg:mb-2 shadow-inner border border-emerald-500/20">
                  <BookOpen size={16} className="lg:w-6 lg:h-6" />
                </div>
                <CardDescription className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px] lg:text-[10px]">Subjects</CardDescription>
                <CardTitle className="text-xl lg:text-4xl font-extrabold">{subjects.length}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-premium bg-gradient-to-br from-blue-500/5 to-transparent col-span-2 lg:col-span-1">
              <CardHeader className="p-3 lg:p-6 lg:pb-2 flex flex-row items-center justify-between lg:block">
                <div className="flex items-center gap-3 lg:block">
                  <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-0 lg:mb-2 shadow-inner border border-blue-500/20">
                    <Users size={16} className="lg:w-6 lg:h-6" />
                  </div>
                  <div className="lg:hidden">
                    <CardDescription className="text-muted-foreground font-semibold uppercase tracking-wider text-[8px]">Student Records</CardDescription>
                    <CardTitle className="text-lg font-extrabold">Management</CardTitle>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <CardDescription className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Student Records</CardDescription>
                  <CardTitle className="text-4xl font-extrabold">Management</CardTitle>
                </div>
                <Link href="/faculty/manage-students" className="lg:hidden">
                  <Button size="sm" variant="ghost" className="text-xs h-8 px-2">Open →</Button>
                </Link>
              </CardHeader>
            </Card>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-2xl animate-in fade-in slide-in-from-top-4">
              <p className="font-bold flex items-center gap-2">
                <span>⚠️</span> {error}
              </p>
            </div>
          )}

          <Tabs defaultValue="analytics" className="w-full space-y-4 lg:space-y-8">
            <div className="overflow-x-auto pb-2 -mx-3 px-3 scrollbar-none">
              <TabsList className="bg-secondary/50 p-1 rounded-xl lg:rounded-2xl border border-border/50 flex w-max min-w-full">
                <TabsTrigger value="analytics" className="rounded-lg lg:rounded-xl px-4 lg:px-8 py-2 data-[state=active]:shadow-premium flex gap-2 text-xs lg:text-sm whitespace-nowrap">
                  <TrendingUp size={14} className="lg:w-4 lg:h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="departments" className="rounded-lg lg:rounded-xl px-4 lg:px-8 py-2 data-[state=active]:shadow-premium text-xs lg:text-sm whitespace-nowrap">Depts</TabsTrigger>
                <TabsTrigger value="subjects" className="rounded-lg lg:rounded-xl px-4 lg:px-8 py-2 data-[state=active]:shadow-premium text-xs lg:text-sm whitespace-nowrap">Subjects</TabsTrigger>
                <TabsTrigger value="management" className="rounded-lg lg:rounded-xl px-4 lg:px-8 py-2 data-[state=active]:shadow-premium text-xs lg:text-sm whitespace-nowrap">Operations</TabsTrigger>
              </TabsList>
            </div>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 lg:space-y-8 animate-in fade-in slide-in-from-bottom-2 lg:slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
                {/* Main Chart */}
                <Card className="lg:col-span-8 border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between p-4 lg:p-6">
                    <div>
                      <CardTitle className="text-base lg:text-xl">Subject Performance</CardTitle>
                      <CardDescription className="text-xs">Average marks across all courses</CardDescription>
                    </div>
                    <BarChart3 className="text-primary lg:w-6 lg:h-6" size={18} />
                  </CardHeader>
                  <CardContent className="h-[250px] lg:h-[400px] p-2 lg:pt-10">
                    {isAnalyticsLoading ? (
                      <div className="h-full w-full flex items-end justify-between px-10 pb-10">
                        {[60, 80, 45, 90, 30, 75, 40].map((h, i) => (
                          <Skeleton key={i} className="w-[10%] rounded-t-lg" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    ) : subjectPerformance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                          <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            height={80}
                            tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                            stroke="currentColor"
                            opacity={0.5}
                          />
                          <YAxis
                            tick={{ fill: 'currentColor', fontSize: 12, fontWeight: 700 }}
                            stroke="currentColor"
                            opacity={0.5}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '12px',
                              fontWeight: 'bold'
                            }}
                          />
                          <Bar dataKey="average" radius={[8, 8, 0, 0]}>
                            {subjectPerformance.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.average > 75 ? 'hsl(var(--primary))' : entry.average > 40 ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--destructive) / 0.6)'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center opacity-30 space-y-2">
                        <BarChart3 size={48} />
                        <p className="font-bold">Insufficient Data for Visualization</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <Card className="lg:col-span-4 border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <Award size={20} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Top Performers</CardTitle>
                        <CardDescription>Academic high-achievers</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      {topPerformers.map((student, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-background/50 border border-border/50 group hover:border-emerald-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-500/20">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-bold text-sm leading-tight">{student.name}</p>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{student.roll_number}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-emerald-500">{student.average}%</p>
                            <p className="text-[10px] font-bold text-muted-foreground">SCORE</p>
                          </div>
                        </div>
                      ))}
                      {topPerformers.length === 0 && (
                        <div className="py-12 text-center opacity-30">
                          <Users size={32} className="mx-auto mb-2" />
                          <p className="font-bold text-sm">Waiting for Results</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="p-6 bg-emerald-500/5 mt-auto border-t border-emerald-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <Target size={14} />
                      Highest Academic Potential
                    </div>
                    <ArrowUpRight size={16} className="text-emerald-500" />
                  </div>
                </Card>
              </div>

              {/* Department Benchmarks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {deptStats.map((dept, idx) => (
                  <Card key={idx} className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{dept.name}</p>
                        <PieChart size={14} className="text-primary opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-end justify-between">
                        <p className="text-3xl font-black">{dept.overallAverage}%</p>
                        <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <TrendingUp size={10} />
                          AVG
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-1000"
                          style={{ width: `${dept.overallAverage}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground text-center">Across {dept.subjectCount} Active Modules</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-none shadow-premium h-fit bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Register Department</CardTitle>
                    <CardDescription>Setup a new academic division</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateDepartment} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Full Name</label>
                        <Input
                          placeholder="e.g. Computer Science"
                          value={deptName}
                          onChange={(e) => setDeptName(e.target.value)}
                          required
                          className="rounded-xl border-border/50 focus:ring-primary h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">ID Code</label>
                        <Input
                          placeholder="e.g. CS"
                          value={deptCode}
                          onChange={(e) => setDeptCode(e.target.value)}
                          required
                          className="rounded-xl border-border/50 focus:ring-primary h-11"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={deptLoading}
                        className="w-full h-11 rounded-xl shadow-premium font-bold transition-all"
                      >
                        {deptLoading ? 'Processing...' : 'Register Department'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-foreground">Registered Departments</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border/50">
                      {departments.length} Units Found
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {departments.map((dept) => (
                      <Card key={dept.id} className="group hover:shadow-premium hover:-translate-y-1 transition-all duration-300 border-none bg-card/80 backdrop-blur-sm relative overflow-hidden">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                              <Building2 size={20} />
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground tracking-tighter uppercase group-hover:text-primary transition-colors">#{dept.code}</span>
                          </div>
                          <CardTitle className="text-lg font-bold mt-3">{dept.name}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                    {departments.length === 0 && (
                      <Card className="col-span-full border-dashed border-2 border-border/50 bg-transparent flex flex-col items-center justify-center p-12 text-center shadow-none">
                        <Building2 className="text-muted-foreground/30 mb-4" size={48} />
                        <p className="text-muted-foreground font-medium">No departments registered yet.<br />Use the form to add your first academic unit.</p>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 border-none shadow-premium h-fit bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Subject</CardTitle>
                    <CardDescription>Assign a subject to a department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateSubject} className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Academic Department</label>
                        <select
                          value={selectedDept}
                          onChange={(e) => setSelectedDept(e.target.value)}
                          className="w-full px-4 h-11 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-sm appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Choose Department</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Subject Name</label>
                        <Input
                          placeholder="e.g. Advanced Mathematics"
                          value={subjName}
                          onChange={(e) => setSubjName(e.target.value)}
                          required
                          className="rounded-xl border-border/50 focus:ring-primary h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Course Code</label>
                        <Input
                          placeholder="e.g. MATH301"
                          value={subjCode}
                          onChange={(e) => setSubjCode(e.target.value)}
                          required
                          className="rounded-xl border-border/50 focus:ring-primary h-11"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={subjLoading}
                        className="w-full h-11 rounded-xl shadow-premium font-bold"
                      >
                        {subjLoading ? 'Processing...' : 'Create Subject'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="font-bold text-foreground">Course Catalog</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border/50">
                      {subjects.length} Subjects Active
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjects.map((subject) => (
                      <Card key={subject.id} className="group hover:shadow-premium hover:-translate-y-1 transition-all duration-300 border-none bg-card/80 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                          <div className="flex justify-between items-start">
                            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-primary-foreground transition-all">
                              <BookOpen size={20} />
                            </div>
                            <span className="text-[10px] font-black text-muted-foreground tracking-tighter uppercase">#{subject.code}</span>
                          </div>
                          <CardTitle className="text-lg font-bold mt-3 leading-tight group-hover:text-primary transition-colors">{subject.name}</CardTitle>
                          <CardDescription className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5 mt-2">
                            <Building2 size={10} />
                            {subject.department_name}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                    {subjects.length === 0 && (
                      <Card className="col-span-full border-dashed border-2 border-border/50 bg-transparent flex flex-col items-center justify-center p-12 text-center shadow-none">
                        <BookOpen className="text-muted-foreground/30 mb-4" size={48} />
                        <p className="text-muted-foreground font-medium">Subject list is empty.<br />Create subjects and link them to departments.</p>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Management Tab */}
            <TabsContent value="management" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Student Management', desc: 'Manage profiles and credentials', Icon: Users, href: '/faculty/manage-students', color: 'bg-blue-500' },
                  { title: 'Mark Entry', desc: 'Input examination results', Icon: GraduationCap, href: '/faculty/add-marks', color: 'bg-primary' },
                  { title: 'Academic Reports', desc: 'View cumulative mark lists', Icon: ListOrdered, href: '/faculty/marks-list', color: 'bg-emerald-500' },
                ].map((item, idx) => (
                  <Link key={idx} href={item.href}>
                    <Card className="group border-none shadow-premium hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 bg-card/80 backdrop-blur-sm cursor-pointer relative overflow-hidden h-full">
                      <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-all duration-500", item.color)} />
                      <CardHeader>
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform", item.color)}>
                          <item.Icon size={24} />
                        </div>
                        <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                        <CardDescription className="text-sm">{item.desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <Chatbot initiallyOpen={showChatbot} onClose={() => setShowChatbot(false)} />
        </>
      )}
    </DashboardLayout>
  )
}
