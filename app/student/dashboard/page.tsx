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

        console.log('[v0] Dashboard auth check - Student ID:', studentId)
        console.log('[v0] Dashboard loading state initialized')

        if (!studentId || !studentName) {
          console.log('[v0] No student credentials found, redirecting to login')
          router.push('/student/login')
          return
        }

        console.log('[v0] Fetching student data from database...')

        // Get student details
        const { data: studentArray, error: fetchError } = await supabase
          .from('students')
          .select('*, departments(name)')
          .eq('id', studentId)

        console.log('[v0] Student fetch result:', { studentArray, fetchError })

        if (fetchError) {
          console.error('[v0] Error fetching student:', fetchError)
          setLoading(false)
          return
        }

        if (!studentArray || studentArray.length === 0) {
          console.log('[v0] Student not found in database')
          setLoading(false)
          return
        }

        const studentData = studentArray[0]
        console.log('[v0] Student data:', studentData)

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

        console.log('[v0] Marks fetch result:', { marksData, marksError })

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
        formattedMarks.forEach(mark => {
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
          totalMarks: data.marks.reduce((a, b) => a + b, 0),
          averageMarks: Math.round((data.marks.reduce((a, b) => a + b, 0) / data.marks.length) * 100) / 100,
        }))

        setExamCards(cards)

        // Calculate stats
        if (formattedMarks.length > 0) {
          const totalMarks = formattedMarks.reduce((sum, m) => sum + m.marks, 0)
          const averageMarks = totalMarks / formattedMarks.length
          const highestMark = Math.max(...formattedMarks.map(m => m.marks))
          const subjectsCount = new Set(formattedMarks.map(m => m.subject_code)).size

          setStats({
            totalMarks,
            averageMarks: Math.round(averageMarks * 100) / 100,
            highestMark,
            subjectsCount,
          })
        }

        console.log('[v0] Dashboard data loaded successfully')
        setLoading(false)
      } catch (err) {
        console.error('[v0] Load error:', err)
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
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Error exporting PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('student_id')
    localStorage.removeItem('student_name')
    router.push('/student/login')
  }

  const MarksheetPreview = ({ examTypeId, examTypeName }: { examTypeId: string; examTypeName: string }) => {
    const examMarks = marks.filter(m => m.exam_type_id === examTypeId)
    
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', background: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px' }}>
          <img 
            src="/images/maha-logo.png" 
            alt="College Logo" 
            style={{ height: '80px', marginBottom: '15px' }}
          />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: '10px 0' }}>MAHALASHMI</h1>
          <p style={{ color: '#475569', margin: '5px 0' }}>Women's College of Arts and Science</p>
          <p style={{ color: '#475569', fontSize: '14px', margin: '5px 0' }}>(Affiliated to University of Madras)</p>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginTop: '15px' }}>ACADEMIC MARK SHEET - {examTypeName}</h2>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Roll Number</p>
              <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '5px 0' }}>{student?.roll_number}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Name</p>
              <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '5px 0' }}>{student?.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Department</p>
              <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '5px 0' }}>{student?.department_name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Date of Birth</p>
              <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '5px 0' }}>{formatDOB(student?.dob || '')}</p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>Academic Performance</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Subject Code</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Subject Name</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Marks</th>
              </tr>
            </thead>
            <tbody>
              {examMarks.map((mark, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{mark.subject_code}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>{mark.subject_name}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{mark.marks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '25px', marginTop: '25px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '50px' }}>Principal</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Mahalashmi Women's College</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '50px' }}>Authorized Signature</p>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    )
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
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
          <p className="text-slate-500 text-sm mt-2">Please wait while we fetch your information</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <p className="text-slate-600 font-medium mb-4">Unable to load student data</p>
          <Button onClick={() => router.push('/student/login')}>
            Return to Login
          </Button>
        </div>
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
                <h1 className="font-bold text-slate-900">Student Dashboard</h1>
                <p className="text-xs text-slate-600">{student?.name}</p>
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
        {/* Student Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600">Roll Number</p>
                <p className="font-bold text-slate-900">{student?.roll_number}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-bold text-slate-900">{student?.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Department</p>
                <p className="font-bold text-slate-900">{student?.department_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Date of Birth</p>
                <p className="font-bold text-slate-900">
                  {formatDOB(student?.dob || '')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Total Marks</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalMarks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Average Marks</p>
                <p className="text-3xl font-bold text-blue-600">{stats.averageMarks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Highest Mark</p>
                <p className="text-3xl font-bold text-green-600">{stats.highestMark}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 mb-2">Subjects</p>
                <p className="text-3xl font-bold text-orange-600">{stats.subjectsCount}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Exam Cards Section */}
        {examCards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examCards.map((exam) => (
                <Card 
                  key={exam.exam_type_id}
                  className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-600"
                >
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-slate-600 mb-2">{exam.exam_type}</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500">Total Marks</p>
                        <p className="text-2xl font-bold text-purple-600">{exam.totalMarks}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Average</p>
                          <p className="font-semibold text-blue-600">{exam.averageMarks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Subjects</p>
                          <p className="font-semibold text-orange-600">{exam.subject_count}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <Button 
                        onClick={() => {
                          setPreviewExamId(exam.exam_type_id)
                          setPreviewExamType(exam.exam_type)
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                      >
                        Preview
                      </Button>
                      <Button 
                        onClick={() => setSelectedExamId(exam.exam_type_id)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Exam Details Section */}
        {selectedExamId && (
          <Card className="mb-8 border-l-4 border-l-purple-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {examCards.find(e => e.exam_type_id === selectedExamId)?.exam_type} - Details
                  </CardTitle>
                  <CardDescription>
                    Click on a card above to view other exams
                  </CardDescription>
                </div>
                <Button 
                  onClick={handlePrintPDF}
                  disabled={exporting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {exporting ? 'Exporting...' : '📥 Export as PDF'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">Subject Code</th>
                      <th className="border border-slate-300 px-4 py-2 text-left text-sm font-semibold">Subject Name</th>
                      <th className="border border-slate-300 px-4 py-2 text-center text-sm font-semibold">Marks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks
                      .filter(m => m.exam_type_id === selectedExamId)
                      .map((mark, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-4 py-2">{mark.subject_code}</td>
                          <td className="border border-slate-300 px-4 py-2">{mark.subject_name}</td>
                          <td className="border border-slate-300 px-4 py-2 text-center font-semibold">
                            <span className={`px-3 py-1 rounded ${mark.marks >= 40 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {mark.marks}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}


      </main>

      {/* Preview Modal */}
      <Dialog open={!!previewExamId} onOpenChange={(open) => { if (!open) setPreviewExamId(null) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewExamType} - Marksheet Preview</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Marksheet Preview */}
            {previewExamId && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 max-h-[60vh] overflow-y-auto">
                <MarksheetPreview examTypeId={previewExamId} examTypeName={previewExamType} />
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button 
                onClick={() => setPreviewExamId(null)}
                variant="outline"
                className="bg-transparent"
              >
                Close
              </Button>
              <Button 
                onClick={handleExportFromPreview}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {exporting ? 'Exporting...' : 'Download as PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Chatbot initiallyOpen={showChatbot} onClose={() => setShowChatbot(false)} />
    </div>
  )
}
