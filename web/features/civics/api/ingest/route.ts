/**
 * Civics Data Ingest API
 * 
 * API endpoints for managing the civics data ingestion pipeline
 * Enhanced for the next development phase
 */

import { NextRequest, NextResponse } from 'next/server';
import { civicsIngestPipeline } from '../../ingest/pipeline';

/**
 * GET /api/civics/ingest
 * Get ingest pipeline status and available sources
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source = searchParams.get('source');
    const statusId = searchParams.get('statusId');

    if (statusId) {
      // Get specific ingest status
      const status = civicsIngestPipeline.getIngestStatus(statusId);
      if (!status) {
        return NextResponse.json(
          { error: 'Ingest status not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ status });
    }

    if (source) {
      // Get quality metrics for specific source
      const metrics = civicsIngestPipeline.getQualityMetrics(source);
      if (!metrics) {
        return NextResponse.json(
          { error: 'Quality metrics not found for source' },
          { status: 404 }
        );
      }
      return NextResponse.json({ metrics });
    }

    // Get all ingest statuses and available sources
    const statuses = civicsIngestPipeline.getAllIngestStatuses();
    const sources = civicsIngestPipeline.getAvailableSources();

    return NextResponse.json({
      statuses,
      sources,
      pipeline: {
        available: true,
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('Error in civics ingest GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/civics/ingest
 * Start a new ingest process
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, options = {} } = body;

    if (!source) {
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      );
    }

    // Validate source exists
    const availableSources = civicsIngestPipeline.getAvailableSources();
    if (!availableSources.includes(source)) {
      return NextResponse.json(
        { error: `Source '${source}' is not available` },
        { status: 400 }
      );
    }

    // Test connection before starting
    const connectionOk = await civicsIngestPipeline.testConnection(source);
    if (!connectionOk) {
      return NextResponse.json(
        { error: `Connection test failed for source '${source}'` },
        { status: 400 }
      );
    }

    // Start ingest
    const status = await civicsIngestPipeline.startIngest(source, options);

    return NextResponse.json({
      message: 'Ingest started successfully',
      status
    });

  } catch (error) {
    console.error('Error in civics ingest POST:', error);
    return NextResponse.json(
      { error: 'Failed to start ingest process' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/civics/ingest
 * Stop an ingest process
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusId = searchParams.get('statusId');

    if (!statusId) {
      return NextResponse.json(
        { error: 'statusId is required' },
        { status: 400 }
      );
    }

    const stopped = await civicsIngestPipeline.stopIngest(statusId);
    if (!stopped) {
      return NextResponse.json(
        { error: 'Ingest process not found or not running' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Ingest process stopped successfully',
      statusId
    });

  } catch (error) {
    console.error('Error in civics ingest DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to stop ingest process' },
      { status: 500 }
    );
  }
}
