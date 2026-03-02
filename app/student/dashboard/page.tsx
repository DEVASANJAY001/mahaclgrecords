'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import Chatbot from '@/components/chatbot'
import { formatDOB } from '@/lib/date-utils'
import DashboardLayout from '@/components/dashboard-layout'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  LayoutDashboard,
  FileText,
  UserCircle,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  X
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StudentData {
  roll_number: string
  name: string
  dob: string
  department_name: string
}

interface MarkRecord {
  subject_name: string
  subject_code: string
  exam_type: string
  exam_type_id: string
  marks: number
}

interface ExamCard {
  exam_type_id: string
  exam_type: string
  subject_count: number
  totalMarks: number
  averageMarks: number
}

interface PerformanceStats {
  totalMarks: number
  averageMarks: number
  highestMark: number
  subjectsCount: number
}

export default function StudentDashboard() {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [marks, setMarks] = useState<MarkRecord[]>([])
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [showChatbot, setShowChatbot] = useState(true)
  const [examCards, setExamCards] = useState<ExamCard[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [previewExamId, setPreviewExamId] = useState<string | null>(null)
  const [previewExamType, setPreviewExamType] = useState<string>('')
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        // Check localStorage for student info
        const studentId = localStorage.getItem('student_id')
        const studentName = localStorage.getItem('student_name')


        if (!studentId || !studentName) {
          router.push('/student/login')
          return
        }


        // Get student details
        const { data: studentArray, error: fetchError } = await supabase
          .from('students')
          .select('*, departments(name)')
          .eq('id', studentId)



        if (!studentArray || studentArray.length === 0) {
          setLoading(false)
          return
        }

        const studentData = studentArray[0]

        const formattedStudent = {
          roll_number: studentData.roll_number,
          name: studentData.name,
          dob: studentData.date_of_birth,
          department_name: studentData.departments?.name || 'Unknown',
        }

        setStudent(formattedStudent)

        // Get marks
        const { data: marksData, error: marksError } = await supabase
          .from('marks')
          .select('*, subjects(name, code), exam_types(id, name)')
          .eq('student_id', studentId)


        const formattedMarks = (marksData || []).map((m: any) => ({
          subject_name: m.subjects?.name || 'Unknown',
          subject_code: m.subjects?.code || 'N/A',
          exam_type: m.exam_types?.name || 'Unknown',
          exam_type_id: m.exam_types?.id || 'unknown',
          marks: m.marks_obtained,
        }))

        setMarks(formattedMarks)

        // Create exam cards grouped by exam type
        const examMap = new Map<string, { exam_type: string; marks: number[] }>()
        formattedMarks.forEach((mark: any) => {
          const key = mark.exam_type_id
          if (!examMap.has(key)) {
            examMap.set(key, { exam_type: mark.exam_type, marks: [] })
          }
          examMap.get(key)!.marks.push(mark.marks)
        })

        const cards: ExamCard[] = Array.from(examMap.entries()).map(([id, data]) => ({
          exam_type_id: id,
          exam_type: data.exam_type,
          subject_count: data.marks.length,
          totalMarks: data.marks.reduce((a: number, b: number) => a + b, 0),
          averageMarks: Math.round((data.marks.reduce((a: number, b: number) => a + b, 0) / data.marks.length) * 100) / 100,
        }))

        setExamCards(cards)

        // Calculate stats
        if (formattedMarks.length > 0) {
          const totalMarks = formattedMarks.reduce((sum: number, m: any) => sum + m.marks, 0)
          const averageMarks = totalMarks / formattedMarks.length
          const highestMark = Math.max(...formattedMarks.map((m: any) => m.marks))
          const subjectsCount = new Set(formattedMarks.map((m: any) => m.subject_code)).size

          setStats({
            totalMarks,
            averageMarks: Math.round(averageMarks * 100) / 100,
            highestMark,
            subjectsCount,
          })
        }

        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }

    loadStudentData()
  }, [])

  const handlePrintPDF = async () => {
    setExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Create a temporary element with the marksheet content
      const element = document.createElement('div')
      element.id = 'marksheet-to-export'
      element.style.background = 'white'
      const examName = examCards.find(e => e.exam_type_id === selectedExamId)?.exam_type
      const examMarks = marks.filter(m => m.exam_type_id === selectedExamId)

      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
            <img src="/images/maha-logo.png" alt="College Logo" style="height: 80px; margin-bottom: 15px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 10px 0;">MAHALASHMI</h1>
            <p style="color: #475569; margin: 5px 0;">Women's College of Arts and Science</p>
            <p style="color: #475569; font-size: 14px; margin: 5px 0;">(Affiliated to University of Madras)</p>
            <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-top: 15px;">ACADEMIC MARK SHEET - ${examName}</h2>
          </div>

          <div style="margin-bottom: 25px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Roll Number</p>
                <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.roll_number}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Name</p>
                <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.name}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Department</p>
                <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.department_name}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Date of Birth</p>
                <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.dob}</p>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Academic Performance</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #e2e8f0;">
                  <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-weight: bold;">Subject Code</th>
                  <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-weight: bold;">Subject Name</th>
                  <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold;">Marks</th>
                </tr>
              </thead>
              <tbody>
                ${examMarks.map(mark => `
                  <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${mark.subject_code}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px;">${mark.subject_name}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${mark.marks}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="border-top: 2px solid #e2e8f0; padding-top: 25px; margin-top: 25px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; text-align: center;">
              <div>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 50px;">Principal</p>
                <p style="font-size: 12px; color: #64748b;">Mahalashmi Women's College</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #64748b;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #64748b; margin-bottom: 50px;">Authorized Signature</p>
                <p style="font-size: 12px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      `

      const opt = {
        margin: 5,
        filename: `${examName}_marksheet_${student?.roll_number}_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            // Aggressively remove all global styles that might contain oklch/lab colors
            // that crash html2canvas
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
            styles.forEach(s => s.remove())

            const el = clonedDoc.getElementById('marksheet-to-export')
            if (el) {
              el.style.background = 'white'
              el.style.color = 'black'
              el.style.display = 'block'
            }
          }
        },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }


  const getMarksheetHTML = (examTypeId: string, examTypeName: string) => {
    const examMarks = marks.filter(m => m.exam_type_id === examTypeId)

    return `
      <div style="font-family: Arial, sans-serif; padding: 40px; background: white;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
          <img src="/images/maha-logo.png" alt="College Logo" style="height: 80px; margin-bottom: 15px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 10px 0;">MAHALASHMI</h1>
          <p style="color: #475569; margin: 5px 0;">Women's College of Arts and Science</p>
          <p style="color: #475569; font-size: 14px; margin: 5px 0;">(Affiliated to University of Madras)</p>
          <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-top: 15px;">ACADEMIC MARK SHEET - ${examTypeName}</h2>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Roll Number</p>
              <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.roll_number}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Name</p>
              <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.name}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Department</p>
              <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${student?.department_name}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Date of Birth</p>
              <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${formatDOB(student?.dob || '')}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">Academic Performance</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e2e8f0;">
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-weight: bold;">Subject Code</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-weight: bold;">Subject Name</th>
                <th style="border: 1px solid #cbd5e1; padding: 10px; text-align: center; font-weight: bold;">Marks</th>
              </tr>
            </thead>
            <tbody>
              ${examMarks.map(mark => `
                <tr>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${mark.subject_code}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${mark.subject_name}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${mark.marks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="border-top: 2px solid #e2e8f0; padding-top: 25px; margin-top: 25px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; text-align: center;">
            <div>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 50px;">Principal</p>
              <p style="font-size: 12px; color: #64748b;">Mahalashmi Women's College</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #64748b;">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #64748b; margin-bottom: 50px;">Authorized Signature</p>
              <p style="font-size: 12px; color: #64748b;">Date: ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  const handleExportFromPreview = async () => {
    if (!previewExamId) return
    setExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.createElement('div')
      element.innerHTML = getMarksheetHTML(previewExamId, previewExamType)

      const opt = {
        margin: 5,
        filename: `${previewExamType}_marksheet_${student?.roll_number}_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const },
      }

      await html2pdf().set(opt).from(element).save()
      setPreviewExamId(null)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-2 h-[450px] w-full rounded-2xl" />
        <Skeleton className="h-[450px] w-full rounded-2xl" />
      </div>
    </div>
  )

  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Academic Records', href: '#marks-section', icon: FileText },
    { label: 'Profile', href: '#profile', icon: UserCircle },
  ]

  const handleLogout = () => {
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_name')
    router.push('/')
  }

  // Prepare chart data - trend of marks over exams
  const chartData = [...examCards].reverse().map(card => ({
    name: card.exam_type,
    avg: card.averageMarks,
    total: card.totalMarks
  }))

  return (
    <DashboardLayout
      navItems={navItems}
      userName={student?.name || 'Student'}
      userRole="Student"
      onLogout={handleLogout}
    >
      {loading ? <LoadingSkeleton /> : (
        <>
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 lg:gap-4">
            <div>
              <h1 className="text-xl lg:text-3xl font-bold tracking-tight text-foreground">
                Welcome back, {student?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-muted-foreground mt-1 text-sm lg:text-lg">
                Your academic performance summary.
              </p>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <Button variant="outline" size="sm" className="gap-2 border-border shadow-sm text-xs lg:text-sm">
                <Calendar size={14} className="lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Schedule</span>
                <span className="sm:hidden text-[10px]">Schedule</span>
              </Button>
              <Button onClick={() => setShowChatbot(!showChatbot)} size="sm" className="gap-2 shadow-premium text-xs lg:text-sm">
                {showChatbot ? 'Focus' : 'AI Help'}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            <Card className="border-none shadow-premium bg-gradient-to-br from-primary/10 to-transparent">
              <CardHeader className="p-3 lg:p-6 lg:pb-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-1 lg:mb-2 text-xs">
                  <TrendingUp size={16} className="lg:w-5 lg:h-5" />
                </div>
                <CardDescription className="text-muted-foreground font-medium text-[8px] lg:text-[10px] uppercase">Average Score</CardDescription>
                <CardTitle className="text-xl lg:text-3xl font-bold">{stats?.averageMarks.toFixed(1)}%</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-premium">
              <CardHeader className="p-3 lg:p-6 lg:pb-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1 lg:mb-2 text-xs">
                  <Award size={16} className="lg:w-5 lg:h-5" />
                </div>
                <CardDescription className="text-muted-foreground font-medium text-[8px] lg:text-[10px] uppercase">Total Marks</CardDescription>
                <CardTitle className="text-xl lg:text-3xl font-bold">{stats?.totalMarks}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-premium">
              <CardHeader className="p-3 lg:p-6 lg:pb-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 mb-1 lg:mb-2 text-xs">
                  <BookOpen size={16} className="lg:w-5 lg:h-5" />
                </div>
                <CardDescription className="text-muted-foreground font-medium text-[8px] lg:text-[10px] uppercase">Subjects</CardDescription>
                <CardTitle className="text-xl lg:text-3xl font-bold">{stats?.subjectsCount}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-premium">
              <CardHeader className="p-3 lg:p-6 lg:pb-2">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 mb-1 lg:mb-2 text-xs">
                  <FileText size={16} className="lg:w-5 lg:h-5" />
                </div>
                <CardDescription className="text-muted-foreground font-medium text-[8px] lg:text-[10px] uppercase">Exams</CardDescription>
                <CardTitle className="text-xl lg:text-3xl font-bold">{examCards.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Main Grid: Charts & Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Chart */}
            <Card className="lg:col-span-2 border-none shadow-premium overflow-hidden bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Performance Trend</CardTitle>
                <CardDescription>Academic progress across the current semester</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] pl-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow-premium)',
                        backgroundColor: 'var(--card)',
                        fontSize: '12px'
                      }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avg"
                      stroke="var(--primary)"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorAvg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card className="border-none shadow-premium bg-card/80 backdrop-blur-sm" id="profile">
              <CardHeader>
                <CardTitle className="text-xl">Student Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-secondary/80 border border-border/50">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                    <UserCircle size={40} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-lg text-foreground truncate">{student?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{student?.department_name}</p>
                  </div>
                </div>

                <div className="space-y-4 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Roll Number
                    </span>
                    <span className="font-bold text-foreground">{student?.roll_number}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Date of Birth
                    </span>
                    <span className="font-bold text-foreground">{student?.dob}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 rounded-xl border-border hover:bg-secondary font-semibold">
                  Manage Profile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Exam Section */}
          <div id="marks-section" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Academic Records</h2>
                <p className="text-muted-foreground text-sm mt-1">Official performance reports and certifications</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examCards.map((exam) => (
                <Card
                  key={exam.exam_type_id}
                  className={cn(
                    "group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-none relative overflow-hidden",
                    selectedExamId === exam.exam_type_id ? "ring-2 ring-primary shadow-premium" : "shadow-premium"
                  )}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-500" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start relative z-10">
                      <div className="bg-secondary/80 p-2 rounded-xl border border-border/50 mb-3 group-hover:text-primary transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs font-bold">
                        {exam.averageMarks >= 40 ? 'QUALIFIED' : 'PENDING'}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {exam.exam_type}
                    </CardTitle>
                    <CardDescription className="font-medium">{exam.subject_count} Subjects Reported</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 relative z-10">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/30">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Aggregate</p>
                        <p className="text-xl font-black text-foreground">{exam.averageMarks.toFixed(1)}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Score</p>
                        <p className="text-xl font-black text-foreground">{exam.totalMarks}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 rounded-xl shadow-sm font-bold"
                        onClick={() => {
                          setSelectedExamId(exam.exam_type_id === selectedExamId ? null : exam.exam_type_id)
                        }}
                      >
                        Details
                      </Button>
                      <Button
                        variant="secondary"
                        className="rounded-xl px-4 border border-border/50 hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => {
                          setPreviewExamId(exam.exam_type_id)
                          setPreviewExamType(exam.exam_type)
                        }}
                      >
                        <FileText size={18} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Details Table - Only shown when an exam is selected */}
          {selectedExamId && (
            <Card className="border-none shadow-premium animate-in fade-in slide-in-from-bottom-5 duration-500 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 pb-5 bg-muted/30">
                <div>
                  <CardTitle className="text-lg">Detailed Academic Report</CardTitle>
                  <CardDescription>
                    Subject-wise breakdown for {examCards.find(e => e.exam_type_id === selectedExamId)?.exam_type}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExamId(null)}
                  className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X size={16} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                        <th className="px-8 py-4">Subject Code</th>
                        <th className="px-8 py-4">Description</th>
                        <th className="px-8 py-4 text-center">Score</th>
                        <th className="px-8 py-4 text-center">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {marks.filter(m => m.exam_type_id === selectedExamId).map((mark, idx) => (
                        <tr key={idx} className="hover:bg-secondary/40 transition-colors group">
                          <td className="px-8 py-4 font-mono text-xs font-bold text-primary">{mark.subject_code}</td>
                          <td className="px-8 py-4 font-medium text-foreground">{mark.subject_name}</td>
                          <td className="px-8 py-4 text-center font-black">{mark.marks}</td>
                          <td className="px-8 py-4 text-center">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest",
                              mark.marks >= 40
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                            )}>
                              {mark.marks >= 40 ? 'PASS' : 'FAIL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-muted/20 border-t border-border/30 flex justify-end">
                  <Button
                    onClick={handlePrintPDF}
                    disabled={exporting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl px-6 font-bold"
                  >
                    {exporting ? (
                      'Generating...'
                    ) : (
                      <>
                        <FileText size={18} />
                        Export Academic Certificate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Modal */}
          <Dialog open={!!previewExamId} onOpenChange={(open) => { if (!open) setPreviewExamId(null) }}>
            <DialogContent className="max-w-4xl p-0 border-none bg-background shadow-2xl overflow-hidden rounded-2xl">
              <div className="bg-primary p-6 text-primary-foreground flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold">Marksheet Preview</DialogTitle>
                  <p className="text-primary-foreground/70 text-sm mt-1">{previewExamType} Examination</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewExamId(null)}
                  className="text-primary-foreground hover:bg-white/10"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="p-8 space-y-8">
                <div
                  dangerouslySetInnerHTML={{ __html: previewExamId ? getMarksheetHTML(previewExamId, previewExamType) : '' }}
                  className="bg-white border border-border/50 rounded-xl p-8 max-h-[50vh] overflow-y-auto shadow-inner"
                />

                <div className="flex gap-4 justify-end">
                  <Button
                    onClick={() => setPreviewExamId(null)}
                    variant="ghost"
                    className="font-semibold text-muted-foreground px-6"
                  >
                    Close Preview
                  </Button>
                  <Button
                    onClick={handleExportFromPreview}
                    disabled={exporting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8 rounded-xl font-bold shadow-lg"
                  >
                    {exporting ? 'Generating...' : (
                      <>
                        <FileText size={18} />
                        Download PDF Certificate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Chatbot Integration */}
          {showChatbot && (
            <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
              <div className="shadow-2xl rounded-2xl overflow-hidden border border-border bg-card">
                <Chatbot initiallyOpen={true} onClose={() => setShowChatbot(false)} />
              </div>
            </div>
          )}

        </>
      )}
    </DashboardLayout>
  )
}
