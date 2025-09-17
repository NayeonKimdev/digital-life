// 타입 정의
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  file: File
  preview?: string | null
  status: 'processing' | 'completed' | 'error'
  metadata?: any
  content?: any
}

// 인스타그램 좋아요 데이터 구조
export interface InstagramLikeItem {
  title: string
  string_list_data: Array<{
    href: string
    value: string
    timestamp: number
  }>
}

export interface InstagramLikesData {
  likes_media_likes: InstagramLikeItem[]
}

// 분석을 위한 변환된 데이터 구조
export interface ProcessedInstagramLike {
  username: string
  postUrl: string
  timestamp: number
  date: string
  time: string
  hour: number
  dayOfWeek: string
  month: string
  year: number
}

export interface InstagramAnalysisData {
  type: 'instagram_likes'
  totalLikes: number
  uniqueUsers: number
  dateRange: {
    start: string
    end: string
  }
  timeline: Array<{
    date: string
    likes: number
    users: number
  }>
  hourlyPattern: Array<{
    hour: number
    likes: number
  }>
  weeklyPattern: Array<{
    day: string
    likes: number
  }>
  topUsers: Array<{
    username: string
    likes: number
    percentage: number
  }>
  monthlyTrend: Array<{
    month: string
    likes: number
  }>
  insights: string[]
  recommendations: string[]
}

export interface AnalysisData {
  // 기존 일반 분석 데이터
  timeline: Array<{
    time?: string
    date?: string
    likes?: number
    photos?: number
    activities?: number
    users?: number
  }>
  categories: Array<{
    name: string
    value: number
    color: string
  }>
  emotions: Array<{
    time: string
    happy: number
    neutral: number
    sad: number
  }>
  locations: Array<{
    location: string
    count: number
  }>
  insights: string[]
  recommendations: string[]
  totalLikes?: number
  
  // 인스타그램 특화 데이터 (선택적)
  instagramData?: InstagramAnalysisData
}

export interface ServiceGuide {
  name: string
  icon: string
  steps: Array<{
    title: string
    description: string
    icon: React.ReactNode
  }>
}
