import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const rollNumber = request.nextUrl.searchParams.get('roll_number')
  const deptId = request.nextUrl.searchParams.get('dept_id')
  const searchQuery = request.nextUrl.searchParams.get('search')

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

  let query = supabase.from('students').select('*, departments(name)')

  if (rollNumber) {
    query = query.eq('roll_number', rollNumber)
  }

  if (deptId) {
    query = query.eq('department_id', deptId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Filter by search query on client side (matches roll number or name)
  if (searchQuery) {
    const filtered = (data || []).filter((student: any) =>
      student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return NextResponse.json(filtered)
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const { name, roll_number, department_id, dob } = await request.json()

  if (!name || !roll_number || !department_id || !dob) {
    return NextResponse.json(
      { error: 'Name, roll number, department, and DOB are required' },
      { status: 400 }
    )
  }

  // Validate DOB is in YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob.toString())) {
    return NextResponse.json(
      { error: 'Invalid DOB format. Please select a valid date.' },
      { status: 400 }
    )
  }

  // Parse ISO date format (YYYY-MM-DD)
  const dobDate = new Date(dob)
  if (isNaN(dobDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date selected.' },
      { status: 400 }
    )
  }

  // Validate date is not in the future
  if (dobDate > new Date()) {
    return NextResponse.json(
      { error: 'Date of birth cannot be in the future.' },
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
    .from('students')
    .insert([
      {
        name,
        roll_number,
        department_id,
        date_of_birth: dob,
      },
    ])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ...data[0], success: true }, { status: 201 })
}
