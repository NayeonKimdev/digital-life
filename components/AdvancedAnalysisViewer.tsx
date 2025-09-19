// 고급 분석 결과 표시 컴포넌트
// 새로운 개인 데이터 분석 시스템의 결과를 시각화하는 컴포넌트

import React from 'react'
import { PersonalAnalysisResult, BehaviorPatterns, EmotionalPsychology, PerformanceMetrics } from '@/types'

interface AdvancedAnalysisViewerProps {
  analysisResult: PersonalAnalysisResult
  performanceMetrics?: PerformanceMetrics
}

export const AdvancedAnalysisViewer: React.FC<AdvancedAnalysisViewerProps> = ({
  analysisResult,
  performanceMetrics
}) => {
  // 안전한 접근을 위한 기본값 설정
  if (!analysisResult) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">📊 분석 결과를 불러오는 중...</div>
          <div className="text-sm">잠시만 기다려주세요.</div>
        </div>
      </div>
    )
  }

  const dataSummary = analysisResult.dataSummary || {
    totalFilesProcessed: 0,
    dataTypes: {},
    timeRange: { start: null, end: null }
  }

  const behaviorPatterns = analysisResult.behaviorPatterns || {
    timePatterns: {
      hourlyActivity: {},
      dailyActivity: {},
      weekendVsWeekday: { weekend: 0, weekday: 0 },
      sleepPatternEstimation: {
        estimatedSleepStart: 23,
        estimatedSleepEnd: 7,
        estimatedSleepDuration: 8,
        sleepQualityIndicator: 'good' as const
      },
      mostActiveHours: [],
      dataTypeByHour: {}
    },
    contentPatterns: {
      topKeywords: [],
      emotionTrend: {},
      averageEmotionalScore: 0,
      emotionalVolatility: 0,
      contentVolumeByType: {}
    }
  }

  const emotionalAnalysis = analysisResult.deepAnalysis?.emotionalPsychology || {
    emotionalClusters: {},
    stressPeriods: [],
    emotionalStability: 1.0,
    peakEmotionalHours: {},
    emotionalRecoveryTime: 24.0
  }

  const recommendations = analysisResult.recommendations || {
    immediate: {
      optimalWorkHours: [],
      contentSuggestions: [],
      socialActivities: [],
      wellnessTips: []
    },
    longterm: {
      hobbyDevelopment: [],
      careerDirection: [],
      relationshipImprovement: [],
      personalGrowth: []
    }
  }

  return (
    <div className="space-y-6">
      {/* 데이터 요약 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">📊 데이터 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {dataSummary.totalFilesProcessed}
            </div>
            <div className="text-sm text-gray-600">처리된 파일</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.keys(dataSummary.dataTypes).length}
            </div>
            <div className="text-sm text-gray-600">데이터 타입</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(analysisResult.processingTime || 0).toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-600">처리 시간</div>
          </div>
        </div>
      </div>

      {/* 행동 패턴 분석 */}
      <BehaviorPatternsViewer patterns={behaviorPatterns} />

      {/* 감정/심리 분석 */}
      <EmotionalAnalysisViewer analysis={emotionalAnalysis} />

      {/* 개인화 추천 */}
      <PersonalizationViewer recommendations={recommendations} />

      {/* 성능 메트릭 */}
      {performanceMetrics && (
        <PerformanceMetricsViewer metrics={performanceMetrics} />
      )}
    </div>
  )
}

// 행동 패턴 시각화 컴포넌트
const BehaviorPatternsViewer: React.FC<{ patterns: BehaviorPatterns }> = ({ patterns }) => {
  const hourlyActivity = patterns?.timePatterns?.hourlyActivity || {}
  const sleepPattern = patterns?.timePatterns?.sleepPatternEstimation || {
    estimatedSleepStart: 23,
    estimatedSleepEnd: 7,
    estimatedSleepDuration: 8,
    sleepQualityIndicator: 'good' as const
  }
  const topKeywords = patterns?.contentPatterns?.topKeywords || []

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">⏰ 행동 패턴 분석</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시간대별 활동 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">시간대별 활동</h4>
          <div className="space-y-2">
            {Object.keys(hourlyActivity).length > 0 ? (
              Object.entries(hourlyActivity)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .slice(0, 8)
                .map(([hour, count]) => {
                  const maxCount = Math.max(...Object.values(hourlyActivity))
                  return (
                    <div key={hour} className="flex items-center">
                      <div className="w-12 text-sm">{hour}시</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm text-gray-600">{count}</div>
                    </div>
                  )
                })
            ) : (
              <div className="text-gray-500 text-sm">시간대별 활동 데이터가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 수면 패턴 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">수면 패턴 추정</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">추정 수면 시간</div>
            <div className="text-2xl font-bold text-blue-600">
              {sleepPattern.estimatedSleepStart}시 - 
              {sleepPattern.estimatedSleepEnd}시
            </div>
            <div className="text-sm text-gray-600 mt-1">
              ({sleepPattern.estimatedSleepDuration}시간)
            </div>
            <div className={`mt-2 px-2 py-1 rounded text-xs ${
              sleepPattern.sleepQualityIndicator === 'good' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {sleepPattern.sleepQualityIndicator === 'good' ? '양호' : '개선 필요'}
            </div>
          </div>
        </div>
      </div>

      {/* 주요 키워드 */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold mb-3">주요 키워드</h4>
        <div className="flex flex-wrap gap-2">
          {topKeywords.length > 0 ? (
            topKeywords.slice(0, 10).map((keyword, index) => (
              <span 
                key={keyword.keyword}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                style={{ opacity: 1 - (index * 0.1) }}
              >
                {keyword.keyword} ({keyword.score.toFixed(2)})
              </span>
            ))
          ) : (
            <div className="text-gray-500 text-sm">키워드 데이터가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// 감정 분석 시각화 컴포넌트
const EmotionalAnalysisViewer: React.FC<{ analysis: EmotionalPsychology }> = ({ analysis }) => {
  const emotionalStability = analysis?.emotionalStability || 1.0
  const stressPeriods = analysis?.stressPeriods || []
  const emotionalRecoveryTime = analysis?.emotionalRecoveryTime || 24.0
  const emotionalClusters = analysis?.emotionalClusters || {}

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">🧠 감정/심리 분석</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 감정 안정성 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">감정 안정성</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">안정성 점수</span>
              <span className="text-lg font-bold text-blue-600">
                {(emotionalStability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min(emotionalStability * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {emotionalStability > 0.7 ? '매우 안정적' : 
               emotionalStability > 0.4 ? '보통' : '불안정'}
            </div>
          </div>
        </div>

        {/* 스트레스 시기 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">스트레스 시기</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">감지된 스트레스 시기</div>
            <div className="text-2xl font-bold text-red-600">
              {stressPeriods.length}회
            </div>
            <div className="text-sm text-gray-600 mt-1">
              감정 회복 시간: {emotionalRecoveryTime.toFixed(1)}시간
            </div>
          </div>
        </div>
      </div>

      {/* 감정 클러스터 */}
      {Object.keys(emotionalClusters).length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3">감정 상태 클러스터</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(emotionalClusters).map(([cluster, data]) => (
              <div key={cluster} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">{cluster}</div>
                <div className="space-y-1 text-sm">
                  <div>크기: {data.size}</div>
                  <div>평균 감정: {data.avgEmotion.toFixed(2)}</div>
                  <div>평균 중요도: {data.avgImportance.toFixed(2)}</div>
                  <div>주요 시간: {data.commonHours.join(', ')}시</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 개인화 추천 시각화 컴포넌트
const PersonalizationViewer: React.FC<{ recommendations: PersonalAnalysisResult['recommendations'] }> = ({ recommendations }) => {
  const immediate = recommendations?.immediate || {
    optimalWorkHours: [],
    contentSuggestions: [],
    socialActivities: [],
    wellnessTips: []
  }
  
  const longterm = recommendations?.longterm || {
    hobbyDevelopment: [],
    careerDirection: [],
    relationshipImprovement: [],
    personalGrowth: []
  }

  const immediateRecommendations = [
    ...immediate.optimalWorkHours,
    ...immediate.wellnessTips,
    ...immediate.contentSuggestions,
    ...immediate.socialActivities
  ]

  const longtermRecommendations = [
    ...longterm.personalGrowth,
    ...longterm.hobbyDevelopment,
    ...longterm.careerDirection,
    ...longterm.relationshipImprovement
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">🎯 개인화 추천</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 즉시 실행 가능한 추천 */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-green-600">즉시 실행 가능</h4>
          <div className="space-y-3">
            {immediateRecommendations.length > 0 ? (
              immediateRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <div className="text-sm">{rec}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">즉시 실행 가능한 추천이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 장기적 제안 */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-blue-600">장기적 제안</h4>
          <div className="space-y-3">
            {longtermRecommendations.length > 0 ? (
              longtermRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <div className="text-sm">{rec}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm">장기적 제안이 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 성능 메트릭 시각화 컴포넌트
const PerformanceMetricsViewer: React.FC<{ metrics: PerformanceMetrics }> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">⚡ 성능 메트릭</h3>
        <div className="text-center text-gray-500">
          성능 메트릭 데이터가 없습니다.
        </div>
      </div>
    )
  }

  const executionTime = metrics.executionTime || 0
  const memoryUsage = metrics.memoryUsage || 0
  const userExperience = metrics.userExperience || {
    responsivenessScore: 0,
    perceivedPerformance: 'fair' as const,
    loadingTime: 0
  }
  const cacheStats = metrics.cacheStats || {
    size: 0,
    hitRate: 0,
    oldestEntry: 0
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">⚡ 성능 메트릭</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {executionTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600">실행 시간</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {memoryUsage.toFixed(1)}MB
          </div>
          <div className="text-sm text-gray-600">메모리 사용량</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {userExperience.responsivenessScore}/100
          </div>
          <div className="text-sm text-gray-600">반응성 점수</div>
        </div>
      </div>

      {/* 사용자 경험 평가 */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">사용자 경험 평가</h4>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            userExperience.perceivedPerformance === 'excellent' ? 'bg-green-100 text-green-800' :
            userExperience.perceivedPerformance === 'good' ? 'bg-blue-100 text-blue-800' :
            userExperience.perceivedPerformance === 'fair' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {userExperience.perceivedPerformance === 'excellent' ? '매우 우수' :
             userExperience.perceivedPerformance === 'good' ? '양호' :
             userExperience.perceivedPerformance === 'fair' ? '보통' : '개선 필요'}
          </div>
          <div className="text-sm text-gray-600">
            로딩 시간: {userExperience.loadingTime.toFixed(0)}ms
          </div>
        </div>
      </div>

      {/* 단계별 분석 */}
      {(metrics.analysisSteps?.length || 0) > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3">단계별 분석</h4>
          <div className="space-y-2">
            {(metrics.analysisSteps || []).map((step, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium">{step.step}</div>
                <div className="text-sm text-gray-600">
                  {step.duration.toFixed(0)}ms ({step.memoryDelta.toFixed(1)}MB)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedAnalysisViewer