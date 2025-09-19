// 성능 모니터링 및 최적화 시스템
// 실시간 성능 추적, 메모리 관리, 사용자 경험 최적화

import { UploadedFile } from '@/types'

// 성능 메트릭 인터페이스
export interface PerformanceMetrics {
  executionTime: number
  memoryUsage: number
  cacheHitRate: number
  filesProcessed: number
  analysisSteps: Array<{
    step: string
    duration: number
    memoryDelta: number
  }>
  userExperience: {
    perceivedPerformance: 'excellent' | 'good' | 'fair' | 'poor'
    loadingTime: number
    responsivenessScore: number
  }
}

// 실시간 성능 모니터
export class RealTimePerformanceMonitor {
  private metrics: PerformanceMetrics
  private observers: Array<(metrics: PerformanceMetrics) => void> = []
  private startTime = 0
  private startMemory = 0
  private stepStartTime = 0
  private stepStartMemory = 0
  private isMonitoring = false

  constructor() {
    this.metrics = {
      executionTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      filesProcessed: 0,
      analysisSteps: [],
      userExperience: {
        perceivedPerformance: 'good',
        loadingTime: 0,
        responsivenessScore: 0
      }
    }
  }

  // 성능 모니터링 시작
  startMonitoring(filesCount: number): void {
    this.isMonitoring = true
    this.startTime = performance.now()
    this.startMemory = this.getMemoryUsage()
    this.metrics.filesProcessed = filesCount
    this.metrics.analysisSteps = []
    this.metrics.userExperience.loadingTime = 0
    
    console.log('🔍 성능 모니터링 시작')
  }

  // 단계별 모니터링 시작
  startStep(stepName: string): void {
    if (!this.isMonitoring) return
    
    this.stepStartTime = performance.now()
    this.stepStartMemory = this.getMemoryUsage()
    
    console.log(`📊 ${stepName} 단계 시작`)
  }

  // 단계별 모니터링 완료
  endStep(stepName: string): void {
    if (!this.isMonitoring) return
    
    const stepDuration = performance.now() - this.stepStartTime
    const stepMemoryDelta = this.getMemoryUsage() - this.stepStartMemory

    this.metrics.analysisSteps.push({
      step: stepName,
      duration: stepDuration,
      memoryDelta: stepMemoryDelta
    })

    // 실시간 업데이트
    this.notifyObservers()
    
    console.log(`✅ ${stepName} 완료 (${stepDuration.toFixed(2)}ms, 메모리: ${stepMemoryDelta.toFixed(2)}MB)`)
  }

  // 모니터링 완료
  endMonitoring(): PerformanceMetrics {
    if (!this.isMonitoring) return this.metrics
    
    this.metrics.executionTime = performance.now() - this.startTime
    this.metrics.memoryUsage = this.getMemoryUsage() - this.startMemory
    this.metrics.userExperience.loadingTime = this.metrics.executionTime
    this.metrics.userExperience.perceivedPerformance = this.calculatePerceivedPerformance()
    this.metrics.userExperience.responsivenessScore = this.calculateResponsivenessScore()
    
    this.isMonitoring = false
    
    console.log('🏁 성능 모니터링 완료')
    console.log(this.generatePerformanceReport())
    
    return { ...this.metrics }
  }

  // 관찰자 패턴 - 실시간 업데이트
  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(callback)
    return () => {
      const index = this.observers.indexOf(callback)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => callback({ ...this.metrics }))
  }

  // 메모리 사용량 측정
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  // 사용자 경험 점수 계산
  private calculatePerceivedPerformance(): 'excellent' | 'good' | 'fair' | 'poor' {
    const totalTime = this.metrics.executionTime
    
    if (totalTime < 1000) return 'excellent'
    if (totalTime < 3000) return 'good'
    if (totalTime < 10000) return 'fair'
    return 'poor'
  }

  // 반응성 점수 계산
  private calculateResponsivenessScore(): number {
    const avgStepTime = this.metrics.analysisSteps.length > 0
      ? this.metrics.analysisSteps.reduce((sum, step) => sum + step.duration, 0) / this.metrics.analysisSteps.length
      : 0
    
    // 반응성 점수 (0-100)
    if (avgStepTime < 100) return 100
    if (avgStepTime < 500) return 80
    if (avgStepTime < 1000) return 60
    if (avgStepTime < 2000) return 40
    return 20
  }

  // 성능 리포트 생성
  generatePerformanceReport(): string {
    const report = [
      '=== 성능 분석 리포트 ===',
      `총 실행 시간: ${this.metrics.executionTime.toFixed(2)}ms`,
      `메모리 사용량: ${this.metrics.memoryUsage.toFixed(2)}MB`,
      `처리된 파일 수: ${this.metrics.filesProcessed}`,
      `사용자 경험: ${this.metrics.userExperience.perceivedPerformance}`,
      `반응성 점수: ${this.metrics.userExperience.responsivenessScore}/100`,
      '',
      '단계별 분석:'
    ]

    this.metrics.analysisSteps.forEach(step => {
      report.push(`  ${step.step}: ${step.duration.toFixed(2)}ms (메모리: ${step.memoryDelta.toFixed(2)}MB)`)
    })

    return report.join('\n')
  }

  // 현재 메트릭 가져오기
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
}

// 메모리 최적화 관리자
export class MemoryOptimizer {
  private maxMemoryMB = 512
  private cleanupThreshold = 0.8 // 80% 사용 시 정리
  private cleanupCallbacks: Array<() => void> = []

  constructor(maxMemoryMB: number = 512) {
    this.maxMemoryMB = maxMemoryMB
  }

  // 메모리 정리 콜백 등록
  registerCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.push(callback)
  }

  // 메모리 사용량 체크 및 정리
  async checkAndCleanup(): Promise<boolean> {
    const currentMemory = this.getMemoryUsage()
    const memoryUsageRatio = currentMemory / this.maxMemoryMB

    if (memoryUsageRatio > this.cleanupThreshold) {
      console.log(`🧹 메모리 정리 시작 (사용률: ${(memoryUsageRatio * 100).toFixed(1)}%)`)
      
      // 등록된 정리 콜백 실행
      for (const callback of this.cleanupCallbacks) {
        try {
          callback()
        } catch (error) {
          console.error('메모리 정리 콜백 실행 중 오류:', error)
        }
      }

      // 가비지 컬렉션 강제 실행 (가능한 경우)
      if ('gc' in window) {
        (window as any).gc()
      }

      // 잠시 대기하여 시스템이 정리할 시간 제공
      await new Promise(resolve => setTimeout(resolve, 100))

      const newMemory = this.getMemoryUsage()
      const freedMemory = currentMemory - newMemory
      
      console.log(`✅ 메모리 정리 완료 (${freedMemory.toFixed(2)}MB 해제)`)
      return true
    }

    return false
  }

  // 메모리 사용량 측정
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  // 메모리 상태 리포트
  getMemoryReport(): { current: number; max: number; usageRatio: number; status: string } {
    const current = this.getMemoryUsage()
    const usageRatio = current / this.maxMemoryMB
    let status = 'good'
    
    if (usageRatio > 0.8) status = 'critical'
    else if (usageRatio > 0.6) status = 'warning'
    else if (usageRatio > 0.4) status = 'moderate'

    return {
      current,
      max: this.maxMemoryMB,
      usageRatio,
      status
    }
  }
}

// 사용자 경험 최적화기
export class UserExperienceOptimizer {
  private loadingStates: Map<string, boolean> = new Map()
  private progressCallbacks: Array<(progress: number, message: string) => void> = []

  // 로딩 상태 관리
  setLoadingState(key: string, isLoading: boolean): void {
    this.loadingStates.set(key, isLoading)
    this.updateOverallLoadingState()
  }

  getLoadingState(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  // 진행률 콜백 등록
  onProgressUpdate(callback: (progress: number, message: string) => void): () => void {
    this.progressCallbacks.push(callback)
    return () => {
      const index = this.progressCallbacks.indexOf(callback)
      if (index > -1) {
        this.progressCallbacks.splice(index, 1)
      }
    }
  }

  // 진행률 업데이트
  updateProgress(progress: number, message: string): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress, message)
      } catch (error) {
        console.error('진행률 콜백 실행 중 오류:', error)
      }
    })
  }

  // 전체 로딩 상태 업데이트
  private updateOverallLoadingState(): void {
    const isLoading = Array.from(this.loadingStates.values()).some(state => state)
    this.updateProgress(isLoading ? 50 : 100, isLoading ? '처리 중...' : '완료')
  }

  // 사용자 피드백 최적화
  optimizeUserFeedback(stepName: string, estimatedTime: number): void {
    const messages = {
      '파일 전처리': '파일을 검증하고 준비하는 중...',
      '메타데이터 추출': '파일 정보를 분석하는 중...',
      '시간 패턴 분석': '활동 패턴을 분석하는 중...',
      '콘텐츠 분석': '콘텐츠를 분석하는 중...',
      '감정 분석': '감정 상태를 분석하는 중...',
      '개인화 추천': '맞춤형 추천을 생성하는 중...'
    }

    const message = messages[stepName as keyof typeof messages] || `${stepName} 중...`
    this.updateProgress(0, message)

    // 예상 시간에 따른 추가 피드백
    if (estimatedTime > 5000) {
      setTimeout(() => {
        this.updateProgress(25, `${message} (시간이 조금 더 걸릴 수 있습니다)`)
      }, 2000)
    }
  }
}

// 성능 벤치마크 도구
export class PerformanceBenchmark {
  private results: Array<{
    name: string
    executionTime: number
    memoryUsage: number
    filesProcessed: number
    timestamp: number
  }> = []

  // 벤치마크 실행
  async runBenchmark(
    name: string,
    testFunction: () => Promise<any>,
    files: UploadedFile[]
  ): Promise<{ executionTime: number; memoryUsage: number; success: boolean }> {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()
    
    try {
      await testFunction()
      
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      const result = {
        name,
        executionTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
        filesProcessed: files.length,
        timestamp: Date.now()
      }
      
      this.results.push(result)
      
      console.log(`🏃‍♂️ 벤치마크 완료: ${name}`)
      console.log(`  실행 시간: ${result.executionTime.toFixed(2)}ms`)
      console.log(`  메모리 사용: ${result.memoryUsage.toFixed(2)}MB`)
      
      return {
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage,
        success: true
      }
    } catch (error) {
      console.error(`❌ 벤치마크 실패: ${name}`, error)
      return {
        executionTime: 0,
        memoryUsage: 0,
        success: false
      }
    }
  }

  // 벤치마크 결과 비교
  compareResults(): string {
    if (this.results.length < 2) {
      return '비교할 결과가 충분하지 않습니다.'
    }

    const latest = this.results[this.results.length - 1]
    const previous = this.results[this.results.length - 2]
    
    const timeImprovement = ((previous.executionTime - latest.executionTime) / previous.executionTime) * 100
    const memoryImprovement = ((previous.memoryUsage - latest.memoryUsage) / previous.memoryUsage) * 100
    
    return [
      '=== 벤치마크 비교 결과 ===',
      `이전 실행 시간: ${previous.executionTime.toFixed(2)}ms`,
      `현재 실행 시간: ${latest.executionTime.toFixed(2)}ms`,
      `시간 개선: ${timeImprovement > 0 ? '+' : ''}${timeImprovement.toFixed(1)}%`,
      '',
      `이전 메모리 사용: ${previous.memoryUsage.toFixed(2)}MB`,
      `현재 메모리 사용: ${latest.memoryUsage.toFixed(2)}MB`,
      `메모리 개선: ${memoryImprovement > 0 ? '+' : ''}${memoryImprovement.toFixed(1)}%`
    ].join('\n')
  }

  // 메모리 사용량 측정
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  // 모든 결과 가져오기
  getAllResults(): Array<{
    name: string
    executionTime: number
    memoryUsage: number
    filesProcessed: number
    timestamp: number
  }> {
    return [...this.results]
  }

  // 결과 클리어
  clearResults(): void {
    this.results = []
  }
}

// 통합 성능 관리자
export class IntegratedPerformanceManager {
  private performanceMonitor = new RealTimePerformanceMonitor()
  private memoryOptimizer = new MemoryOptimizer()
  private uxOptimizer = new UserExperienceOptimizer()
  private benchmark = new PerformanceBenchmark()

  constructor() {
    // 메모리 정리 콜백 등록
    this.memoryOptimizer.registerCleanupCallback(() => {
      // 캐시 정리 등 메모리 정리 작업
      console.log('메모리 정리 작업 실행')
    })
  }

  // 분석 시작
  async startAnalysis(files: UploadedFile[]): Promise<{
    monitor: RealTimePerformanceMonitor
    optimizer: UserExperienceOptimizer
    memoryManager: MemoryOptimizer
  }> {
    this.performanceMonitor.startMonitoring(files.length)
    
    // 메모리 체크
    await this.memoryOptimizer.checkAndCleanup()
    
    return {
      monitor: this.performanceMonitor,
      optimizer: this.uxOptimizer,
      memoryManager: this.memoryOptimizer
    }
  }

  // 분석 완료
  endAnalysis(): PerformanceMetrics {
    return this.performanceMonitor.endMonitoring()
  }

  // 벤치마크 실행
  async runBenchmark(
    name: string,
    testFunction: () => Promise<any>,
    files: UploadedFile[]
  ) {
    return await this.benchmark.runBenchmark(name, testFunction, files)
  }

  // 성능 리포트 생성
  generateComprehensiveReport(): string {
    const performanceReport = this.performanceMonitor.generatePerformanceReport()
    const memoryReport = this.memoryOptimizer.getMemoryReport()
    const benchmarkComparison = this.benchmark.compareResults()
    
    return [
      performanceReport,
      '',
      '=== 메모리 상태 ===',
      `현재 사용량: ${memoryReport.current.toFixed(2)}MB`,
      `최대 허용량: ${memoryReport.max}MB`,
      `사용률: ${(memoryReport.usageRatio * 100).toFixed(1)}%`,
      `상태: ${memoryReport.status}`,
      '',
      benchmarkComparison
    ].join('\n')
  }

  // 모든 컴포넌트 가져오기
  getComponents() {
    return {
      performanceMonitor: this.performanceMonitor,
      memoryOptimizer: this.memoryOptimizer,
      uxOptimizer: this.uxOptimizer,
      benchmark: this.benchmark
    }
  }
}

// 싱글톤 인스턴스
export const integratedPerformanceManager = new IntegratedPerformanceManager()
