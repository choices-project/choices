import type { NextRequest } from 'next/server';

export const createNextRequest = (url: string, init?: RequestInit): NextRequest => {
  const request = new Request(url, init);
  const nextRequest = request as NextRequest & { nextUrl?: URL };
  if (!nextRequest.nextUrl) {
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(url),
      enumerable: false,
    });
  }
  return nextRequest as NextRequest;
};

