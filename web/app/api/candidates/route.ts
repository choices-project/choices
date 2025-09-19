import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'Candidates API temporarily disabled' },
    { status: 503 }
  )
}