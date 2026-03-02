import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const studentId = request.nextUrl.searchParams.get('student_id')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  let query = supabase
    .from('marks')
    .select(
      `*,
      student:students(*),
      subject:subjects(*),
      exam:exam_types(*)`
    )

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { student_id, subject_id, exam_type_id, marks_obtained, max_marks } = await request.json()

  if (!student_id || !subject_id || !exam_type_id || marks_obtained === undefined) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    )
  }

  if (marks_obtained > 100) {
    return NextResponse.json(
      { error: 'Marks obtained cannot exceed 100' },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase
    .from('marks')
    .insert([
      {
        student_id,
        subject_id,
        exam_type_id,
        marks_obtained,
        max_marks: max_marks || 100,
      },
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data[0], { status: 201 })
}
