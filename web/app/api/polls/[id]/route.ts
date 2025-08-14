import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id
    
    // Fetch poll data from the PO service
    const response = await fetch(`http://localhost:8082/api/v1/polls/get?id=${pollId}`)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }
    
    const pollData = await response.json()
    
    // Return the poll data
    return NextResponse.json(pollData)
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll data' },
      { status: 500 }
    )
  }
}
