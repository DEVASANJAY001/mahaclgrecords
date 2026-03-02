import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { email, password, confirmPassword, facultyId } = await request.json()

  // Validation
  if (!email || !password || !confirmPassword || !facultyId) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    )
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: 'Passwords do not match' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
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

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Insert faculty
  const { data, error } = await supabase
    .from('faculty')
    .insert([
      {
        email,
        password_hash: hashedPassword,
        faculty_id: facultyId,
        name: email.split('@')[0],
      },
    ])
    .select()

  if (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to create account' },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { message: 'Faculty account created successfully', data },
    { status: 201 }
  )
}
