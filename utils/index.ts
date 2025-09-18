// 유틸리티 함수들
import { CATEGORY_COLORS, CATEGORY_KEYWORDS, TIME_SLOTS } from '@/constants'
import { InstagramLikeItem, InstagramLikesData, ProcessedInstagramLike, InstagramAnalysisData, AnalysisData, KakaoChatMessage, KakaoChatData, KakaoAnalysisData } from '@/types'

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

// 카카오톡 채팅 파일 파싱 (개선된 버전)
export const parseKakaoChatFile = async (file: File): Promise<KakaoChatData> => {
  const text = await file.text()
  const lines = text.split('\n')
  
  const messages: KakaoChatMessage[] = []
  let currentDate = ''
  let chatTitle = ''
  let savedDate = ''
  
  // 파일 헤더 정보 추출
  const firstLine = lines[0]
  if (firstLine.includes('Talk_') && firstLine.includes('.txt')) {
    chatTitle = firstLine.replace('.txt', '').replace('Talk_', '')
  }
  
  const secondLine = lines[1]
  if (secondLine.includes('저장한 날짜')) {
    savedDate = secondLine.replace('저장한 날짜 : ', '')
  }
  
  // 메시지 파싱
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    
    // 빈 줄 건너뛰기
    if (line === '') {
      i++
      continue
    }
    
    // 날짜 라인 감지 (예: "2025년 7월 4일 금요일")
    if (line.match(/^\d{4}년 \d{1,2}월 \d{1,2}일/)) {
      currentDate = line
      i++
      continue
    }
    
    // 메시지 라인 감지 (예: "2025. 7. 4. 19:21, Hailey Hyunjee : "메시지 내용"")
    const messageMatch = line.match(/^(\d{4})\. (\d{1,2})\. (\d{1,2})\. (\d{1,2}):(\d{2}), ([^:]+) : (.+)$/)
    if (messageMatch) {
      const [, year, month, day, hour, minute, sender, content] = messageMatch
      const timestamp = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      )
      
      // 멀티라인 메시지 처리
      let fullContent = content
      i++
      
      // 다음 줄들이 같은 메시지의 연속인지 확인
      while (i < lines.length) {
        const nextLine = lines[i].trim()
        
        // 빈 줄이면 중단
        if (nextLine === '') {
          i++
          continue
        }
        
        // 새로운 메시지나 날짜 라인이면 중단
        if (nextLine.match(/^\d{4}년 \d{1,2}월 \d{1,2}일/) || 
            nextLine.match(/^\d{4}\. \d{1,2}\. \d{1,2}\. \d{1,2}:\d{2}, [^:]+ : /) ||
            nextLine.match(/^\d{4}\. \d{1,2}\. \d{1,2}\. \d{1,2}:\d{2}: [^님이]+님이 (들어왔습니다|나갔습니다)\.$/)) {
          break
        }
        
        // 연속된 메시지 내용으로 판단
        fullContent += '\n' + nextLine
        i++
      }
      
      // 따옴표 제거
      fullContent = fullContent.replace(/^["']|["']$/g, '').trim()
      
      messages.push({
        timestamp: timestamp.getTime(),
        date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
        time: `${hour}:${minute}`,
        hour: parseInt(hour),
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][timestamp.getDay()],
        month: `${year}-${month.padStart(2, '0')}`,
        year: parseInt(year),
        sender: sender.trim(),
        content: fullContent,
        type: 'message'
      })
      continue
    }
    
    // 입장/퇴장 메시지 감지
    const joinMatch = line.match(/^(\d{4})\. (\d{1,2})\. (\d{1,2})\. (\d{1,2}):(\d{2}): ([^님이]+)님이 들어왔습니다\.$/)
    const leaveMatch = line.match(/^(\d{4})\. (\d{1,2})\. (\d{1,2})\. (\d{1,2}):(\d{2}): ([^님이]+)님이 나갔습니다\.$/)
    
    if (joinMatch) {
      const [, year, month, day, hour, minute, sender] = joinMatch
      const timestamp = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      )
      
      messages.push({
        timestamp: timestamp.getTime(),
        date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
        time: `${hour}:${minute}`,
        hour: parseInt(hour),
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][timestamp.getDay()],
        month: `${year}-${month.padStart(2, '0')}`,
        year: parseInt(year),
        sender: sender.trim(),
        content: '채팅방에 입장했습니다',
        type: 'join'
      })
    }
    
    if (leaveMatch) {
      const [, year, month, day, hour, minute, sender] = leaveMatch
      const timestamp = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      )
      
      messages.push({
        timestamp: timestamp.getTime(),
        date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
        time: `${hour}:${minute}`,
        hour: parseInt(hour),
        dayOfWeek: ['일', '월', '화', '수', '목', '금', '토'][timestamp.getDay()],
        month: `${year}-${month.padStart(2, '0')}`,
        year: parseInt(year),
        sender: sender.trim(),
        content: '채팅방을 나갔습니다',
        type: 'leave'
      })
    }
    
    i++
  }
  
  const result = {
    type: 'kakao_chat',
    chatTitle,
    savedDate,
    messages: messages.sort((a, b) => a.timestamp - b.timestamp),
    totalMessages: messages.length
  }
  
  // 상세한 디버깅 정보 출력
  console.log('=== 카카오톡 파싱 결과 ===')
  console.log('채팅방 제목:', chatTitle)
  console.log('저장 날짜:', savedDate)
  console.log('총 메시지 수:', messages.length)
  console.log('고유 발신자 수:', new Set(messages.map(m => m.sender)).size)
  console.log('메시지 타입별:', {
    message: messages.filter(m => m.type === 'message').length,
    join: messages.filter(m => m.type === 'join').length,
    leave: messages.filter(m => m.type === 'leave').length
  })
  console.log('샘플 메시지:', messages.slice(0, 3).map(m => ({
    sender: m.sender,
    content: m.content.substring(0, 30) + '...',
    date: m.date,
    time: m.time
  })))
  
  return result
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

// 카카오톡 채팅 데이터 분석 (개선된 버전)
export const analyzeKakaoChat = (chatData: KakaoChatData): KakaoAnalysisData => {
  const messages = chatData.messages
  const totalMessages = messages.length
  
  console.log('=== 카카오톡 분석 시작 ===')
  console.log('입력 데이터:', {
    chatTitle: chatData.chatTitle,
    totalMessages: messages.length,
    dateRange: messages.length > 0 ? {
      start: messages[0].date,
      end: messages[messages.length - 1].date
    } : null
  })
  
  if (totalMessages === 0) {
    return {
      type: 'kakao_chat',
      chatTitle: chatData.chatTitle,
      totalMessages: 0,
      uniqueSenders: 0,
      dateRange: { start: '', end: '' },
      timeline: [],
      hourlyPattern: [],
      weeklyPattern: [],
      topSenders: [],
      monthlyTrend: [],
      messageTypes: { message: 0, join: 0, leave: 0 },
      insights: ['분석할 채팅 데이터가 없습니다.'],
      recommendations: ['카카오톡에서 채팅 내역을 내보내기 해주세요.']
    }
  }
  
  // 고유 발신자 수 계산
  const uniqueSenders = new Set(messages.map(msg => msg.sender)).size
  
  // 날짜 범위 계산
  const dates = messages.map(msg => msg.date).sort()
  const dateRange = {
    start: dates[0],
    end: dates[dates.length - 1]
  }
  
  // 일별 타임라인 분석
  const dailyStats = messages.reduce((acc, msg) => {
    if (!acc[msg.date]) {
      acc[msg.date] = { messages: 0, senders: new Set() }
    }
    acc[msg.date].messages++
    acc[msg.date].senders.add(msg.sender)
    return acc
  }, {} as Record<string, { messages: number; senders: Set<string> }>)
  
  const timeline = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      messages: stats.messages,
      senders: stats.senders.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  // 시간대별 패턴 분석
  const hourlyStats = messages.reduce((acc, msg) => {
    acc[msg.hour] = (acc[msg.hour] || 0) + 1
    return acc
  }, {} as Record<number, number>)
  
  const hourlyPattern = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    messages: hourlyStats[hour] || 0
  }))
  
  // 요일별 패턴 분석
  const weeklyStats = messages.reduce((acc, msg) => {
    acc[msg.dayOfWeek] = (acc[msg.dayOfWeek] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const weeklyPattern = ['일', '월', '화', '수', '목', '금', '토']
    .map(day => ({
      day,
      messages: weeklyStats[day] || 0
    }))
  
  // 상위 발신자 분석
  const senderStats = messages.reduce((acc, msg) => {
    acc[msg.sender] = (acc[msg.sender] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topSenders = Object.entries(senderStats)
    .map(([sender, messages]) => ({
      sender,
      messages,
      percentage: Math.round((messages / totalMessages) * 100)
    }))
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 10)
  
  // 월별 트렌드 분석
  const monthlyStats = messages.reduce((acc, msg) => {
    acc[msg.month] = (acc[msg.month] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const monthlyTrend = Object.entries(monthlyStats)
    .map(([month, messages]) => ({ month, messages }))
    .sort((a, b) => a.month.localeCompare(b.month))
  
  // 메시지 타입별 분석
  const messageTypes = messages.reduce((acc, msg) => {
    acc[msg.type] = (acc[msg.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // 메시지 내용 분석
  const contentAnalysis = analyzeMessageContent(messages)
  
  // 인사이트 생성
  const insights: string[] = []
  const recommendations: string[] = []
  
  // 기본 통계 인사이트
  insights.push(`총 ${totalMessages}개의 메시지가 교환되었습니다.`)
  insights.push(`${uniqueSenders}명이 참여한 채팅방입니다.`)
  
  // 가장 활발한 시간대
  const mostActiveHour = hourlyPattern.reduce((max, current) => 
    current.messages > max.messages ? current : max
  )
  if (mostActiveHour.messages > 0) {
    insights.push(`가장 활발한 시간대는 ${mostActiveHour.hour}시입니다.`)
  }
  
  // 가장 활발한 요일
  const mostActiveDay = weeklyPattern.reduce((max, current) => 
    current.messages > max.messages ? current : max
  )
  if (mostActiveDay.messages > 0) {
    insights.push(`가장 활발한 요일은 ${mostActiveDay.day}요일입니다.`)
  }
  
  // 상위 발신자 인사이트
  if (topSenders.length > 0) {
    const topSender = topSenders[0]
    insights.push(`${topSender.sender}님이 가장 많이 메시지를 보내셨습니다 (${topSender.messages}개).`)
  }
  
  // 채팅 패턴 분석
  const avgMessagesPerDay = totalMessages / timeline.length
  if (avgMessagesPerDay > 50) {
    insights.push('매우 활발한 채팅방입니다.')
  } else if (avgMessagesPerDay > 20) {
    insights.push('적당히 활발한 채팅방입니다.')
  } else {
    insights.push('조용한 채팅방입니다.')
  }
  
  // 추가 인사이트
  if (messageTypes.join > 0) {
    insights.push(`총 ${messageTypes.join}명이 채팅방에 입장했습니다.`)
  }
  
  if (messageTypes.leave > 0) {
    insights.push(`총 ${messageTypes.leave}명이 채팅방을 나갔습니다.`)
  }
  
  // 내용 분석 기반 인사이트
  if (contentAnalysis.topics.length > 0) {
    const topTopic = contentAnalysis.topics[0]
    insights.push(`가장 많이 논의된 주제는 '${topTopic.topic}'입니다 (${topTopic.percentage}%).`)
  }
  
  if (contentAnalysis.topKeywords.length > 0) {
    const topKeyword = contentAnalysis.topKeywords[0]
    insights.push(`가장 자주 언급된 키워드는 '${topKeyword.keyword}'입니다 (${topKeyword.count}회).`)
  }
  
  if (contentAnalysis.linkSharing.totalLinks > 0) {
    insights.push(`총 ${contentAnalysis.linkSharing.totalLinks}개의 링크가 공유되었습니다.`)
  }
  
  if (contentAnalysis.sentimentAnalysis.positive > contentAnalysis.sentimentAnalysis.negative) {
    insights.push(`전반적으로 긍정적인 대화가 많았습니다 (긍정 ${contentAnalysis.sentimentAnalysis.positive}%).`)
  } else if (contentAnalysis.sentimentAnalysis.negative > contentAnalysis.sentimentAnalysis.positive) {
    insights.push(`부정적인 대화가 상대적으로 많았습니다 (부정 ${contentAnalysis.sentimentAnalysis.negative}%).`)
  }
  
  if (contentAnalysis.conversationStyle.avgMessageLength > 50) {
    insights.push(`상세한 설명이 많은 대화 스타일입니다 (평균 ${contentAnalysis.conversationStyle.avgMessageLength}자).`)
  } else {
    insights.push(`간결한 대화 스타일입니다 (평균 ${contentAnalysis.conversationStyle.avgMessageLength}자).`)
  }
  
  // 추천사항
  recommendations.push('채팅 패턴을 바탕으로 더 나은 소통 시간을 찾아보세요.')
  recommendations.push('자주 대화하는 사람들과 더 깊은 관계를 만들어보세요.')
  
  if (topSenders.length > 3) {
    recommendations.push('다양한 사람들과 균형있게 소통해보세요.')
  }
  
  if (mostActiveHour.hour >= 22 || mostActiveHour.hour <= 6) {
    recommendations.push('새벽이나 밤늦은 시간의 채팅을 줄여보세요.')
  }
  
  // 내용 분석 기반 추천사항
  if (contentAnalysis.topics.length > 1) {
    const topTopics = contentAnalysis.topics.slice(0, 3).map(t => t.topic).join(', ')
    recommendations.push(`주요 관심사인 '${topTopics}'에 대해 더 깊이 있게 대화해보세요.`)
  }
  
  if (contentAnalysis.linkSharing.totalLinks > 0) {
    recommendations.push('공유한 링크들을 바탕으로 새로운 주제를 찾아보세요.')
  }
  
  if (contentAnalysis.sentimentAnalysis.negative > 30) {
    recommendations.push('부정적인 대화를 줄이고 긍정적인 소통을 늘려보세요.')
  }
  
  if (contentAnalysis.conversationStyle.questionCount < 10) {
    recommendations.push('더 많은 질문을 통해 상대방의 의견을 들어보세요.')
  }
  
  const result = {
    type: 'kakao_chat',
    chatTitle: chatData.chatTitle,
    totalMessages,
    uniqueSenders,
    dateRange,
    timeline,
    hourlyPattern,
    weeklyPattern,
    topSenders,
    monthlyTrend,
    messageTypes,
    contentAnalysis,
    insights,
    recommendations
  }
  
  console.log('=== 카카오톡 분석 결과 ===')
  console.log('분석 결과:', result)
  
  return result
}

// 메시지 내용 분석 함수들
export const analyzeMessageContent = (messages: KakaoChatMessage[]) => {
  console.log('=== 메시지 내용 분석 시작 ===')
  
  // 키워드 추출
  const keywordAnalysis = extractKeywords(messages)
  
  // 주제 분류
  const topicAnalysis = classifyTopics(messages)
  
  // 감정 분석
  const sentimentAnalysis = analyzeSentiment(messages)
  
  // 링크 공유 분석
  const linkAnalysis = analyzeLinkSharing(messages)
  
  // 대화 스타일 분석
  const styleAnalysis = analyzeConversationStyle(messages)
  
  // 참여 패턴 분석
  const participationAnalysis = analyzeParticipationPattern(messages)
  
  const result = {
    topKeywords: keywordAnalysis.topKeywords,
    topics: topicAnalysis.topics,
    sentimentAnalysis: sentimentAnalysis,
    linkSharing: linkAnalysis,
    conversationStyle: styleAnalysis,
    participationPattern: participationAnalysis
  }
  
  console.log('=== 메시지 내용 분석 결과 ===')
  console.log('키워드:', keywordAnalysis.topKeywords.slice(0, 10))
  console.log('주제:', topicAnalysis.topics.slice(0, 5))
  console.log('감정:', sentimentAnalysis)
  console.log('링크:', linkAnalysis)
  
  return result
}

// 키워드 추출 함수
const extractKeywords = (messages: KakaoChatMessage[]) => {
  const textMessages = messages.filter(msg => msg.type === 'message')
  const allText = textMessages.map(msg => msg.content).join(' ')
  
  // 불용어 제거 및 키워드 추출
  const stopWords = ['이', '그', '저', '것', '수', '있', '하', '되', '되다', '이다', '다', '의', '가', '을', '를', '에', '와', '과', '로', '으로', '에서', '부터', '까지', '도', '만', '은', '는', '이', '가', '을', '를', '에', '와', '과', '로', '으로', '에서', '부터', '까지', '도', '만', '은', '는', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉', '열']
  
  // 단어 추출 (2글자 이상)
  const words = allText
    .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.includes(word))
    .map(word => word.toLowerCase())
  
  // 단어 빈도 계산
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // 상위 키워드 추출
  const topKeywords = Object.entries(wordCount)
    .map(([keyword, count]) => ({
      keyword,
      count,
      percentage: Math.round((count / words.length) * 100 * 100) / 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
  
  return { topKeywords }
}

// 주제 분류 함수
const classifyTopics = (messages: KakaoChatMessage[]) => {
  const textMessages = messages.filter(msg => msg.type === 'message')
  
  const topicKeywords = {
    '투자/경제': ['투자', '주식', '경제', '시장', '금리', '인플레이션', 'FOMC', '증시', 'ETF', '매수', '매도', '포트폴리오', '자산', '수익', '손실'],
    '기술/AI': ['AI', '인공지능', '기술', '개발', '프로그래밍', '코딩', '알고리즘', '머신러닝', '딥러닝', '데이터', '클라우드', '블록체인'],
    '뉴스/시사': ['뉴스', '시사', '정치', '정부', '정책', '법안', '선거', '국회', '대통령', '총리', '부총리'],
    '일상/생활': ['일상', '생활', '요리', '음식', '카페', '맛집', '여행', '휴가', '쇼핑', '영화', '드라마', '책', '독서'],
    '건강/운동': ['건강', '운동', '헬스', '요가', '달리기', '수영', '다이어트', '병원', '의사', '약', '치료'],
    '취미/관심사': ['취미', '관심사', '게임', '음악', '악기', '그림', '사진', '영상', '유튜브', '넷플릭스', '드라마']
  }
  
  const topicCount: Record<string, { count: number; keywords: string[] }> = {}
  
  textMessages.forEach(msg => {
    const content = msg.content.toLowerCase()
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matchedKeywords = keywords.filter(keyword => content.includes(keyword))
      if (matchedKeywords.length > 0) {
        if (!topicCount[topic]) {
          topicCount[topic] = { count: 0, keywords: [] }
        }
        topicCount[topic].count++
        matchedKeywords.forEach(keyword => {
          if (!topicCount[topic].keywords.includes(keyword)) {
            topicCount[topic].keywords.push(keyword)
          }
        })
      }
    })
  })
  
  const totalMessages = textMessages.length
  const topics = Object.entries(topicCount)
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      percentage: Math.round((data.count / totalMessages) * 100 * 100) / 100,
      keywords: data.keywords
    }))
    .sort((a, b) => b.count - a.count)
  
  return { topics }
}

// 감정 분석 함수
const analyzeSentiment = (messages: KakaoChatMessage[]) => {
  const textMessages = messages.filter(msg => msg.type === 'message')
  
  const positiveWords = ['좋', '좋다', '좋아', '좋네', '좋아요', '최고', '대박', '멋져', '훌륭', '완벽', '최고', '최고다', '사랑', '행복', '기쁘', '즐거', '재미', '웃음', '하하', 'ㅋㅋ', 'ㅎㅎ', '👍', '❤️', '😊', '😄', '😍', '🥰', '😘', '🎉', '🎊', '👏', '💪', '🔥', '✨']
  const negativeWords = ['나쁘', '나쁘다', '나빠', '나쁘네', '최악', '싫', '싫다', '싫어', '화나', '짜증', '우울', '슬프', '힘들', '어려', '복잡', '피곤', '지쳐', '스트레스', '걱정', '불안', '😢', '😭', '😡', '😠', '😤', '😰', '😱', '😞', '😔', '😩', '😫', '💔', '👎']
  
  let positive = 0
  let negative = 0
  let neutral = 0
  
  textMessages.forEach(msg => {
    const content = msg.content.toLowerCase()
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length
    const negativeCount = negativeWords.filter(word => content.includes(word)).length
    
    if (positiveCount > negativeCount) {
      positive++
    } else if (negativeCount > positiveCount) {
      negative++
    } else {
      neutral++
    }
  })
  
  const total = textMessages.length
  return {
    positive: Math.round((positive / total) * 100),
    neutral: Math.round((neutral / total) * 100),
    negative: Math.round((negative / total) * 100)
  }
}

// 링크 공유 분석 함수
const analyzeLinkSharing = (messages: KakaoChatMessage[]) => {
  const textMessages = messages.filter(msg => msg.type === 'message')
  
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const domains: Record<string, number> = {}
  const linkTypes = { news: 0, social: 0, shopping: 0, other: 0 }
  
  textMessages.forEach(msg => {
    const urls = msg.content.match(urlRegex) || []
    urls.forEach(url => {
      try {
        const domain = new URL(url).hostname.replace('www.', '')
        domains[domain] = (domains[domain] || 0) + 1
        
        // 링크 타입 분류
        if (domain.includes('news') || domain.includes('media') || domain.includes('press')) {
          linkTypes.news++
        } else if (domain.includes('facebook') || domain.includes('instagram') || domain.includes('twitter') || domain.includes('youtube')) {
          linkTypes.social++
        } else if (domain.includes('shop') || domain.includes('mall') || domain.includes('store') || domain.includes('coupang') || domain.includes('gmarket')) {
          linkTypes.shopping++
        } else {
          linkTypes.other++
        }
      } catch (e) {
        // URL 파싱 실패 시 무시
      }
    })
  })
  
  const topDomains = Object.entries(domains)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  return {
    totalLinks: Object.values(domains).reduce((sum, count) => sum + count, 0),
    topDomains,
    linkTypes
  }
}

// 대화 스타일 분석 함수
const analyzeConversationStyle = (messages: KakaoChatMessage[]) => {
  const textMessages = messages.filter(msg => msg.type === 'message')
  
  let totalLength = 0
  let emojiCount = 0
  let questionCount = 0
  let exclamationCount = 0
  
  textMessages.forEach(msg => {
    const content = msg.content
    totalLength += content.length
    
    // 이모지 카운트 (간단한 패턴)
    emojiCount += (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length
    
    // 질문 카운트
    questionCount += (content.match(/[?？]/g) || []).length
    
    // 감탄사 카운트
    exclamationCount += (content.match(/[!！]/g) || []).length
  })
  
  return {
    avgMessageLength: Math.round(totalLength / textMessages.length),
    emojiUsage: Math.round((emojiCount / textMessages.length) * 100) / 100,
    questionCount,
    exclamationCount
  }
}

// 참여 패턴 분석 함수
const analyzeParticipationPattern = (messages: KakaoChatMessage[]) => {
  const textMessages = messages.filter(msg => msg.type === 'message')
  
  const senderStats: Record<string, {
    messageCount: number
    totalLength: number
    linkShares: number
    questions: number
  }> = {}
  
  textMessages.forEach(msg => {
    if (!senderStats[msg.sender]) {
      senderStats[msg.sender] = {
        messageCount: 0,
        totalLength: 0,
        linkShares: 0,
        questions: 0
      }
    }
    
    senderStats[msg.sender].messageCount++
    senderStats[msg.sender].totalLength += msg.content.length
    
    if (msg.content.includes('http')) {
      senderStats[msg.sender].linkShares++
    }
    
    if (msg.content.includes('?') || msg.content.includes('？')) {
      senderStats[msg.sender].questions++
    }
  })
  
  const activeParticipants = Object.entries(senderStats)
    .map(([sender, stats]) => ({
      sender,
      messageCount: stats.messageCount,
      avgLength: Math.round(stats.totalLength / stats.messageCount),
      linkShares: stats.linkShares,
      questions: stats.questions
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 10)
  
  // 응답 패턴 분석 (간단한 버전)
  let quickResponses = 0
  let delayedResponses = 0
  
  for (let i = 1; i < textMessages.length; i++) {
    const prevMsg = textMessages[i - 1]
    const currentMsg = textMessages[i]
    
    if (prevMsg.sender !== currentMsg.sender) {
      const timeDiff = currentMsg.timestamp - prevMsg.timestamp
      if (timeDiff < 5 * 60 * 1000) { // 5분 이내
        quickResponses++
      } else {
        delayedResponses++
      }
    }
  }
  
  return {
    activeParticipants,
    responsePattern: {
      quickResponses,
      delayedResponses,
      avgResponseTime: quickResponses + delayedResponses > 0 ? 
        Math.round((quickResponses / (quickResponses + delayedResponses)) * 100) : 0
    }
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
