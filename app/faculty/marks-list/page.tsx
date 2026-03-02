'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase'
import DashboardLayout from '@/components/dashboard-layout'
import { cn } from '@/lib/utils'
import {
  Users,
  BookOpen,
  PlusCircle,
  ListOrdered,
  LayoutDashboard,
  Search,
  FileText,
  Download,
  Eye,
  ChevronLeft,
  GraduationCap,
  Calendar,
  Building2
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
}

interface ExamCard {
  exam_type_id: string
  exam_type: string
  subject_count: number
  totalMarks: number
  averageMarks: number
}

interface Mark {
  exam_type_id: string
  exam_type: string
  subject_name: string
  subject_code: string
  marks_obtained: number
}

const loadExamCards = async (studentId: string, supabase: any, setExamCards: any) => {
  try {

    const { data: examData, error: examError } = await supabase
      .from('exam_cards')
      .select('*')
      .eq('student_id', studentId)


    const formattedExams = (examData || []).map((e: any) => ({
      exam_type_id: e.exam_type_id || 'unknown',
      exam_type: e.exam_type || 'Unknown',
      subject_count: e.subject_count || 0,
      totalMarks: e.total_marks || 0,
      averageMarks: e.average_marks || 0,
    }))

    setExamCards(formattedExams)
  } catch (err) {
    // Load error
  }
}

export default function MarksList() {
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [examCards, setExamCards] = useState<ExamCard[]>([])
  const [studentMarks, setStudentMarks] = useState<Mark[]>([])
  const [previewExamId, setPreviewExamId] = useState<string | null>(null)
  const [previewExamType, setPreviewExamType] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)
  const [isStudentsLoading, setIsStudentsLoading] = useState(false)
  const [isExamsLoading, setIsExamsLoading] = useState(false)

  const loadStudentMarksAndExams = async (studentId: string) => {
    setIsExamsLoading(true)
    try {
      const { data: marksData } = await supabase
        .from('marks')
        .select('*, subjects(name, code), exam_types(id, name)')
        .eq('student_id', studentId)

      const formattedMarks = (marksData || []).map((m: any) => ({
        exam_type_id: m.exam_types?.id || 'unknown',
        exam_type: m.exam_types?.name || 'Unknown',
        subject_name: m.subjects?.name || 'Unknown',
        subject_code: m.subjects?.code || 'N/A',
        marks_obtained: m.marks_obtained,
      }))

      setStudentMarks(formattedMarks)

      // Create exam cards grouped by exam type
      const examMap = new Map<string, { exam_type: string; marks: number[] }>()
      formattedMarks.forEach((mark: any) => {
        const key = mark.exam_type_id
        if (!examMap.has(key)) {
          examMap.set(key, { exam_type: mark.exam_type, marks: [] })
        }
        examMap.get(key)!.marks.push(mark.marks_obtained)
      })

      const cards: ExamCard[] = Array.from(examMap.entries()).map(([id, data]) => ({
        exam_type_id: id,
        exam_type: data.exam_type,
        subject_count: data.marks.length,
        totalMarks: data.marks.reduce((a, b) => a + b, 0),
        averageMarks: Math.round((data.marks.reduce((a, b) => a + b, 0) / data.marks.length) * 100) / 100,
      }))

      setExamCards(cards)
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setIsExamsLoading(false)
    }
  }

  const handleExportExam = async (examTypeId: string, examType: string) => {
    setIsExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const examMarks = studentMarks.filter(m => m.exam_type_id === examTypeId)

      const element = document.createElement('div')
      element.id = 'marksheet-to-export'
      element.style.background = 'white'
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
            <img src="/images/maha-logo.png" alt="College Logo" style="height: 80px; margin-bottom: 15px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #1e293b; margin: 10px 0;">MAHALASHMI</h1>
            <p style="color: #475569; margin: 5px 0;">Women's College of Arts and Science</p>
            <p style="color: #475569; font-size: 14px; margin: 5px 0;">(Affiliated to University of Madras)</p>
            <h2 style="font-size: 18px; font-weight: bold; color: #1e293b; margin-top: 15px;">ACADEMIC MARK SHEET - ${examType}</h2>
          </div>

          <div style="margin-bottom: 25px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Roll Number</p>
                <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${selectedStudent?.roll_number}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #64748b; margin: 0;">Name</p>
                <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${selectedStudent?.name}</p>
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
                    <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${mark.marks_obtained}</td>
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
        filename: `${examType}_marksheet_${selectedStudent?.roll_number}_${new Date().getTime()}.pdf`,
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
      setPreviewExamId(null)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getMarksheetHTML = (examTypeId: string, examTypeName: string) => {
    const examMarks = studentMarks.filter(m => m.exam_type_id === examTypeId)

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
              <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${selectedStudent?.roll_number}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #64748b; margin: 0;">Name</p>
              <p style="font-weight: bold; color: #1e293b; margin: 5px 0;">${selectedStudent?.name}</p>
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
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold;">${mark.marks_obtained}</td>
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
        loadDepartments(facultyId)
      } catch (err) {
        router.push('/faculty/login')
      }
    }

    checkAuth()
  }, [])

  const loadDepartments = async (facultyId: string) => {
    try {
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .eq('faculty_id', facultyId)

      setDepartments(deptsData || [])
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDept) {
      loadStudents(selectedDept)
    } else {
      setStudents([])
    }
  }, [selectedDept])

  const loadStudents = async (deptId: string) => {
    setIsStudentsLoading(true)
    try {
      let query = supabase
        .from('students')
        .select('id, roll_number, name')
        .eq('department_id', deptId)

      if (searchTerm) {
        query = query.or(`roll_number.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      }

      const { data: studentsData } = await query

      setStudents(studentsData || [])
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setIsStudentsLoading(false)
    }
  }


  const handleLogout = async () => {
    localStorage.removeItem('faculty_id')
    localStorage.removeItem('faculty_email')
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    loadStudentMarksAndExams(student.id)
  }

  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Card className="border-none shadow-premium h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
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
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Academic Record Directory
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Search for students and manage academic performance records.
              </p>
            </div>
            {!selectedStudent && (
              <div className="flex items-center gap-3">
                <Link href="/faculty/add-marks">
                  <Button className="gap-2 shadow-premium bg-primary hover:bg-primary/90">
                    <PlusCircle size={18} />
                    Add New Marks
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-8">
            {!selectedStudent ? (
              <>
                {/* Search and Filters */}
                <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-visible z-20">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-4 space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Department</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="w-full pl-10 pr-4 h-11 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium appearance-none cursor-pointer"
                          >
                            <option value="">Select Department...</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Student Search</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                          <Input
                            placeholder="Search by name or roll number..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value)
                              if (selectedDept) loadStudents(selectedDept)
                            }}
                            className="pl-10 rounded-xl border-border/50 h-11 bg-background"
                            disabled={!selectedDept}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-3">
                        <Button
                          onClick={() => {
                            setSearchTerm('')
                            setSelectedDept('')
                          }}
                          variant="outline"
                          className="w-full h-11 rounded-xl border-border/50 bg-background hover:bg-secondary transition-all"
                        >
                          Clear Search
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Student Grid */}
                {selectedDept ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isStudentsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <Skeleton key={i} className="h-40 w-full rounded-2xl bg-card/30" />
                        ))}
                      </div>
                    ) : students.map((student) => (
                      <Card
                        key={student.id}
                        className="group border-none shadow-premium hover:shadow-2xl transition-all cursor-pointer bg-card/50 backdrop-blur-sm overflow-hidden relative"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                                {student.name.charAt(0)}
                              </div>
                              <div className="space-y-1">
                                <p className="font-black text-foreground">{student.name}</p>
                                <p className="text-xs font-black text-primary uppercase tracking-tighter">{student.roll_number}</p>
                              </div>
                            </div>
                            <div className="p-2 rounded-full bg-secondary text-secondary-foreground">
                              <Eye size={16} />
                            </div>
                          </div>
                          <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                              <FileText size={14} className="text-primary" />
                              <span>View Academic Profile</span>
                            </div>
                            <ChevronLeft size={16} className="text-muted-foreground rotate-180" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {!isStudentsLoading && students.length === 0 && (
                      <div className="col-span-full py-24 text-center space-y-4 opacity-50">
                        <Users size={64} strokeWidth={1} className="mx-auto" />
                        <div className="space-y-1">
                          <p className="font-bold text-xl uppercase tracking-widest">No Students Found</p>
                          <p className="text-muted-foreground">Adjust your search or select a different department.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-24 text-center space-y-4 opacity-30">
                    <Building2 size={80} strokeWidth={1} className="mx-auto" />
                    <p className="text-xl font-bold uppercase tracking-widest">Select a Department to Begin</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Student Header Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-primary text-primary-foreground shadow-premium relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-black">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black">{selectedStudent.name}</h2>
                      <div className="flex items-center gap-4 text-primary-foreground/80 font-bold">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-white/10">
                          <GraduationCap size={14} />
                          {selectedStudent.roll_number}
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs uppercase tracking-widest border border-white/10">
                          <Calendar size={14} />
                          Academic Performance
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedStudent(null)}
                    variant="ghost"
                    className="mt-6 md:mt-0 bg-white/10 hover:bg-white/20 text-white gap-2 rounded-xl backdrop-blur-md"
                  >
                    <ChevronLeft size={18} />
                    Back to Search
                  </Button>
                </div>

                {/* Exam Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isExamsLoading ? (
                    [1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-64 w-full rounded-3xl bg-card/30" />
                    ))
                  ) : examCards.map((exam) => (
                    <Card
                      key={exam.exam_type_id}
                      className="group border-none shadow-premium hover:shadow-2xl transition-all bg-card/50 backdrop-blur-sm overflow-hidden"
                    >
                      <div className="h-1.5 w-full bg-primary" />
                      <CardContent className="pt-6">
                        <div className="space-y-6">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Examination Type</p>
                              <p className="text-xl font-black group-hover:text-primary transition-colors">{exam.exam_type}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                              <FileText size={18} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Marks</p>
                              <p className="text-2xl font-black text-primary">{exam.totalMarks}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-background/50 border border-border/50">
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Average</p>
                              <p className="text-2xl font-black text-emerald-500">{exam.averageMarks}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4">
                            <PlusCircle size={14} className="text-primary" />
                            Based on {exam.subject_count} Subjects
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                            <Button
                              onClick={() => {
                                setPreviewExamId(exam.exam_type_id)
                                setPreviewExamType(exam.exam_type)
                              }}
                              variant="secondary"
                              className="rounded-xl font-bold gap-2"
                            >
                              <Eye size={16} />
                              Preview
                            </Button>
                            <Button
                              onClick={() => handleExportExam(exam.exam_type_id, exam.exam_type)}
                              disabled={isExporting}
                              className="rounded-xl font-bold shadow-premium gap-2"
                            >
                              {isExporting ? (
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download size={16} />
                              )}
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!isExamsLoading && examCards.length === 0 && (
                    <div className="col-span-full py-24 text-center space-y-4 opacity-50 bg-card/50 backdrop-blur-sm rounded-3xl border border-dashed border-border">
                      <FileText size={64} strokeWidth={1} className="mx-auto" />
                      <div className="space-y-1">
                        <p className="font-bold text-xl uppercase tracking-widest">No Records Found</p>
                        <p className="text-muted-foreground">This student doesn't have any marks recorded yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modern Preview Modal */}
          <Dialog open={!!previewExamId} onOpenChange={(open) => { if (!open) setPreviewExamId(null) }}>
            <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 border-none bg-secondary overflow-hidden rounded-3xl">
              <DialogHeader className="p-6 bg-background border-b border-border/50 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary relative">
                    <FileText size={20} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-black">{previewExamType}</DialogTitle>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedStudent?.name}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8 bg-muted-foreground/5 scrollbar-hide">
                <div className="max-w-3xl mx-auto shadow-premium rounded-2xl overflow-hidden bg-white">
                  <div
                    dangerouslySetInnerHTML={{ __html: previewExamId ? getMarksheetHTML(previewExamId, previewExamType) : '' }}
                    className="bg-white p-6"
                  />
                </div>
              </div>

              <div className="p-6 bg-background border-t border-border/50 flex gap-4 justify-between items-center">
                <p className="text-xs font-bold text-muted-foreground max-w-[300px]">
                  This is a digital preview. The exported PDF will include high-definition assets and institutional watermarks.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setPreviewExamId(null)}
                    variant="outline"
                    className="rounded-xl px-6 h-11 border-border/50 font-bold"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      if (previewExamId) {
                        handleExportExam(previewExamId, previewExamType)
                      }
                    }}
                    disabled={isExporting}
                    className="rounded-xl px-8 h-11 shadow-premium font-bold gap-2"
                  >
                    {isExporting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    Download PDF
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </DashboardLayout>
  )
}
