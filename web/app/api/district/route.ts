import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    { error: 'District API temporarily disabled' },
    { status: 503 }
  )
}