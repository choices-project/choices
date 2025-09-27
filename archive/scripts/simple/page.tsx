'use client';

import { FancyDonutChart, FancyProgressRing } from '../../components/FancyCharts';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Simple Working Charts</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Basic Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-6">Climate Action Priorities</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Renewable Energy Investment</span>
                <span className="font-bold text-green-600">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-green-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: '45%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Carbon Tax Implementation</span>
                <span className="font-bold text-blue-600">32%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-blue-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: '32%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Electric Vehicle Infrastructure</span>
                <span className="font-bold text-purple-600">28%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-purple-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: '28%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Green Building Standards</span>
                <span className="font-bold text-orange-600">22%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-orange-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: '22%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Public Transportation</span>
                <span className="font-bold text-red-600">18%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-red-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: '18%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Priorities */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-6">Technology Development Priorities</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">AI/ML Development</span>
                <span className="font-bold text-blue-600">38%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: '38%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Quantum Computing</span>
                <span className="font-bold text-purple-600">27%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: '27%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Biotechnology</span>
                <span className="font-bold text-green-600">24%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: '24%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Space Technology</span>
                <span className="font-bold text-orange-600">19%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: '19%' }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Energy Technology</span>
                <span className="font-bold text-red-600">15%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-red-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: '15%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Fancy Charts Demo */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-6">Fancy Charts Demo</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Interactive Donut Chart</h3>
              <FancyDonutChart
                data={[
                  { name: 'Renewable Energy', value: 45, color: '#10b981' },
                  { name: 'Carbon Tax', value: 32, color: '#3b82f6' },
                  { name: 'EV Infrastructure', value: 28, color: '#8b5cf6' },
                  { name: 'Green Buildings', value: 22, color: '#f59e0b' },
                  { name: 'Public Transit', value: 18, color: '#ef4444' }
                ]}
                size={200}
                strokeWidth={20}
                title="Climate Action"
              />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Progress Rings</h3>
              <div className="grid grid-cols-2 gap-4">
                <FancyProgressRing
                  percentage={78}
                  size={80}
                  strokeWidth={6}
                  color="#10b981"
                  label="Participation"
                />
                <FancyProgressRing
                  percentage={92}
                  size={80}
                  strokeWidth={6}
                  color="#3b82f6"
                  label="Accuracy"
                />
                <FancyProgressRing
                  percentage={65}
                  size={80}
                  strokeWidth={6}
                  color="#8b5cf6"
                  label="Engagement"
                />
                <FancyProgressRing
                  percentage={88}
                  size={80}
                  strokeWidth={6}
                  color="#f59e0b"
                  label="Satisfaction"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Color Test */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-6">Color Palette Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Green
            </div>
            <div className="h-24 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Blue
            </div>
            <div className="h-24 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Purple
            </div>
            <div className="h-24 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Orange
            </div>
            <div className="h-24 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Red
            </div>
            <div className="h-24 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Indigo
            </div>
            <div className="h-24 bg-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Pink
            </div>
            <div className="h-24 bg-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Teal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
