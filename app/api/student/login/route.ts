import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { roll_number, dob } = await request.json()

  if (!roll_number || !dob) {
    return NextResponse.json(
      { error: 'Roll number and date of birth are required' },
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

  // Get student by roll number
  const { data: studentArray, error: fetchError } = await supabase
    .from('students')
    .select('*')
    .eq('roll_number', roll_number)

  if (fetchError || !studentArray || studentArray.length === 0) {
    return NextResponse.json(
      { error: 'Invalid roll number' },
      { status: 401 }
    )
  }

  const student = studentArray[0]

  // Verify DOB matches
  if (student.date_of_birth !== dob) {
    return NextResponse.json(
      { error: 'Date of birth does not match our records' },
      { status: 401 }
    )
  }

  // Set session
  const response = NextResponse.json(
    { message: 'Login successful', student: { id: student.id, name: student.name, roll_number: student.roll_number } },
    { status: 200 }
  )

  response.cookies.set('student_id', student.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
