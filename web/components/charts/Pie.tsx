'use client'

import dynamic from 'next/dynamic'
import React from 'react';


// Dynamic import with SSR disabled to keep Recharts out of main bundle
const RechartsPie = dynamic(() => import('./RechartsPieImpl'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading chart...</div>
    </div>
  )
})

export default function Pie(props: any) {
  return <RechartsPie {...props} />
}

