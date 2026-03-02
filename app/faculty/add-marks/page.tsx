'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { formatDOB } from '@/lib/date-utils'
import DashboardLayout from '@/components/dashboard-layout'
import { cn } from '@/lib/utils'
import {
  Users,
  BookOpen,
  PlusCircle,
  ListOrdered,
  LayoutDashboard,
  GraduationCap,
  Save,
  Eraser,
  Search,
  CheckCircle2,
  AlertCircle,
  Trash2
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

interface Subject {
  id: string
  name: string
  code: string
}

interface Student {
  id: string
  roll_number: string
  name: string
  department_id: string
  date_of_birth: string
}

interface ExamType {
  id: string
  name: string
}

interface SubjectMarksEntry {
  subject_id: string
  subject_code: string
  subject_name: string
  marks_obtained: number
}

export default function AddMarks() {
  const [faculty, setFaculty] = useState<Faculty | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedStudentDob, setSelectedStudentDob] = useState('')
  const [selectedExamType, setSelectedExamType] = useState('')
  const [marksLoading, setMarksLoading] = useState(false)
  const [subjectMarksEntries, setSubjectMarksEntries] = useState<SubjectMarksEntry[]>([])
  const [currentSubjectMarks, setCurrentSubjectMarks] = useState<{ [key: string]: string }>({})
  const [subjectSearch, setSubjectSearch] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
        loadInitialData(facultyId)
      } catch (err) {
        router.push('/faculty/login')
      }
    }

    checkAuth()
  }, [])

  const loadInitialData = async (facultyId: string) => {
    try {
      const { data: deptsData } = await supabase
        .from('departments')
        .select('*')
        .eq('faculty_id', facultyId)

      setDepartments(deptsData || [])

      const { data: examTypesData } = await supabase
        .from('exam_types')
        .select('*')

      setExamTypes(examTypesData || [])

      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDept) {
      loadSubjectsAndStudents(selectedDept)
    }
  }, [selectedDept])

  const handleStudentSelect = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    setSelectedStudent(studentId)
    setSelectedStudentDob(student?.date_of_birth || '')
  }

  const loadSubjectsAndStudents = async (deptId: string) => {
    try {
      const { data: subjsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('department_id', deptId)

      setSubjects(subjsData || [])

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('department_id', deptId)

      setStudents(studentsData || [])
    } catch (err) {
      // Load error
    }
  }

  const handleAddSubjectMarks = (subjectId: string) => {
    const marksValue = parseFloat(currentSubjectMarks[subjectId] || '')

    if (isNaN(marksValue)) {
      setError('Please enter valid marks')
      return
    }

    if (marksValue < 0 || marksValue > 100) {
      setError('Marks must be between 0 and 100')
      return
    }

    // Check if subject already added
    if (subjectMarksEntries.find(e => e.subject_id === subjectId)) {
      setError('This subject marks are already added. Edit or remove first.')
      return
    }

    const subject = subjects.find(s => s.id === subjectId)
    if (!subject) return

    setSubjectMarksEntries([...subjectMarksEntries, {
      subject_id: subjectId,
      subject_code: subject.code,
      subject_name: subject.name,
      marks_obtained: marksValue
    }])

    setCurrentSubjectMarks({ ...currentSubjectMarks, [subjectId]: '' })
    setError('')
  }

  const handleRemoveSubject = (subjectId: string) => {
    setSubjectMarksEntries(subjectMarksEntries.filter(e => e.subject_id !== subjectId))
  }

  const handleUpdateMarks = (subjectId: string, newMarks: number) => {
    setSubjectMarksEntries(subjectMarksEntries.map(e =>
      e.subject_id === subjectId ? { ...e, marks_obtained: newMarks } : e
    ))
  }

  const handleSubmitAllMarks = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedStudent || !selectedExamType || subjectMarksEntries.length === 0) {
      setError('Please select student, exam type, and add at least one subject mark')
      return
    }

    setMarksLoading(true)
    setError('')

    try {
      // Prepare all marks entries
      const marksToInsert = subjectMarksEntries.map(entry => ({
        student_id: selectedStudent,
        subject_id: entry.subject_id,
        exam_type_id: selectedExamType,
        marks_obtained: entry.marks_obtained,
      }))

      // Bulk insert all marks
      const { error: insertError } = await supabase
        .from('marks')
        .insert(marksToInsert)

      if (insertError) throw insertError

      setError('')
      setSuccessMessage(`✓ Successfully entered marks for ${subjectMarksEntries.length} subjects`)
      setSubjectMarksEntries([])
      setCurrentSubjectMarks({})
      setSelectedStudent('')
      setSelectedStudentDob('')
      setSelectedExamType('')
      setSelectedDept('')
      setSubjectSearch('')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError('Failed to add marks: ' + err.message)
    } finally {
      setMarksLoading(false)
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
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-8">
          <Skeleton className="h-[600px] w-full rounded-2xl" />
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
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Academic Mark Entry
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Record student performance for various examinations and subjects.
              </p>
            </div>
            <Link href="/faculty/marks-list">
              <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                <ListOrdered size={18} />
                View Marks Records
              </Button>
            </Link>
          </div>

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-6 py-4 rounded-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
              <CheckCircle2 size={20} />
              <p className="font-bold">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-6 py-4 rounded-2xl animate-in fade-in slide-in-from-top-4 flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Selection Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                <CardHeader>
                  <CardTitle className="text-lg">Entry Configuration</CardTitle>
                  <CardDescription>Select the target group and exam type.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Department</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full px-4 h-11 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium appearance-none cursor-pointer"
                      required
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedDept && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Student</label>
                        <select
                          value={selectedStudent}
                          onChange={(e) => handleStudentSelect(e.target.value)}
                          className="w-full px-4 h-11 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Select Student...</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.roll_number} - {student.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedStudentDob && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2 text-primary text-xs font-bold">
                          <GraduationCap size={14} />
                          ID confirmed via DOB: {formatDOB(selectedStudentDob)}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Examination</label>
                        <select
                          value={selectedExamType}
                          onChange={(e) => setSelectedExamType(e.target.value)}
                          className="w-full px-4 h-11 bg-background border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium appearance-none cursor-pointer"
                          required
                        >
                          <option value="">Select Exam Type...</option>
                          {examTypes.map((examType) => (
                            <option key={examType.id} value={examType.id}>{examType.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {subjectMarksEntries.length > 0 && (
                <Card className="border-none shadow-premium bg-primary text-primary-foreground overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      Batch Summary
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-black uppercase">Draft</span>
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/70">
                      Ready to commit {subjectMarksEntries.length} records.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {subjectMarksEntries.map(entry => (
                        <div key={entry.subject_id} className="flex justify-between items-center text-sm py-1 border-b border-primary-foreground/10">
                          <span className="truncate max-w-[150px]">{entry.subject_name}</span>
                          <span className="font-black">{entry.marks_obtained}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleSubmitAllMarks}
                      disabled={marksLoading}
                      className="w-full bg-white text-primary hover:bg-white/90 font-bold shadow-lg"
                    >
                      {marksLoading ? "Processing..." : "Commit All Marks"}
                    </Button>
                    <Button
                      onClick={() => {
                        setSubjectMarksEntries([])
                        setCurrentSubjectMarks({})
                      }}
                      variant="ghost"
                      className="w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 text-xs gap-2"
                    >
                      <Eraser size={14} />
                      Clear Entire Batch
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8">
              {!selectedExamType ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-50">
                  <BookOpen size={64} strokeWidth={1} />
                  <div className="space-y-1">
                    <p className="font-bold text-xl">Waiting for Selection</p>
                    <p className="text-muted-foreground">Select a department, student and exam type to start entering marks.</p>
                  </div>
                </div>
              ) : (
                <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 border-b border-border/50">
                    <div>
                      <CardTitle className="text-xl">Subject-wise Assessment</CardTitle>
                      <CardDescription>Enter marks (0-100) for each available subject.</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        placeholder="Filter subjects..."
                        value={subjectSearch}
                        onChange={(e) => setSubjectSearch(e.target.value)}
                        className="pl-9 h-9 w-[200px] text-sm bg-background border-border/50 rounded-lg"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {subjects
                        .filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.code.toLowerCase().includes(subjectSearch.toLowerCase()))
                        .map((subject) => {
                          const entry = subjectMarksEntries.find(e => e.subject_id === subject.id)
                          const isAdded = !!entry
                          const marksValue = currentSubjectMarks[subject.id] || ''

                          return (
                            <div
                              key={subject.id}
                              className={cn(
                                "p-4 rounded-2xl border transition-all flex flex-col gap-3 group",
                                isAdded
                                  ? "bg-emerald-500/5 border-emerald-500/20"
                                  : "bg-background border-border/50 hover:border-primary/50"
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{subject.code}</p>
                                  <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{subject.name}</p>
                                </div>
                                {isAdded && <CheckCircle2 className="text-emerald-500" size={16} />}
                              </div>

                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={isAdded ? entry.marks_obtained : marksValue}
                                    onChange={(e) => {
                                      if (isAdded) {
                                        handleUpdateMarks(subject.id, parseFloat(e.target.value) || 0)
                                      } else {
                                        setCurrentSubjectMarks({ ...currentSubjectMarks, [subject.id]: e.target.value })
                                      }
                                    }}
                                    placeholder="Score"
                                    className="h-10 rounded-xl bg-background/50 border-border/50"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase tracking-tighter">/ 100</span>
                                </div>
                                {!isAdded ? (
                                  <Button
                                    size="icon"
                                    onClick={() => handleAddSubjectMarks(subject.id)}
                                    className="h-10 w-10 shrink-0 rounded-xl"
                                  >
                                    <PlusCircle size={20} />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleRemoveSubject(subject.id)}
                                    className="h-10 w-10 shrink-0 rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5"
                                  >
                                    <Trash2 size={20} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                    {subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.code.toLowerCase().includes(subjectSearch.toLowerCase())).length === 0 && (
                      <div className="py-24 text-center opacity-30 flex flex-col items-center gap-2">
                        <Search size={48} />
                        <p className="font-bold">No matching subjects</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
