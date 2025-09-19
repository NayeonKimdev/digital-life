// 캐싱 시스템 및 성능 모니터링
// 분석 결과 캐싱과 성능 최적화를 위한 유틸리티

import { PersonalAnalysisResult, PersonalDataPoint } from './personalDataAnalyzer'
import { UploadedFile } from '@/types'

// 캐시 인터페이스
interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  key: string
}

// 성능 메트릭 인터페이스
interface PerformanceMetrics {
  executionTime: number
  memoryUsage: number
  cacheHitRate: number
  filesProcessed: number
  analysisSteps: Array<{
    step: string
    duration: number
    memoryDelta: number
  }>
}

// 캐시 관리자 클래스
export class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize = 100 // 최대 캐시 항목 수
  private defaultTTL = 24 * 60 * 60 * 1000 // 24시간 (밀리초)

  constructor(maxSize: number = 100, defaultTTL: number = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTL
  }

  // 캐시 키 생성
  private generateCacheKey(files: UploadedFile[], analysisType: string): string {
    const fileHashes = files.map(file => {
      const fileInfo = `${file.name}_${file.size}_${file.lastModified}`
      return this.simpleHash(fileInfo)
    }).sort().join('_')
    
    return `${analysisType}_${this.simpleHash(fileHashes)}`
  }

  // 간단한 해시 함수
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 32비트 정수로 변환
    }
    return Math.abs(hash).toString(36)
  }

  // 캐시에서 데이터 가져오기
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // 만료 확인
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // 캐시에 데이터 저장
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const expiresAt = now + (ttl || this.defaultTTL)

    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      key
    })
  }

  // 가장 오래된 항목 제거
  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  // 캐시 통계
  getStats(): { size: number; hitRate: number; oldestEntry: number } {
    let oldestTime = Date.now()
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0, // 실제로는 히트/미스 카운터 필요
      oldestEntry: oldestTime
    }
  }

  // 캐시 클리어
  clear(): void {
    this.cache.clear()
  }

  // 특정 패턴의 캐시 항목 제거
  clearPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

// 성능 모니터링 클래스
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    executionTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    filesProcessed: 0,
    analysisSteps: []
  }

  private startTime = 0
  private startMemory = 0
  private stepStartTime = 0
  private stepStartMemory = 0

  // 분석 시작
  startAnalysis(filesCount: number): void {
    this.startTime = performance.now()
    this.startMemory = this.getMemoryUsage()
    this.metrics.filesProcessed = filesCount
    this.metrics.analysisSteps = []
  }

  // 단계 시작
  startStep(stepName: string): void {
    this.stepStartTime = performance.now()
    this.stepStartMemory = this.getMemoryUsage()
  }

  // 단계 완료
  endStep(stepName: string): void {
    const stepDuration = performance.now() - this.stepStartTime
    const stepMemoryDelta = this.getMemoryUsage() - this.stepStartMemory

    this.metrics.analysisSteps.push({
      step: stepName,
      duration: stepDuration,
      memoryDelta: stepMemoryDelta
    })
  }

  // 분석 완료
  endAnalysis(): PerformanceMetrics {
    this.metrics.executionTime = performance.now() - this.startTime
    this.metrics.memoryUsage = this.getMemoryUsage() - this.startMemory

    return { ...this.metrics }
  }

  // 메모리 사용량 측정 (브라우저 환경)
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  // 성능 리포트 생성
  generateReport(): string {
    const report = [
      '=== 성능 분석 리포트 ===',
      `총 실행 시간: ${this.metrics.executionTime.toFixed(2)}ms`,
      `메모리 사용량: ${this.metrics.memoryUsage.toFixed(2)}MB`,
      `처리된 파일 수: ${this.metrics.filesProcessed}`,
      '',
      '단계별 분석:'
    ]

    this.metrics.analysisSteps.forEach(step => {
      report.push(`  ${step.step}: ${step.duration.toFixed(2)}ms (메모리: ${step.memoryDelta.toFixed(2)}MB)`)
    })

    return report.join('\n')
  }
}

// 최적화된 분석 파이프라인
export class OptimizedAnalysisPipeline {
  private cacheManager: CacheManager
  private performanceMonitor: PerformanceMonitor
  private maxConcurrentFiles = 5 // 동시 처리할 최대 파일 수

  constructor(cacheSize: number = 100, cacheTTL: number = 24 * 60 * 60 * 1000) {
    this.cacheManager = new CacheManager(cacheSize, cacheTTL)
    this.performanceMonitor = new PerformanceMonitor()
  }

  // 최적화된 분석 실행
  async runOptimizedAnalysis(
    files: UploadedFile[],
    analysisType: string = 'complete'
  ): Promise<PersonalAnalysisResult> {
    // 캐시 확인
    const cacheKey = this.cacheManager.generateCacheKey(files, analysisType)
    const cachedResult = this.cacheManager.get<PersonalAnalysisResult>(cacheKey)
    
    if (cachedResult) {
      console.log('📦 캐시에서 분석 결과 로드됨')
      return cachedResult
    }

    // 성능 모니터링 시작
    this.performanceMonitor.startAnalysis(files.length)

    try {
      // 1단계: 파일 전처리
      this.performanceMonitor.startStep('파일 전처리')
      const preprocessedFiles = await this.preprocessFiles(files)
      this.performanceMonitor.endStep('파일 전처리')

      // 2단계: 메타데이터 추출 (병렬 처리)
      this.performanceMonitor.startStep('메타데이터 추출')
      const metadataResults = await this.extractMetadataParallel(preprocessedFiles)
      this.performanceMonitor.endStep('메타데이터 추출')

      // 3단계: 시간 패턴 분석
      this.performanceMonitor.startStep('시간 패턴 분석')
      const timePatterns = await this.analyzeTimePatterns(metadataResults)
      this.performanceMonitor.endStep('시간 패턴 분석')

      // 4단계: 콘텐츠 분석 (병렬 처리)
      this.performanceMonitor.startStep('콘텐츠 분석')
      const contentPatterns = await this.analyzeContentParallel(metadataResults)
      this.performanceMonitor.endStep('콘텐츠 분석')

      // 5단계: 감정 분석
      this.performanceMonitor.startStep('감정 분석')
      const emotionalAnalysis = await this.analyzeEmotions(metadataResults)
      this.performanceMonitor.endStep('감정 분석')

      // 6단계: 개인화 추천
      this.performanceMonitor.startStep('개인화 추천')
      const recommendations = await this.generateRecommendations(
        timePatterns,
        contentPatterns,
        emotionalAnalysis
      )
      this.performanceMonitor.endStep('개인화 추천')

      // 결과 조합
      const result: PersonalAnalysisResult = {
        dataSummary: {
          totalFilesProcessed: files.length,
          dataTypes: this.calculateDataTypes(metadataResults),
          timeRange: this.calculateTimeRange(metadataResults)
        },
        behaviorPatterns: {
          timePatterns,
          contentPatterns
        },
        deepAnalysis: {
          emotionalPsychology: emotionalAnalysis
        },
        recommendations,
        processingTime: 0, // 성능 모니터에서 설정됨
        analysisDate: new Date().toISOString()
      }

      // 성능 모니터링 완료
      const metrics = this.performanceMonitor.endAnalysis()
      result.processingTime = metrics.executionTime

      // 결과를 캐시에 저장
      this.cacheManager.set(cacheKey, result)

      // 성능 리포트 출력
      console.log(this.performanceMonitor.generateReport())

      return result

    } catch (error) {
      console.error('분석 중 오류 발생:', error)
      throw error
    }
  }

  // 파일 전처리
  private async preprocessFiles(files: UploadedFile[]): Promise<UploadedFile[]> {
    // 파일 크기 및 타입 검증
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      return file.size <= maxSize && this.isSupportedFileType(file.type)
    })

    console.log(`전처리 완료: ${validFiles.length}/${files.length} 파일`)
    return validFiles
  }

  // 지원되는 파일 타입 확인
  private isSupportedFileType(type: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/json',
      'text/plain',
      'text/csv'
    ]
    return supportedTypes.includes(type)
  }

  // 병렬 메타데이터 추출
  private async extractMetadataParallel(files: UploadedFile[]): Promise<PersonalDataPoint[]> {
    const chunks = this.chunkArray(files, this.maxConcurrentFiles)
    const allResults: PersonalDataPoint[] = []

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(file => this.extractFileMetadata(file))
      )
      allResults.push(...chunkResults.filter(result => result !== null))
    }

    return allResults
  }

  // 파일을 청크로 나누기
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  // 개별 파일 메타데이터 추출
  private async extractFileMetadata(file: UploadedFile): Promise<PersonalDataPoint | null> {
    try {
      const timestamp = new Date(file.lastModified)
      
      // 기본 메타데이터 추출
      const metadata: Record<string, any> = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        lastModified: file.lastModified
      }

      // 파일 타입별 추가 메타데이터
      if (file.imageMetadata) {
        metadata.imageMetadata = file.imageMetadata
      }
      
      if (file.content) {
        metadata.content = file.content
      }

      // 감정 점수 및 중요도 점수 계산 (간단한 구현)
      const emotionalScore = this.calculateEmotionalScore(file)
      const importanceScore = this.calculateImportanceScore(file)

      return {
        timestamp,
        dataType: this.getDataTypeFromFile(file),
        content: file.name,
        metadata,
        emotionalScore,
        importanceScore,
        fileId: file.id
      }
    } catch (error) {
      console.error(`파일 메타데이터 추출 실패: ${file.name}`, error)
      return null
    }
  }

  // 파일 타입에서 데이터 타입 결정
  private getDataTypeFromFile(file: UploadedFile): PersonalDataPoint['dataType'] {
    if (file.type.startsWith('image/')) return 'photo'
    if (file.type === 'application/json') return 'json_data'
    if (file.type === 'text/plain') return 'document'
    return 'document'
  }

  // 감정 점수 계산
  private calculateEmotionalScore(file: UploadedFile): number {
    // 간단한 감정 점수 계산 로직
    let score = 0
    
    if (file.imageMetadata?.colors?.mood) {
      const mood = file.imageMetadata.colors.mood
      if (mood === 'warm' || mood === 'vibrant') score += 0.3
      if (mood === 'cool' || mood === 'muted') score -= 0.1
    }
    
    return Math.max(-1, Math.min(1, score))
  }

  // 중요도 점수 계산
  private calculateImportanceScore(file: UploadedFile): number {
    let score = 0
    
    // 파일 크기 기반
    score += Math.min(file.size / (1024 * 1024), 1) * 0.2
    
    // 이미지 메타데이터 기반
    if (file.imageMetadata) {
      score += 0.3
      if (file.imageMetadata.location) score += 0.2
      if (file.imageMetadata.tags && file.imageMetadata.tags.length > 0) {
        score += Math.min(file.imageMetadata.tags.length / 10, 0.3)
      }
    }
    
    return Math.max(0, Math.min(1, score))
  }

  // 시간 패턴 분석
  private async analyzeTimePatterns(dataPoints: PersonalDataPoint[]): Promise<any> {
    // 실제 구현에서는 더 정교한 분석 수행
    await new Promise(resolve => setTimeout(resolve, 100)) // 시뮬레이션
    
    const hourlyActivity: Record<number, number> = {}
    const dailyActivity: Record<string, number> = {}
    
    dataPoints.forEach(point => {
      const hour = point.timestamp.getHours()
      const day = point.timestamp.toLocaleDateString('ko-KR', { weekday: 'long' })
      
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
      dailyActivity[day] = (dailyActivity[day] || 0) + 1
    })

    return {
      hourlyActivity,
      dailyActivity,
      weekendVsWeekday: { weekend: 0, weekday: 0 },
      sleepPatternEstimation: {
        estimatedSleepStart: 23,
        estimatedSleepEnd: 7,
        estimatedSleepDuration: 8,
        sleepQualityIndicator: 'good' as const
      },
      mostActiveHours: Object.entries(hourlyActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour)),
      dataTypeByHour: {}
    }
  }

  // 병렬 콘텐츠 분석
  private async analyzeContentParallel(dataPoints: PersonalDataPoint[]): Promise<any> {
    // 실제 구현에서는 더 정교한 분석 수행
    await new Promise(resolve => setTimeout(resolve, 150)) // 시뮬레이션
    
    const textData = dataPoints.filter(point => 
      point.dataType === 'document' || point.dataType === 'message'
    )
    
    const keywords = textData.length > 0 
      ? [{ keyword: '분석', score: 0.8 }, { keyword: '데이터', score: 0.6 }]
      : []
    
    const emotionalScores = dataPoints.map(point => point.emotionalScore)
    const averageEmotionalScore = emotionalScores.length > 0
      ? emotionalScores.reduce((sum, score) => sum + score, 0) / emotionalScores.length
      : 0

    return {
      topKeywords: keywords,
      emotionTrend: {},
      averageEmotionalScore,
      emotionalVolatility: 0.1,
      contentVolumeByType: dataPoints.reduce((acc, point) => {
        acc[point.dataType] = (acc[point.dataType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  // 감정 분석
  private async analyzeEmotions(dataPoints: PersonalDataPoint[]): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200)) // 시뮬레이션
    
    return {
      emotionalClusters: {},
      stressPeriods: [],
      emotionalStability: 0.75,
      peakEmotionalHours: {},
      emotionalRecoveryTime: 12.5
    }
  }

  // 개인화 추천 생성
  private async generateRecommendations(
    timePatterns: any,
    contentPatterns: any,
    emotionalAnalysis: any
  ): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100)) // 시뮬레이션
    
    return {
      immediate: {
        optimalWorkHours: ['오전 9시에 중요한 작업을 시작하세요'],
        contentSuggestions: ['관심 있는 주제를 더 탐색해보세요'],
        socialActivities: ['새로운 사람들과 만나보세요'],
        wellnessTips: ['규칙적인 운동을 시작해보세요']
      },
      longterm: {
        hobbyDevelopment: ['새로운 취미를 찾아보세요'],
        careerDirection: ['전문성을 높이는 학습을 고려해보세요'],
        relationshipImprovement: ['소통 능력을 향상시켜보세요'],
        personalGrowth: ['자기계발에 투자해보세요']
      }
    }
  }

  // 데이터 타입 계산
  private calculateDataTypes(dataPoints: PersonalDataPoint[]): Record<string, number> {
    return dataPoints.reduce((acc, point) => {
      acc[point.dataType] = (acc[point.dataType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // 시간 범위 계산
  private calculateTimeRange(dataPoints: PersonalDataPoint[]): { start: string | null; end: string | null } {
    if (dataPoints.length === 0) {
      return { start: null, end: null }
    }

    const timestamps = dataPoints.map(point => point.timestamp.getTime())
    const start = Math.min(...timestamps)
    const end = Math.max(...timestamps)

    return {
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString()
    }
  }

  // 캐시 통계 조회
  getCacheStats(): { size: number; hitRate: number; oldestEntry: number } {
    return this.cacheManager.getStats()
  }

  // 캐시 클리어
  clearCache(): void {
    this.cacheManager.clear()
  }
}

// 싱글톤 인스턴스
export const optimizedAnalysisPipeline = new OptimizedAnalysisPipeline()
