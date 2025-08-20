'use client';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface SimpleBarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

export function SimpleBarChart({ data, title, height = 200 }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200" style={{ height }}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      <div className="space-y-4">
        {sortedData.map((item, index: any) => {
          const percentage = (item.value / maxValue) * 100;
          
          return (
            <div key={item.name} className="group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {item.name}
                </span>
                <span className="text-sm font-bold text-gray-900 ml-2">
                  {item.value}%
                </span>
              </div>
              
              <div className="relative">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      backgroundColor: item.color,
                      width: `${percentage}%`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
