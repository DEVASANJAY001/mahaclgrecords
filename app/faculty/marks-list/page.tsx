'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase'

interface Faculty {
  id: string
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
    console.log('[v0] Loading exams for student:', studentId)
    
    const { data: examData, error: examError } = await supabase
      .from('exam_cards')
      .select('*')
      .eq('student_id', studentId)

    console.log('[v0] Exams fetch result:', { examData, examError })

    const formattedExams = (examData || []).map((e: any) => ({
      exam_type_id: e.exam_type_id || 'unknown',
      exam_type: e.exam_type || 'Unknown',
      subject_count: e.subject_count || 0,
      totalMarks: e.total_marks || 0,
      averageMarks: e.average_marks || 0,
    }))

    setExamCards(formattedExams)
  } catch (err) {
    console.error('[v0] Load error:', err)
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

  const loadStudentMarksAndExams = async (studentId: string) => {
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
      formattedMarks.forEach(mark => {
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
    }
  }

  const handleExportExam = async (examTypeId: string, examType: string) => {
    setIsExporting(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const examMarks = studentMarks.filter(m => m.exam_type_id === examTypeId)

      const element = document.createElement('div')
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
        console.error('Auth error:', err)
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
      console.error('Load error:', err)
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
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
    loadStudentMarksAndExams(student.id)
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
              <Link href="/faculty/add-marks">
                <Button variant="outline" className="text-purple-600 bg-transparent">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-slate-900">Marks List & Marksheets</h1>
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
        <Card>
          <CardHeader>
            <CardTitle>Search Student for Marksheet</CardTitle>
            <CardDescription>Select a department and search for student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDept && (
              <Input
                type="text"
                placeholder="Search by roll number or name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (e.target.value) {
                    loadStudents(selectedDept)
                  } else {
                    loadStudents(selectedDept)
                  }
                }}
              />
            )}
          </CardContent>
        </Card>

        {selectedDept && !selectedStudent && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Students</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((student) => (
                <Card key={student.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleStudentSelect(student)}>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Roll Number</p>
                        <p className="font-semibold text-slate-900">{student.roll_number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Name</p>
                        <p className="font-semibold text-slate-900">{student.name}</p>
                      </div>
                      <p className="text-xs text-slate-400 mt-4">Click to view exam details</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {students.length === 0 && selectedDept && (
                <p className="text-slate-600 col-span-full">No students found.</p>
              )}
            </div>
          </div>
        )}

        {selectedStudent && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedStudent.name} ({selectedStudent.roll_number}) - Exams
                </h3>
              </div>
              <Button 
                onClick={() => setSelectedStudent(null)}
                variant="outline"
                className="bg-transparent text-slate-600"
              >
                ← Back
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examCards.map((exam) => (
                <Card key={exam.exam_type_id} className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-600">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-600">{exam.exam_type}</p>
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
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <Button 
                          onClick={() => {
                            setPreviewExamId(exam.exam_type_id)
                            setPreviewExamType(exam.exam_type)
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-sm text-white"
                        >
                          Preview
                        </Button>
                        <Button 
                          onClick={() => handleExportExam(exam.exam_type_id, exam.exam_type)}
                          disabled={isExporting}
                          className="w-full bg-green-600 hover:bg-green-700 text-sm text-white"
                        >
                          {isExporting ? 'Exporting...' : 'Export PDF'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {examCards.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-slate-600">No marks recorded for this student.</p>
                </CardContent>
              </Card>
            )}
          </div>
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
            <div 
              dangerouslySetInnerHTML={{ __html: previewExamId ? getMarksheetHTML(previewExamId, previewExamType) : '' }}
              className="bg-white border border-slate-200 rounded-lg p-6 max-h-[60vh] overflow-y-auto"
            />
            
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
                onClick={() => {
                  if (previewExamId) {
                    handleExportExam(previewExamId, previewExamType)
                  }
                }}
                disabled={isExporting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isExporting ? 'Exporting...' : 'Download as PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
