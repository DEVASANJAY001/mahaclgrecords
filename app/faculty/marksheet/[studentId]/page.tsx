'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { formatDOB } from '@/lib/date-utils'

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
        console.error('Load error:', err)
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
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF export error:', err)
    } finally {
      setExporting(false)
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
              <Link href="/faculty/marks-list">
                <Button variant="outline" className="text-purple-600 bg-transparent">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-slate-900">Marksheet Preview</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handlePrintPDF}
                disabled={exporting}
                className="bg-green-600 hover:bg-green-700"
              >
                {exporting ? 'Exporting...' : '📥 Export PDF'}
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-purple-600 bg-transparent"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marksheet */}
        <div 
          ref={printRef}
          className="bg-white p-8 rounded-lg shadow-lg"
        >
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-slate-300 pb-6">
            <div className="mb-4">
              <img 
                src="/images/maha-logo.png" 
                alt="College Logo" 
                className="h-24 w-auto mx-auto mb-3"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">MAHALASHMI</h1>
            <p className="text-slate-600">Women's College of Arts and Science</p>
            <p className="text-slate-600 text-sm">(Affiliated to University of Madras)</p>
            <h2 className="text-xl font-bold text-slate-900 mt-4">ACADEMIC MARK SHEET</h2>
          </div>

          {/* Student Details */}
          <div className="mb-8">
            <div className="grid grid-cols-2 gap-6">
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
                  {formatDOB(student?.date_of_birth || '')}
                </p>
              </div>
            </div>
          </div>

          {/* Marks Table */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Academic Performance</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border border-slate-400 px-4 py-2 text-left font-semibold">Subject Code</th>
                  <th className="border border-slate-400 px-4 py-2 text-left font-semibold">Subject Name</th>
                  <th className="border border-slate-400 px-4 py-2 text-left font-semibold">Exam Type</th>
                  <th className="border border-slate-400 px-4 py-2 text-center font-semibold">Marks</th>
                </tr>
              </thead>
              <tbody>
                {marks.length > 0 ? (
                  marks.map((mark, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="border border-slate-300 px-4 py-2">{mark.subject_code}</td>
                      <td className="border border-slate-300 px-4 py-2">{mark.subject_name}</td>
                      <td className="border border-slate-300 px-4 py-2">{mark.exam_type}</td>
                      <td className="border border-slate-300 px-4 py-2 text-center font-semibold">
                        {mark.marks}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-slate-300 px-4 py-2 text-center text-slate-600">
                      No marks recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t-2 border-slate-300 pt-6 mt-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-sm text-slate-600 mb-12">Principal</p>
                <p className="text-sm text-slate-600">Mahalashmi Women's College</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-12">Faculty Signature</p>
                <p className="text-sm text-slate-600">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button 
            onClick={handlePrintPDF}
            disabled={exporting}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            {exporting ? 'Exporting...' : '📥 Download as PDF'}
          </Button>
        </div>
      </main>
    </div>
  )
}
