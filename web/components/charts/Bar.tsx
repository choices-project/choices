'use client'

import dynamic from 'next/dynamic'

// Dynamic import with SSR disabled to keep Recharts out of main bundle
const RechartsBar = dynamic(() => import('./RechartsBarImpl'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading chart...</div>
    </div>
  )
})

export default function Bar(props: any) {
  return <RechartsBar {...props} />
}
