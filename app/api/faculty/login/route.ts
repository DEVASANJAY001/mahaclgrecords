import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
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

  // Get faculty by email
  const { data: facultyArray, error: fetchError } = await supabase
    .from('faculty')
    .select('*')
    .eq('email', email)

  if (fetchError || !facultyArray || facultyArray.length === 0) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }

  const faculty = facultyArray[0]

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, faculty.password_hash)

  if (!isPasswordValid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }

  // Set session
  const response = NextResponse.json(
    { message: 'Login successful', faculty: { id: faculty.id, email: faculty.email, faculty_id: faculty.faculty_id } },
    { status: 200 }
  )

  response.cookies.set('faculty_id', faculty.id.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
