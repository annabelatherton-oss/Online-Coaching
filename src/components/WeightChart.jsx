import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{payload[0].value} kg</p>
    </div>
  )
}

export default function WeightChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Add more entries to see your trend
        </p>
      </div>
    )
  }

  const chartData = [...data]
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
    .map(entry => ({
      date: formatDate(entry.recorded_at),
      weight: parseFloat(entry.weight_kg),
    }))

  const weights = chartData.map(d => d.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const padding = Math.max((maxWeight - minWeight) * 0.2, 1)
  const yMin = Math.floor((minWeight - padding) * 2) / 2
  const yMax = Math.ceil((maxWeight + padding) * 2) / 2

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={v => `${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#f472b6"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#f472b6', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#f472b6', stroke: '#fff', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
