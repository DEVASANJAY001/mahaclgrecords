'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { formatDOB } from '@/lib/date-utils'
import DashboardLayout from '@/components/dashboard-layout'
import { Skeleton } from '@/components/ui/skeleton'
import { LayoutDashboard, Users, PlusCircle, ListOrdered, Download, ChevronLeft, FileText, UserCircle } from 'lucide-react'

const navItems = [
  { label: 'Overview', href: '/faculty/dashboard', icon: LayoutDashboard },
  { label: 'Manage Students', href: '/faculty/manage-students', icon: Users },
  { label: 'Add Marks', href: '/faculty/add-marks', icon: PlusCircle },
  { label: 'Marks List', href: '/faculty/marks-list', icon: ListOrdered },
]

interface StudentData {
  roll_number: string
  name: string
  date_of_birth: string
  department_name: string
}

interface MarkRecord {
  subject_name: string
  subject_code: string
  exam_type: string
  marks: number
}

export default function MarksheetPreview() {
  const params = useParams()
  const studentId = params.studentId as string
  const [student, setStudent] = useState<StudentData | null>(null)
  const [marks, setMarks] = useState<MarkRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const facultyId = localStorage.getItem('faculty_id')

        if (!facultyId) {
          router.push('/faculty/login')
          return
        }

        // Load student data
        const { data: studentData } = await supabase
          .from('students')
          .select('*, departments(name)')
          .eq('id', studentId)
          .single()

        if (!studentData) {
          router.push('/faculty/marks-list')
          return
        }

        const formattedStudent = {
          roll_number: studentData.roll_number,
          name: studentData.name,
          date_of_birth: studentData.date_of_birth,
          department_name: studentData.departments?.name || 'Unknown',
        }

        setStudent(formattedStudent)

        // Load marks
        const { data: marksData } = await supabase
          .from('marks')
          .select('*, subjects(name, code), exam_types(name)')
          .eq('student_id', studentId)

        const formattedMarks = (marksData || []).map((m: any) => ({
          subject_name: m.subjects?.name || 'Unknown',
          subject_code: m.subjects?.code || 'N/A',
          exam_type: m.exam_types?.name || 'Unknown',
          marks: m.marks_obtained,
        }))

        setMarks(formattedMarks)
        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }

    loadData()
  }, [studentId])

  const handlePrintPDF = async () => {
    setExporting(true)
    try {
      // Dynamic import html2pdf
      const html2pdf = (await import('html2pdf.js')).default

      const element = printRef.current
      if (!element) return

      const opt = {
        margin: 10,
        filename: `marksheet_${student?.roll_number}_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm' as const, format: 'a4' as const },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      // PDF export error
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Card className="border-none shadow-premium h-[800px] w-full rounded-2xl" />
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout
        navItems={navItems}
        userName="Faculty"
        userRole="Administrator"
        onLogout={handleLogout}
      >
        <LoadingSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      navItems={navItems}
      userName="Faculty"
      userRole="Administrator"
      onLogout={handleLogout}
    >
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/faculty/marks-list">
              <Button variant="outline" className="gap-2 border-border/50 rounded-xl hover:bg-secondary transition-all">
                <ChevronLeft size={18} />
                Back to Directory
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Academic Transcript</h1>
              <p className="text-muted-foreground mt-1">Institutional performance verification and certification.</p>
            </div>
          </div>
          <Button
            onClick={handlePrintPDF}
            disabled={exporting}
            className="gap-2 shadow-premium bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 h-11"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download Official PDF
          </Button>
        </div>

        {/* Marksheet Container */}
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-premium overflow-hidden bg-white text-slate-900">
            <div ref={printRef} className="p-12 relative">
              {/* Subtle watermark or texture could be added here */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 pointer-events-none opacity-50" />

              {/* Institutional Header */}
              <div className="text-center mb-12 border-b-2 border-slate-100 pb-8 relative z-10">
                <div className="mb-6">
                  <img
                    src="/images/maha-logo.png"
                    alt="College Logo"
                    className="h-28 w-auto mx-auto mb-4"
                  />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">MAHALASHMI</h1>
                <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Women's College of Arts and Science</p>
                <p className="text-slate-400 text-xs italic mt-1">(Affiliated to University of Madras)</p>
                <div className="inline-block mt-8 px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.2em]">
                  Official Academic Transcript
                </div>
              </div>

              {/* Identity Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 px-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</p>
                  <p className="font-bold text-slate-900 text-lg leading-tight">{student?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</p>
                  <p className="font-bold text-slate-700 text-lg leading-tight">{student?.roll_number}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                  <p className="font-bold text-slate-700 text-lg leading-tight">{student?.department_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
                  <p className="font-bold text-slate-700 text-lg leading-tight">{formatDOB(student?.date_of_birth || '')}</p>
                </div>
              </div>

              {/* Performance Data */}
              <div className="mb-12">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  Academic achievement
                </h3>
                <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-6 py-4 text-left border-b border-slate-100">Subject Code</th>
                        <th className="px-6 py-4 text-left border-b border-slate-100">Description</th>
                        <th className="px-6 py-4 text-left border-b border-slate-100">Examination</th>
                        <th className="px-6 py-4 text-center border-b border-slate-100">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {marks.length > 0 ? (
                        marks.map((mark, idx) => (
                          <tr key={idx} className="text-sm">
                            <td className="px-6 py-4 font-mono font-bold text-slate-400">{mark.subject_code}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{mark.subject_name}</td>
                            <td className="px-6 py-4 text-slate-500 font-medium">{mark.exam_type}</td>
                            <td className="px-6 py-4 text-center font-black text-lg">{mark.marks}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                            No academic records identified for the current period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Certification Footer */}
              <div className="border-t-2 border-slate-50 pt-10 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center items-end">
                  <div className="space-y-1">
                    <div className="h-16 flex items-center justify-center">
                      {/* Image placeholder for actual signature */}
                    </div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] pt-4 border-t border-slate-100">Institutional Principal</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Mahalashmi Women's College</p>
                  </div>
                  <div className="pb-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase">
                      Issue Date: {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="w-12 h-1 bg-slate-100 mx-auto mt-2 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-16 flex items-center justify-center">
                      <UserCircle size={48} strokeWidth={1} className="text-slate-100" />
                    </div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] pt-4 border-t border-slate-100">Authorized Faculty</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Certified on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
