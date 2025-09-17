// 유틸리티 함수들
import { CATEGORY_COLORS, CATEGORY_KEYWORDS, TIME_SLOTS } from '@/constants'
import { InstagramLikeItem, InstagramLikesData, ProcessedInstagramLike, InstagramAnalysisData, AnalysisData } from '@/types'

export const extractImageMetadata = async (file: File): Promise<any> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        // EXIF 데이터는 서버에서 처리
      })
    }
    img.src = URL.createObjectURL(file)
  })
}

export const parseJsonFile = async (file: File): Promise<any> => {
  const text = await file.text()
  const data = JSON.parse(text)
  
  // Instagram 좋아요 데이터인지 확인
  if (data.likes_media_likes && Array.isArray(data.likes_media_likes)) {
    return {
      type: 'instagram_likes',
      likes_media_likes: data.likes_media_likes,
      count: data.likes_media_likes.length
    } as InstagramLikesData
  }
  
  // 기타 JSON 데이터
  return {
    type: 'generic_json',
    data: data
  }
}

export const parseCsvFile = async (file: File): Promise<any> => {
  const text = await file.text()
  const lines = text.split('\n')
  const headers = lines[0].split(',')
  const data = lines.slice(1).map(line => {
    const values = line.split(',')
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index]?.trim()
      return obj
    }, {} as any)
  })
  return data
}

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#E0E0E0'
}

export const categorizeContent = (title: string): string => {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => title.includes(keyword))) {
      return category
    }
  }
  return '기타'
}

// 인스타그램 좋아요 데이터를 처리된 형태로 변환
export const processInstagramLikes = (likesData: InstagramLikeItem[]): ProcessedInstagramLike[] => {
  const processedLikes: ProcessedInstagramLike[] = []
  
  likesData.forEach(item => {
    item.string_list_data.forEach(like => {
      const date = new Date(like.timestamp * 1000)
      const processedLike: ProcessedInstagramLike = {
        username: item.title,
        postUrl: like.href,
        timestamp: like.timestamp,
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().split(' ')[0].substring(0, 5),
        hour: date.getHours(),
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][date.getDay()],
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        year: date.getFullYear()
      }
      processedLikes.push(processedLike)
    })
  })
  
  return processedLikes.sort((a, b) => b.timestamp - a.timestamp)
}

// 인스타그램 좋아요 데이터 분석
export const analyzeInstagramLikes = (likesData: InstagramLikeItem[]): InstagramAnalysisData => {
  const processedLikes = processInstagramLikes(likesData)
  const totalLikes = processedLikes.length
  
  if (totalLikes === 0) {
    return {
      type: 'instagram_likes',
      totalLikes: 0,
      uniqueUsers: 0,
      dateRange: { start: '', end: '' },
      timeline: [],
      hourlyPattern: [],
      weeklyPattern: [],
      topUsers: [],
      monthlyTrend: [],
      insights: ['분석할 좋아요 데이터가 없습니다.'],
      recommendations: ['Instagram에서 좋아요 데이터를 내보내기 해주세요.']
    }
  }

  // 고유 사용자 수 계산
  const uniqueUsers = new Set(processedLikes.map(like => like.username)).size

  // 날짜 범위 계산
  const dates = processedLikes.map(like => like.date).sort()
  const dateRange = {
    start: dates[0],
    end: dates[dates.length - 1]
  }

  // 일별 타임라인 분석
  const dailyStats = processedLikes.reduce((acc, like) => {
    if (!acc[like.date]) {
      acc[like.date] = { likes: 0, users: new Set() }
    }
    acc[like.date].likes++
    acc[like.date].users.add(like.username)
    return acc
  }, {} as Record<string, { likes: number; users: Set<string> }>)

  const timeline = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      likes: stats.likes,
      users: stats.users.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // 시간대별 패턴 분석
  const hourlyStats = processedLikes.reduce((acc, like) => {
    acc[like.hour] = (acc[like.hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const hourlyPattern = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    likes: hourlyStats[hour] || 0
  }))

  // 요일별 패턴 분석
  const weeklyStats = processedLikes.reduce((acc, like) => {
    acc[like.dayOfWeek] = (acc[like.dayOfWeek] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const weeklyPattern = ['일', '월', '화', '수', '목', '금', '토']
    .map(day => ({
      day,
      likes: weeklyStats[day] || 0
    }))

  // 상위 사용자 분석
  const userStats = processedLikes.reduce((acc, like) => {
    acc[like.username] = (acc[like.username] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topUsers = Object.entries(userStats)
    .map(([username, likes]) => ({
      username,
      likes,
      percentage: Math.round((likes / totalLikes) * 100)
    }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10)

  // 월별 트렌드 분석
  const monthlyStats = processedLikes.reduce((acc, like) => {
    acc[like.month] = (acc[like.month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const monthlyTrend = Object.entries(monthlyStats)
    .map(([month, likes]) => ({ month, likes }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // 인사이트 생성
  const insights: string[] = []
  const recommendations: string[] = []

  // 기본 통계 인사이트
  insights.push(`총 ${totalLikes}개의 포스트에 좋아요를 누르셨습니다.`)
  insights.push(`${uniqueUsers}명의 서로 다른 사용자의 콘텐츠를 좋아하셨습니다.`)

  // 가장 활발한 시간대
  const mostActiveHour = hourlyPattern.reduce((max, current) => 
    current.likes > max.likes ? current : max
  )
  if (mostActiveHour.likes > 0) {
    insights.push(`가장 활발한 시간대는 ${mostActiveHour.hour}시입니다.`)
  }

  // 가장 활발한 요일
  const mostActiveDay = weeklyPattern.reduce((max, current) => 
    current.likes > max.likes ? current : max
  )
  if (mostActiveDay.likes > 0) {
    insights.push(`가장 활발한 요일은 ${mostActiveDay.day}요일입니다.`)
  }

  // 상위 사용자 인사이트
  if (topUsers.length > 0) {
    const topUser = topUsers[0]
    insights.push(`${topUser.username}님의 콘텐츠를 가장 많이 좋아하셨습니다 (${topUser.likes}개).`)
  }

  // 추천사항
  recommendations.push('좋아요한 콘텐츠를 바탕으로 새로운 계정을 팔로우해보세요.')
  recommendations.push('관심 있는 분야의 해시태그를 더 자주 확인해보세요.')
  recommendations.push('좋아요한 스타일을 참고하여 나만의 콘텐츠를 만들어보세요.')
  
  if (topUsers.length > 3) {
    recommendations.push('자주 좋아요하는 사용자들과 더 많은 상호작용을 해보세요.')
  }

  return {
    type: 'instagram_likes',
    totalLikes,
    uniqueUsers,
    dateRange,
    timeline,
    hourlyPattern,
    weeklyPattern,
    topUsers,
    monthlyTrend,
    insights,
    recommendations
  }
}

// 기본 데이터 생성 함수들
export const generateTimelineData = () => {
  return [
    { date: '2024-01-01', photos: 12, activities: 3 },
    { date: '2024-01-02', photos: 8, activities: 2 },
    { date: '2024-01-03', photos: 15, activities: 4 },
    { date: '2024-01-04', photos: 6, activities: 1 },
    { date: '2024-01-05', photos: 20, activities: 5 },
    { date: '2024-01-06', photos: 18, activities: 3 },
    { date: '2024-01-07', photos: 10, activities: 2 }
  ]
}

export const generateCategoryData = () => {
  return [
    { name: '음식', value: 35, color: '#FF6B6B' },
    { name: '여행', value: 25, color: '#4ECDC4' },
    { name: '일상', value: 20, color: '#45B7D1' },
    { name: '운동', value: 10, color: '#96CEB4' },
    { name: '쇼핑', value: 10, color: '#FFEAA7' }
  ]
}

export const generateEmotionData = () => {
  return [
    { time: '00:00', happy: 20, neutral: 60, sad: 20 },
    { time: '06:00', happy: 30, neutral: 50, sad: 20 },
    { time: '12:00', happy: 50, neutral: 40, sad: 10 },
    { time: '18:00', happy: 60, neutral: 30, sad: 10 },
    { time: '24:00', happy: 40, neutral: 50, sad: 10 }
  ]
}

export const generateLocationData = () => {
  return [
    { location: '강남구', count: 45 },
    { location: '홍대', count: 32 },
    { location: '이태원', count: 28 },
    { location: '명동', count: 20 },
    { location: '잠실', count: 15 }
  ]
}
