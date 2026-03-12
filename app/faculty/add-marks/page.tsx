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

interface Faculty {
  id: string
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
        console.error('Auth error:', err)
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
      console.error('Load error:', err)
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
      console.error('Load error:', err)
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
              <Link href="/faculty/manage-students">
                <Button variant="outline" className="text-purple-600 bg-transparent">
                  ← Back
                </Button>
              </Link>
              <div>
                <h1 className="font-bold text-slate-900">Add Marks</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 animate-pulse">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Enter Marks for Multiple Subjects</CardTitle>
            <CardDescription>Select exam type and add marks for all subjects in one go</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAllMarks} className="space-y-6">
              {/* Department Selection */}
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
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDept && (
                <>
                  {/* Student Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Student
                    </label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">-- Select Student --</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.roll_number} - {student.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Student DOB Display */}
                  {selectedStudentDob && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-slate-700">
                        <span className="font-medium">Student DOB:</span> {formatDOB(selectedStudentDob)}
                      </p>
                    </div>
                  )}

                  {/* Exam Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Exam Type
                    </label>
                    <select
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">-- Select Exam Type --</option>
                      {examTypes.map((examType) => (
                        <option key={examType.id} value={examType.id}>
                          {examType.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subjects Marks Entry */}
                  {selectedExamType && (
                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Add Subject Marks</h3>
                        <Input
                          type="text"
                          placeholder="Search subjects by name or code..."
                          value={subjectSearch}
                          onChange={(e) => setSubjectSearch(e.target.value)}
                          className="mb-4"
                        />
                      </div>
                      <div className="space-y-3">
                        {subjects
                          .filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.code.toLowerCase().includes(subjectSearch.toLowerCase()))
                          .map((subject) => {
                            const isAdded = subjectMarksEntries.find(e => e.subject_id === subject.id)
                            const marksValue = currentSubjectMarks[subject.id] || ''
                            
                            return (
                              <div key={subject.id} className={`flex gap-2 items-end p-3 rounded-md transition ${isAdded ? 'bg-green-100' : 'bg-white border border-slate-200'}`}>
                                <div className="flex-1">
                                  <label className="text-xs font-medium text-slate-600">
                                    {subject.code} - {subject.name}
                                  </label>
                                  <div className="flex gap-2 mt-1">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={marksValue}
                                      onChange={(e) => setCurrentSubjectMarks({ ...currentSubjectMarks, [subject.id]: e.target.value })}
                                      placeholder="Enter marks (0-100)"
                                      disabled={isAdded}
                                      className={isAdded ? 'bg-green-50 cursor-not-allowed' : ''}
                                    />
                                    <Button
                                      type="button"
                                      onClick={() => handleAddSubjectMarks(subject.id)}
                                      disabled={isAdded || marksLoading}
                                      className={isAdded ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                                      size="sm"
                                    >
                                      {isAdded ? '✓ Added' : '+ Add'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        {subjects.filter(s => s.name.toLowerCase().includes(subjectSearch.toLowerCase()) || s.code.toLowerCase().includes(subjectSearch.toLowerCase())).length === 0 && (
                          <p className="text-center text-slate-500 text-sm py-4">No subjects found matching your search</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Summary of Added Subjects */}
              {subjectMarksEntries.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Added Subjects ({subjectMarksEntries.length})
                  </h3>
                  <div className="space-y-2">
                    {subjectMarksEntries.map((entry) => (
                      <div key={entry.subject_id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {entry.subject_code} - {entry.subject_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-green-700">{entry.marks_obtained}</span>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={entry.marks_obtained}
                              onChange={(e) => handleUpdateMarks(entry.subject_id, parseFloat(e.target.value) || 0)}
                              className="w-20 h-8"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => handleRemoveSubject(entry.subject_id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button 
                  type="submit"
                  disabled={marksLoading || subjectMarksEntries.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {marksLoading ? 'Submitting...' : `Submit Marks for ${subjectMarksEntries.length} Subjects`}
                </Button>
                {subjectMarksEntries.length > 0 && (
                  <Button
                    type="button"
                    onClick={() => {
                      setSubjectMarksEntries([])
                      setCurrentSubjectMarks({})
                      setSelectedStudent('')
                      setSelectedStudentDob('')
                    }}
                    variant="outline"
                    className="border-red-300 text-red-600"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Link href="/faculty/marks-list">
            <Button variant="outline" className="border-purple-600 text-purple-600 bg-transparent">
              View Marks List & Generate Marksheets
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
