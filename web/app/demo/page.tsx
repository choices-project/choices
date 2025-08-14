'use client';

import { SimpleChart } from '../../components/SimpleChart';

const demoData = [
  {
    name: 'Renewable Energy Investment',
    value: 45,
    color: '#10B981',
    trend: '+5.2%',
    confidence: 2.1,
    previousValue: 42.8
  },
  {
    name: 'Carbon Tax Implementation',
    value: 32,
    color: '#3B82F6',
    trend: '+2.8%',
    confidence: 2.5,
    previousValue: 31.1
  },
  {
    name: 'Electric Vehicle Infrastructure',
    value: 28,
    color: '#8B5CF6',
    trend: '+7.1%',
    confidence: 3.2,
    previousValue: 26.1
  },
  {
    name: 'Green Building Standards',
    value: 22,
    color: '#F59E0B',
    trend: '-1.3%',
    confidence: 2.8,
    previousValue: 22.3
  },
  {
    name: 'Public Transportation',
    value: 18,
    color: '#EF4444',
    trend: '+0.8%',
    confidence: 3.5,
    previousValue: 17.9
  }
];

const techData = [
  {
    name: 'AI/ML Development',
    value: 38,
    color: '#3B82F6',
    trend: '+12.5%',
    confidence: 2.8,
    previousValue: 33.8
  },
  {
    name: 'Quantum Computing',
    value: 27,
    color: '#8B5CF6',
    trend: '+8.9%',
    confidence: 3.1,
    previousValue: 24.8
  },
  {
    name: 'Biotechnology',
    value: 24,
    color: '#10B981',
    trend: '+4.2%',
    confidence: 2.9,
    previousValue: 23.0
  },
  {
    name: 'Space Technology',
    value: 19,
    color: '#F59E0B',
    trend: '+6.7%',
    confidence: 3.4,
    previousValue: 17.8
  },
  {
    name: 'Energy Technology',
    value: 15,
    color: '#EF4444',
    trend: '-2.1%',
    confidence: 3.0,
    previousValue: 15.3
  }
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Data Visualization
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            This is what modern companies like Lovable use - TypeScript with advanced libraries, 
            professional animations, and enterprise-grade components.
          </p>
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <SimpleChart
            data={demoData}
            title="Climate Action Priorities"
            subtitle="Public support for environmental initiatives"
            type="bar"
            height={400}
            showTrends={true}
            showConfidence={true}
          />
          
          <SimpleChart
            data={techData}
            title="Technology Development Priorities"
            subtitle="Research and development funding preferences"
            type="progress"
            height={400}
            showTrends={true}
            showConfidence={true}
          />
        </div>

        {/* Single Large Chart */}
        <div className="mb-12">
          <SimpleChart
            data={[...demoData, ...techData].sort((a, b) => b.value - a.value).slice(0, 8)}
            title="Comprehensive Priority Analysis"
            subtitle="Combined view of climate and technology priorities"
            type="trend"
            height={500}
            showTrends={true}
            showConfidence={true}
          />
        </div>

        {/* Technical Details */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Makes This Professional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Animations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Framer Motion physics</li>
                <li>• Staggered animations</li>
                <li>• Spring-based transitions</li>
                <li>• Hover micro-interactions</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Professional Components</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Radix UI primitives</li>
                <li>• Accessible tooltips</li>
                <li>• Progress indicators</li>
                <li>• Type-safe interfaces</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Enterprise Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Confidence intervals</li>
                <li>• Trend analysis</li>
                <li>• Responsive design</li>
                <li>• Performance optimized</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Example */}
        <div className="bg-gray-900 rounded-xl p-8 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">TypeScript Code Example</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
{`// This is what Lovable would use - professional TypeScript
interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  trend: string;
  confidence: number;
  previousValue?: number;
}

// Advanced animations with Framer Motion
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

// Professional tooltips with Radix UI
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger asChild>
      <motion.div whileHover={{ scale: 1.02 }}>
        {/* Chart content */}
      </motion.div>
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content className="bg-gray-900 text-white">
        {/* Rich tooltip content */}
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
