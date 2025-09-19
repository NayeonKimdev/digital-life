// Personal Data Analysis Pipeline - TypeScript Implementation
// 개인 디지털 활동 데이터를 종합 분석하는 시스템

import { UploadedFile, ImageMetadata, ImageContentAnalysis, ObjectDetectionResult } from '@/types'

// 개인 데이터 포인트 구조체
export interface PersonalDataPoint {
  timestamp: Date
  dataType: 'message' | 'search' | 'photo' | 'document' | 'voice' | 'json_data'
  content: string
  metadata: Record<string, any>
  emotionalScore: number
  importanceScore: number
  fileId?: string
}

// 행동 패턴 분석 결과
export interface BehaviorPatterns {
  timePatterns: {
    hourlyActivity: Record<number, number>
    dailyActivity: Record<string, number>
    weekendVsWeekday: {
      weekend: number
      weekday: number
    }
    sleepPatternEstimation: {
      estimatedSleepStart: number
      estimatedSleepEnd: number
      estimatedSleepDuration: number
      sleepQualityIndicator: 'good' | 'poor'
    }
    mostActiveHours: number[]
    dataTypeByHour: Record<number, Record<string, number>>
  }
  contentPatterns: {
    topKeywords: Array<{ keyword: string; score: number }>
    emotionTrend: Record<string, number>
    averageEmotionalScore: number
    emotionalVolatility: number
    contentVolumeByType: Record<string, number>
  }
}

// 감정/심리 분석 결과
export interface EmotionalPsychology {
  emotionalClusters: Record<string, {
    size: number
    avgEmotion: number
    avgImportance: number
    commonHours: number[]
  }>
  stressPeriods: string[]
  emotionalStability: number
  peakEmotionalHours: Record<number, number>
  emotionalRecoveryTime: number
}

// 개인화 추천 결과
export interface PersonalizationRecommendations {
  immediate: {
    optimalWorkHours: string[]
    contentSuggestions: string[]
    socialActivities: string[]
    wellnessTips: string[]
  }
  longterm: {
    hobbyDevelopment: string[]
    careerDirection: string[]
    relationshipImprovement: string[]
    personalGrowth: string[]
  }
}

// 분석 결과 통합
export interface PersonalAnalysisResult {
  dataSummary: {
    totalFilesProcessed: number
    dataTypes: Record<string, number>
    timeRange: {
      start: string | null
      end: string | null
    }
  }
  behaviorPatterns: BehaviorPatterns
  deepAnalysis: {
    emotionalPsychology: EmotionalPsychology
  }
  recommendations: PersonalizationRecommendations
  processingTime: number
  analysisDate: string
}

// 텍스트 분석기 클래스
class TextAnalyzer {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    '이', '그', '저', '의', '가', '을', '를', '에', '에서', '로', '으로', '와', '과', '도', '는', '은'
  ])

  analyzeTextEmotion(text: string): Record<string, number> {
    // 간단한 감정 분석 (실제로는 더 정교한 NLP 모델 사용)
    const positiveWords = ['좋', '행복', '즐거', '기쁨', '사랑', '웃음', '멋', '훌륭', '완벽']
    const negativeWords = ['나쁜', '슬픔', '화', '짜증', '실망', '우울', '힘들', '어려운', '문제']
    
    const words = text.toLowerCase().split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0
    
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++
    })
    
    const totalWords = words.length
    const polarity = totalWords > 0 ? (positiveCount - negativeCount) / totalWords : 0
    const subjectivity = totalWords > 0 ? (positiveCount + negativeCount) / totalWords : 0
    
    return {
      polarity: Math.max(-1, Math.min(1, polarity)),
      subjectivity: Math.max(0, Math.min(1, subjectivity)),
      wordCount: totalWords,
      exclamationCount: (text.match(/!/g) || []).length,
      questionCount: (text.match(/\?/g) || []).length,
      capsRatio: text.length > 0 ? (text.match(/[A-Z가-힣]/g) || []).length / text.length : 0
    }
  }

  extractKeywords(texts: string[]): Array<{ keyword: string; score: number }> {
    if (texts.length === 0) return []
    
    const wordFreq: Record<string, number> = {}
    const totalWords = texts.reduce((sum, text) => sum + text.split(/\s+/).length, 0)
    
    texts.forEach(text => {
      const words = text.toLowerCase().split(/\s+/)
        .filter(word => word.length > 1 && !this.stopWords.has(word))
      
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      })
    })
    
    return Object.entries(wordFreq)
      .map(([keyword, count]) => ({
        keyword,
        score: count / totalWords
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
  }
}

// 이미지 분석기 클래스
class ImageAnalyzer {
  extractImageFeatures(imageMetadata: ImageMetadata, contentAnalysis: ImageContentAnalysis): Record<string, any> {
    const features: Record<string, any> = {}
    
    // 객체 정보 추출
    features.objects = contentAnalysis.objects.map(obj => ({
      object: obj.name,
      confidence: obj.confidence
    }))
    
    // 장면 이해 (시뮬레이션)
    const scenePrompts = [
      'a photo of people', 'indoor scene', 'outdoor scene', 
      'food', 'travel', 'work', 'leisure', 'social gathering',
      'nature', 'urban environment', 'happy moment', 'sad moment'
    ]
    
    const sceneScores: Record<string, number> = {}
    scenePrompts.forEach(prompt => {
      sceneScores[prompt] = Math.random() * 0.5 + 0.3 // 시뮬레이션 점수
    })
    
    features.sceneUnderstanding = sceneScores
    
    // 색상 분석
    features.dominantColors = imageMetadata.colors?.dominant || ['#FF6B6B', '#4ECDC4', '#45B7D1']
    
    // 기본 메타데이터
    features.imageSize = [imageMetadata.width, imageMetadata.height]
    features.brightness = this.estimateBrightness(imageMetadata.colors?.palette || [])
    
    return features
  }
  
  private estimateBrightness(colors: string[]): number {
    // 색상에서 밝기 추정
    return colors.length > 0 ? Math.random() * 100 + 50 : 75
  }
}

// 개인 데이터 분석기 메인 클래스
export class PersonalDataAnalyzer {
  private textAnalyzer = new TextAnalyzer()
  private imageAnalyzer = new ImageAnalyzer()
  private dataPoints: PersonalDataPoint[] = []

  async processUploadedFiles(files: UploadedFile[]): Promise<PersonalDataPoint[]> {
    const dataPoints: PersonalDataPoint[] = []
    
    for (const file of files) {
      try {
        let dataPoint: PersonalDataPoint | null = null
        
        if (file.type.startsWith('image/')) {
          dataPoint = await this.processImageFile(file)
        } else if (file.type === 'application/json') {
          dataPoint = await this.processJsonFile(file)
        } else if (file.type === 'text/plain') {
          dataPoint = await this.processTextFile(file)
        }
        
        if (dataPoint) {
          dataPoints.push(dataPoint)
          this.dataPoints.push(dataPoint)
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error)
      }
    }
    
    return dataPoints
  }

  private async processImageFile(file: UploadedFile): Promise<PersonalDataPoint> {
    const timestamp = new Date(file.lastModified)
    
    // 이미지 특징 추출
    let features: Record<string, any> = {}
    
    if (file.imageMetadata && file.imageContentAnalysis) {
      features = this.imageAnalyzer.extractImageFeatures(
        file.imageMetadata, 
        file.imageContentAnalysis
      )
    }
    
    // 감정 점수 계산 (장면 이해 기반)
    const sceneScores = features.sceneUnderstanding || {}
    const emotionalScore = (sceneScores['happy moment'] || 0) - (sceneScores['sad moment'] || 0)
    
    // 중요도 점수 계산
    const importanceScore = (
      (sceneScores['a photo of people'] || 0) * 2 +
      (sceneScores['travel'] || 0) * 1.5 +
      (sceneScores['social gathering'] || 0) * 1.5
    )
    
    return {
      timestamp,
      dataType: 'photo',
      content: file.name,
      metadata: features,
      emotionalScore,
      importanceScore,
      fileId: file.id
    }
  }

  private async processJsonFile(file: UploadedFile): Promise<PersonalDataPoint> {
    const timestamp = new Date(file.lastModified)
    
    return {
      timestamp,
      dataType: 'json_data',
      content: JSON.stringify(file.content || {}),
      metadata: file.content || {},
      emotionalScore: 0.0,
      importanceScore: 1.0,
      fileId: file.id
    }
  }

  private async processTextFile(file: UploadedFile): Promise<PersonalDataPoint> {
    const timestamp = new Date(file.lastModified)
    
    // 텍스트 내용 추출 (실제로는 파일에서 읽어야 함)
    const content = typeof file.content === 'string' ? file.content : JSON.stringify(file.content || '')
    
    // 텍스트 감정 분석
    const emotionAnalysis = this.textAnalyzer.analyzeTextEmotion(content)
    
    return {
      timestamp,
      dataType: 'document',
      content,
      metadata: emotionAnalysis,
      emotionalScore: emotionAnalysis.polarity,
      importanceScore: emotionAnalysis.wordCount / 100,
      fileId: file.id
    }
  }
}

// 행동 패턴 분석기
export class BehaviorPatternAnalyzer {
  constructor(private analyzer: PersonalDataAnalyzer) {}

  analyzeTimePatterns(dataPoints: PersonalDataPoint[]): BehaviorPatterns['timePatterns'] {
    if (dataPoints.length === 0) {
      return {
        hourlyActivity: {},
        dailyActivity: {},
        weekendVsWeekday: { weekend: 0, weekday: 0 },
        sleepPatternEstimation: {
          estimatedSleepStart: 23,
          estimatedSleepEnd: 7,
          estimatedSleepDuration: 8,
          sleepQualityIndicator: 'good'
        },
        mostActiveHours: [],
        dataTypeByHour: {}
      }
    }

    // 시간별 활동 분석
    const hourlyActivity: Record<number, number> = {}
    const dailyActivity: Record<string, number> = {}
    const weekendCount = { weekend: 0, weekday: 0 }
    const dataTypeByHour: Record<number, Record<string, number>> = {}

    dataPoints.forEach(point => {
      const hour = point.timestamp.getHours()
      const dayOfWeek = point.timestamp.toLocaleDateString('ko-KR', { weekday: 'long' })
      const isWeekend = point.timestamp.getDay() >= 5

      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
      dailyActivity[dayOfWeek] = (dailyActivity[dayOfWeek] || 0) + 1
      
      if (isWeekend) {
        weekendCount.weekend++
      } else {
        weekendCount.weekday++
      }

      if (!dataTypeByHour[hour]) {
        dataTypeByHour[hour] = {}
      }
      dataTypeByHour[hour][point.dataType] = (dataTypeByHour[hour][point.dataType] || 0) + 1
    })

    // 가장 활발한 시간대 찾기
    const mostActiveHours = Object.entries(hourlyActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))

    // 수면 패턴 추정
    const sleepPattern = this.estimateSleepPattern(hourlyActivity)

    return {
      hourlyActivity,
      dailyActivity,
      weekendVsWeekday: weekendCount,
      sleepPatternEstimation: sleepPattern,
      mostActiveHours,
      dataTypeByHour
    }
  }

  analyzeContentPatterns(dataPoints: PersonalDataPoint[]): BehaviorPatterns['contentPatterns'] {
    if (dataPoints.length === 0) {
      return {
        topKeywords: [],
        emotionTrend: {},
        averageEmotionalScore: 0,
        emotionalVolatility: 0,
        contentVolumeByType: {}
      }
    }

    // 텍스트 데이터만 추출
    const textData = dataPoints.filter(point => 
      point.dataType === 'document' || point.dataType === 'message'
    )

    const texts = textData.map(point => point.content)
    const keywords = this.analyzer.textAnalyzer.extractKeywords(texts)

    // 감정 변화 추이
    const emotionTrend: Record<string, number> = {}
    const emotionalScores = dataPoints.map(point => point.emotionalScore)
    
    const averageEmotionalScore = emotionalScores.length > 0 
      ? emotionalScores.reduce((sum, score) => sum + score, 0) / emotionalScores.length 
      : 0

    const emotionalVolatility = emotionalScores.length > 1
      ? Math.sqrt(emotionalScores.reduce((sum, score) => sum + Math.pow(score - averageEmotionalScore, 2), 0) / emotionalScores.length)
      : 0

    // 데이터 타입별 볼륨
    const contentVolumeByType: Record<string, number> = {}
    dataPoints.forEach(point => {
      contentVolumeByType[point.dataType] = (contentVolumeByType[point.dataType] || 0) + 1
    })

    return {
      topKeywords: keywords.slice(0, 10),
      emotionTrend,
      averageEmotionalScore,
      emotionalVolatility,
      contentVolumeByType
    }
  }

  private estimateSleepPattern(hourlyActivity: Record<number, number>): BehaviorPatterns['timePatterns']['sleepPatternEstimation'] {
    const hours = Object.keys(hourlyActivity).map(Number).sort((a, b) => a - b)
    const activities = hours.map(hour => hourlyActivity[hour] || 0)
    
    if (activities.length === 0) {
      return {
        estimatedSleepStart: 23,
        estimatedSleepEnd: 7,
        estimatedSleepDuration: 8,
        sleepQualityIndicator: 'good'
      }
    }

    const avgActivity = activities.reduce((sum, act) => sum + act, 0) / activities.length
    const lowActivityThreshold = avgActivity * 0.3
    
    const lowActivityHours = hours.filter(hour => (hourlyActivity[hour] || 0) <= lowActivityThreshold)
    
    let estimatedSleepStart = 23
    let estimatedSleepEnd = 7
    let estimatedSleepDuration = 8

    if (lowActivityHours.length > 0) {
      estimatedSleepStart = Math.min(...lowActivityHours)
      estimatedSleepEnd = Math.max(...lowActivityHours)
      estimatedSleepDuration = lowActivityHours.length
    }

    const sleepQualityIndicator = (estimatedSleepDuration >= 6 && estimatedSleepDuration <= 9) ? 'good' : 'poor'

    return {
      estimatedSleepStart,
      estimatedSleepEnd,
      estimatedSleepDuration,
      sleepQualityIndicator
    }
  }
}

// 심화 분석기
export class DeepAnalyzer {
  constructor(private analyzer: PersonalDataAnalyzer) {}

  analyzeEmotionalPsychology(dataPoints: PersonalDataPoint[]): EmotionalPsychology {
    if (dataPoints.length === 0) {
      return {
        emotionalClusters: {},
        stressPeriods: [],
        emotionalStability: 1.0,
        peakEmotionalHours: {},
        emotionalRecoveryTime: 24.0
      }
    }

    // 감정 상태 클러스터링 (간단한 구현)
    const emotionalFeatures = dataPoints.map(point => ({
      emotionalScore: point.emotionalScore,
      importanceScore: point.importanceScore,
      hour: point.timestamp.getHours()
    }))

    const clusters = this.performSimpleClustering(emotionalFeatures)
    
    // 스트레스 시기 감지
    const stressPeriods = this.detectStressPeriods(dataPoints)
    
    // 감정 안정성 계산
    const emotionalScores = dataPoints.map(point => point.emotionalScore)
    const emotionalStability = emotionalScores.length > 0 
      ? 1 / (this.calculateStandardDeviation(emotionalScores) + 0.001)
      : 1.0

    // 피크 감정 시간대
    const peakEmotionalHours: Record<number, number> = {}
    dataPoints.forEach(point => {
      const hour = point.timestamp.getHours()
      peakEmotionalHours[hour] = (peakEmotionalHours[hour] || 0) + point.emotionalScore
    })

    // 감정 회복 시간 계산
    const emotionalRecoveryTime = this.calculateRecoveryTime(dataPoints)

    return {
      emotionalClusters: clusters,
      stressPeriods,
      emotionalStability,
      peakEmotionalHours,
      emotionalRecoveryTime
    }
  }

  private performSimpleClustering(features: Array<{emotionalScore: number, importanceScore: number, hour: number}>): Record<string, any> {
    // 간단한 클러스터링 구현
    const clusters: Record<string, any> = {}
    
    if (features.length < 3) return clusters

    // 3개 클러스터로 나누기 (간단한 구현)
    const sortedByEmotion = [...features].sort((a, b) => a.emotionalScore - b.emotionalScore)
    const clusterSize = Math.ceil(sortedByEmotion.length / 3)

    for (let i = 0; i < 3; i++) {
      const startIdx = i * clusterSize
      const endIdx = Math.min(startIdx + clusterSize, sortedByEmotion.length)
      const clusterData = sortedByEmotion.slice(startIdx, endIdx)
      
      if (clusterData.length > 0) {
        clusters[`cluster_${i}`] = {
          size: clusterData.length,
          avgEmotion: clusterData.reduce((sum, item) => sum + item.emotionalScore, 0) / clusterData.length,
          avgImportance: clusterData.reduce((sum, item) => sum + item.importanceScore, 0) / clusterData.length,
          commonHours: clusterData.map(item => item.hour)
        }
      }
    }

    return clusters
  }

  private detectStressPeriods(dataPoints: PersonalDataPoint[]): string[] {
    const emotionalScores = dataPoints.map(point => point.emotionalScore)
    const avgEmotion = emotionalScores.reduce((sum, score) => sum + score, 0) / emotionalScores.length
    const threshold = avgEmotion - this.calculateStandardDeviation(emotionalScores)
    
    return dataPoints
      .filter(point => point.emotionalScore < threshold)
      .map(point => point.timestamp.toISOString())
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    
    return Math.sqrt(variance)
  }

  private calculateRecoveryTime(dataPoints: PersonalDataPoint[]): number {
    // 간단한 회복 시간 계산
    const lowEmotionThreshold = dataPoints.reduce((sum, point) => sum + point.emotionalScore, 0) / dataPoints.length * 0.25
    
    const lowPoints = dataPoints.filter(point => point.emotionalScore <= lowEmotionThreshold)
    const recoveryTimes: number[] = []
    
    lowPoints.forEach((lowPoint, index) => {
      const futureData = dataPoints.slice(index + 1)
      const recoveryPoint = futureData.find(point => point.emotionalScore > lowEmotionThreshold)
      
      if (recoveryPoint) {
        const recoveryTime = (recoveryPoint.timestamp.getTime() - lowPoint.timestamp.getTime()) / (1000 * 60 * 60) // 시간 단위
        recoveryTimes.push(recoveryTime)
      }
    })
    
    return recoveryTimes.length > 0 
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
      : 24.0
  }
}

// 개인화 추천 엔진
export class PersonalizationEngine {
  constructor(private analyzer: PersonalDataAnalyzer) {}

  generateImmediateRecommendations(
    timePatterns: BehaviorPatterns['timePatterns'],
    contentPatterns: BehaviorPatterns['contentPatterns']
  ): PersonalizationRecommendations['immediate'] {
    const recommendations = {
      optimalWorkHours: [] as string[],
      contentSuggestions: [] as string[],
      socialActivities: [] as string[],
      wellnessTips: [] as string[]
    }

    // 최적 작업 시간 추천
    if (timePatterns.mostActiveHours.length > 0) {
      const activeHours = timePatterns.mostActiveHours
      recommendations.optimalWorkHours = [
        `당신의 가장 활발한 시간대는 ${activeHours.join(', ')}시입니다.`,
        `중요한 작업은 ${activeHours[0]}시경에 시작하세요.`
      ]
    }

    // 콘텐츠 추천
    if (contentPatterns.topKeywords.length > 0) {
      const keywords = contentPatterns.topKeywords.slice(0, 5)
      recommendations.contentSuggestions = keywords.map(kw => 
        `'${kw.keyword}' 관련 콘텐츠를 더 탐색해보세요.`
      )
    }

    // 웰빙 팁
    if (timePatterns.sleepPatternEstimation.sleepQualityIndicator === 'poor') {
      recommendations.wellnessTips.push('수면 패턴 개선이 필요합니다. 규칙적인 수면 시간을 유지해보세요.')
    }

    if (contentPatterns.averageEmotionalScore < 0) {
      recommendations.wellnessTips.push('최근 감정 상태가 좋지 않습니다. 스트레스 관리에 주의하세요.')
    }

    return recommendations
  }

  generateLongtermSuggestions(emotionalAnalysis: EmotionalPsychology): PersonalizationRecommendations['longterm'] {
    const suggestions = {
      hobbyDevelopment: [] as string[],
      careerDirection: [] as string[],
      relationshipImprovement: [] as string[],
      personalGrowth: [] as string[]
    }

    // 감정 안정성 기반 제안
    if (emotionalAnalysis.emotionalStability < 0.5) {
      suggestions.personalGrowth.push('감정 관리 기술 개발을 위한 명상이나 요가를 시작해보세요.')
    }

    // 스트레스 시기 기반 제안
    if (emotionalAnalysis.stressPeriods.length > 5) {
      suggestions.personalGrowth.push('스트레스 관리 전략을 개발하고 전문가 상담을 고려해보세요.')
    }

    return suggestions
  }
}

// 메인 분석 시스템
export class PersonalAnalysisSystem {
  private analyzer = new PersonalDataAnalyzer()
  private behaviorAnalyzer = new BehaviorPatternAnalyzer(this.analyzer)
  private deepAnalyzer = new DeepAnalyzer(this.analyzer)
  private personalizationEngine = new PersonalizationEngine(this.analyzer)

  async runCompleteAnalysis(files: UploadedFile[]): Promise<PersonalAnalysisResult> {
    const startTime = performance.now()
    
    console.log('🔄 파일 처리 시작...')
    const dataPoints = await this.analyzer.processUploadedFiles(files)
    console.log(`✅ ${dataPoints.length}개 파일 처리 완료`)

    console.log('📊 행동 패턴 분석 중...')
    const timePatterns = this.behaviorAnalyzer.analyzeTimePatterns(dataPoints)
    const contentPatterns = this.behaviorAnalyzer.analyzeContentPatterns(dataPoints)

    console.log('🧠 심화 분석 중...')
    const emotionalAnalysis = this.deepAnalyzer.analyzeEmotionalPsychology(dataPoints)

    console.log('🎯 개인화 추천 생성 중...')
    const immediateRecommendations = this.personalizationEngine.generateImmediateRecommendations(
      timePatterns, 
      contentPatterns
    )
    const longtermSuggestions = this.personalizationEngine.generateLongtermSuggestions(emotionalAnalysis)

    const endTime = performance.now()
    const processingTime = endTime - startTime

    const results: PersonalAnalysisResult = {
      dataSummary: {
        totalFilesProcessed: dataPoints.length,
        dataTypes: dataPoints.reduce((acc, point) => {
          acc[point.dataType] = (acc[point.dataType] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        timeRange: {
          start: dataPoints.length > 0 ? Math.min(...dataPoints.map(p => p.timestamp.getTime())).toString() : null,
          end: dataPoints.length > 0 ? Math.max(...dataPoints.map(p => p.timestamp.getTime())).toString() : null
        }
      },
      behaviorPatterns: {
        timePatterns,
        contentPatterns
      },
      deepAnalysis: {
        emotionalPsychology: emotionalAnalysis
      },
      recommendations: {
        immediate: immediateRecommendations,
        longterm: longtermSuggestions
      },
      processingTime,
      analysisDate: new Date().toISOString()
    }

    console.log('✨ 분석 완료!')
    return results
  }
}

// 싱글톤 인스턴스
export const personalAnalysisSystem = new PersonalAnalysisSystem()
