// 차트 컴포넌트들
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { AnalysisData } from '@/types'

interface TimelineChartProps {
  data: Array<{
    time?: string
    date?: string
    likes?: number
    photos?: number
    activities?: number
    users?: number
  }>
  className?: string
}

export const TimelineChart = ({ data, className = '' }: TimelineChartProps) => {
  const isTimeBased = data[0]?.time !== undefined
  const hasUsers = data[0]?.users !== undefined
  const dataKey = isTimeBased ? 'likes' : 'photos'
  const name = isTimeBased ? '좋아요 수' : '사진 수'
  const xAxisKey = isTimeBased ? 'time' : 'date'

  return (
    <ResponsiveContainer width="100%" height={300} className={className}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#3B82F6" name={name} />
        {!isTimeBased && hasUsers && (
          <Bar dataKey="users" fill="#10B981" name="사용자 수" />
        )}
        {!isTimeBased && !hasUsers && (
          <Bar dataKey="activities" fill="#10B981" name="활동 수" />
        )}
      </BarChart>
    </ResponsiveContainer>
  )
}

interface CategoryChartProps {
  data: AnalysisData['categories']
  className?: string
}

export const CategoryChart = ({ data, className = '' }: CategoryChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300} className={className}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent, value }) => 
            `${name} ${(percent * 100).toFixed(0)}% (${value}개)`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number, name: string) => [
            `${value}개`, 
            name === 'value' ? '좋아요 수' : name
          ]}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
