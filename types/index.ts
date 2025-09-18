// 타입 정의
export interface DetectedObject {
  bbox: [number, number, number, number] // [x, y, width, height]
  class: string
  score: number
  category?: string // 추가된 카테고리 정보
}

export interface ObjectDetectionResult {
  objects: DetectedObject[]
  processingTime: number
  imageSize: {
    width: number
    height: number
  }
  // 텍스트 인식 결과 추가
  textRecognition?: {
    text: string
    confidence: number
    processingTime: number
  }
}

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
  // 이미지 분석 관련 필드
  imageMetadata?: ImageMetadata
  imageContentAnalysis?: ImageContentAnalysis
  objectDetectionResult?: ObjectDetectionResult
  advancedAnalysisResult?: any // AdvancedImageAnalysis 타입은 utils/advancedImageAnalysis.ts에서 정의됨
  isImage?: boolean
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
  
  // 카카오톡 특화 데이터 (선택적)
  kakaoData?: KakaoAnalysisData
  
  // 이미지 분석 특화 데이터 (선택적)
  imageData?: ImageAnalysisData
}

// 카카오톡 채팅 데이터 구조
export interface KakaoChatMessage {
  timestamp: number
  date: string
  time: string
  hour: number
  dayOfWeek: string
  month: string
  year: number
  sender: string
  content: string
  type: 'message' | 'join' | 'leave'
}

export interface KakaoChatData {
  type: 'kakao_chat'
  chatTitle: string
  savedDate: string
  messages: KakaoChatMessage[]
  totalMessages: number
}

export interface KakaoAnalysisData {
  type: 'kakao_chat'
  chatTitle: string
  totalMessages: number
  uniqueSenders: number
  dateRange: {
    start: string
    end: string
  }
  timeline: Array<{
    date: string
    messages: number
    senders: number
  }>
  hourlyPattern: Array<{
    hour: number
    messages: number
  }>
  weeklyPattern: Array<{
    day: string
    messages: number
  }>
  topSenders: Array<{
    sender: string
    messages: number
    percentage: number
  }>
  monthlyTrend: Array<{
    month: string
    messages: number
  }>
  messageTypes: {
    message: number
    join: number
    leave: number
  }
  // 내용 분석 데이터 추가
  contentAnalysis: {
    topKeywords: Array<{
      keyword: string
      count: number
      percentage: number
    }>
    topics: Array<{
      topic: string
      count: number
      percentage: number
      keywords: string[]
    }>
    sentimentAnalysis: {
      positive: number
      neutral: number
      negative: number
    }
    linkSharing: {
      totalLinks: number
      topDomains: Array<{
        domain: string
        count: number
      }>
      linkTypes: {
        news: number
        social: number
        shopping: number
        other: number
      }
    }
    conversationStyle: {
      avgMessageLength: number
      emojiUsage: number
      questionCount: number
      exclamationCount: number
    }
    participationPattern: {
      activeParticipants: Array<{
        sender: string
        messageCount: number
        avgLength: number
        linkShares: number
        questions: number
      }>
      responsePattern: {
        quickResponses: number
        delayedResponses: number
        avgResponseTime: number
      }
    }
  }
  insights: string[]
  recommendations: string[]
}

// 이미지 분석 관련 타입 정의
export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
  createdAt: Date
  aspectRatio?: number
  estimatedCategory?: string
  contentHints?: string[]
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  camera: {
    make: string
    model: string
    lens?: string
    settings?: {
      aperture?: string
      shutterSpeed?: string
      iso?: number
      focalLength?: number
    }
  }
  tags: string[]
  colors?: {
    dominant: string[]
    palette: string[]
    mood?: string
  }
}

export interface ImageContentAnalysis {
  objects: Array<{
    name: string
    confidence: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  scenes: Array<{
    name: string
    confidence: number
  }>
  text?: Array<{
    content: string
    confidence: number
    boundingBox?: {
      x: number
      y: number
      width: number
      height: number
    }
  }>
  faces?: Array<{
    count: number
    emotions?: Array<{
      emotion: string
      confidence: number
    }>
    demographics?: {
      ageRange?: string
      gender?: string
    }
  }>
  activities?: Array<{
    activity: string
    confidence: number
  }>
  landmarks?: Array<{
    name: string
    confidence: number
    location?: {
      latitude: number
      longitude: number
    }
  }>
}

export interface ImagePreferenceAnalysis {
  categories: Array<{
    category: string
    count: number
    percentage: number
    examples: string[]
  }>
  colorPreferences: {
    dominantColors: Array<{
      color: string
      frequency: number
      percentage: number
    }>
    colorMood: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'muted'
  }
  stylePreferences: {
    photographyStyle: 'portrait' | 'landscape' | 'macro' | 'street' | 'abstract' | 'documentary'
    compositionStyle: 'rule_of_thirds' | 'centered' | 'symmetrical' | 'diagonal' | 'leading_lines'
    lightingPreference: 'natural' | 'artificial' | 'mixed' | 'low_light'
  }
  subjectPreferences: Array<{
    subject: string
    frequency: number
    percentage: number
    contexts: string[]
  }>
  temporalPatterns: {
    timeOfDay: Array<{
      period: 'morning' | 'afternoon' | 'evening' | 'night'
      count: number
      percentage: number
    }>
    dayOfWeek: Array<{
      day: string
      count: number
      percentage: number
    }>
    seasonalPatterns?: Array<{
      season: string
      count: number
      percentage: number
    }>
  }
  locationPatterns?: Array<{
    location: string
    count: number
    percentage: number
    type: 'indoor' | 'outdoor' | 'urban' | 'nature'
  }>
}

export interface ImageAnalysisData {
  type: 'image_analysis'
  totalImages: number
  analysisDate: string
  metadata: {
    totalSize: number
    averageSize: number
    formats: Array<{
      format: string
      count: number
      percentage: number
    }>
    dateRange: {
      start: string
      end: string
    }
  }
  contentAnalysis: {
    totalObjects: number
    uniqueObjects: number
    objectCategories: Array<{
      category: string
      count: number
      percentage: number
    }>
    sceneTypes: Array<{
      scene: string
      count: number
      percentage: number
    }>
    textDetection: {
      imagesWithText: number
      totalTextInstances: number
      languages: Array<{
        language: string
        count: number
      }>
    }
    faceDetection: {
      imagesWithFaces: number
      totalFaces: number
      emotionDistribution: Array<{
        emotion: string
        count: number
        percentage: number
      }>
    }
  }
  preferenceAnalysis: ImagePreferenceAnalysis
  insights: string[]
  recommendations: string[]
  personalizedSuggestions: Array<{
    type: 'photography_tip' | 'style_suggestion' | 'location_recommendation' | 'equipment_suggestion'
    title: string
    description: string
    confidence: number
  }>
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
