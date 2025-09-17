'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CalendarIcon,
  MapIcon,
  HeartIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { useAnalysis } from '@/hooks'
import { Card, StatCard, LoadingSpinner, AnimatedCard } from '@/components/ui'
import { TimelineChart, CategoryChart } from '@/components/charts'
import { UploadedFile, AnalysisData } from '@/types'

interface AnalysisDashboardProps {
  files: UploadedFile[]
}

export default function AnalysisDashboard({ files }: AnalysisDashboardProps) {
  const { analysisData, isAnalyzing, analyzeFiles } = useAnalysis()

  useEffect(() => {
    // 파일 데이터를 분석하여 인사이트 생성
    analyzeFiles(files)
  }, [files, analyzeFiles])

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <LoadingSpinner size="lg" className="mx-auto mb-6" />
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">분석 중입니다...</h3>
        <p className="text-gray-500">AI가 당신의 데이터를 분석하고 있습니다</p>
      </motion.div>
    )
  }

  if (!analysisData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">분석할 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {analysisData?.totalLikes ? "Instagram 좋아요 분석 결과" : "나의 디지털 라이프 분석 결과"}
        </h2>
        <p className="text-xl text-gray-600">
          {files.length}개의 파일을 분석한 결과입니다
          {analysisData?.totalLikes && ` (총 ${analysisData.totalLikes}개 좋아요 분석)`}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <AnimatedCard delay={0.1}>
          <StatCard
            icon={<CalendarIcon className="w-8 h-8" />}
            value={analysisData?.instagramData?.dateRange ? 
              `${new Date(analysisData.instagramData.dateRange.start).toLocaleDateString()} - ${new Date(analysisData.instagramData.dateRange.end).toLocaleDateString()}` : 
              "7일"
            }
            label="분석 기간"
            color="blue"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <StatCard
            icon={<PhotoIcon className="w-8 h-8" />}
            value={analysisData?.totalLikes || 89}
            label="총 좋아요 수"
            color="green"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
          <StatCard
            icon={<MapIcon className="w-8 h-8" />}
            value={analysisData?.instagramData?.uniqueUsers || "5"}
            label={analysisData?.instagramData ? "팔로우한 사용자" : "방문 지역"}
            color="purple"
          />
        </AnimatedCard>

        <AnimatedCard delay={0.4}>
          <StatCard
            icon={<HeartIcon className="w-8 h-8" />}
            value={analysisData?.instagramData?.topUsers?.[0]?.username ? 
              `${analysisData.instagramData.topUsers[0].percentage}%` : 
              "85%"
            }
            label={analysisData?.instagramData ? "최다 좋아요 사용자 비율" : "긍정적 감정"}
            color="red"
          />
        </AnimatedCard>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Timeline Chart */}
        <AnimatedCard delay={0.5}>
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ClockIcon className="w-5 h-5" />
              {analysisData.instagramData ? "일별 좋아요 패턴" : "일별 활동 패턴"}
            </h3>
            <TimelineChart data={analysisData.timeline} />
          </Card>
        </AnimatedCard>

        {/* Category Chart */}
        <AnimatedCard delay={0.6}>
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              {analysisData.instagramData ? "상위 좋아요 사용자" : "관심사 분포"}
            </h3>
            <CategoryChart data={analysisData.categories} />
          </Card>
        </AnimatedCard>
      </div>

      {/* Instagram 특화 차트들 */}
      {analysisData.instagramData && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 시간대별 패턴 */}
          <AnimatedCard delay={0.7}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                시간대별 좋아요 패턴
              </h3>
              <TimelineChart data={analysisData.instagramData.hourlyPattern.map((item: { hour: number; likes: number }) => ({
                time: `${item.hour}시`,
                likes: item.likes
              }))} />
            </Card>
          </AnimatedCard>

          {/* 요일별 패턴 */}
          <AnimatedCard delay={0.8}>
            <Card>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                요일별 좋아요 패턴
              </h3>
              <TimelineChart data={analysisData.instagramData.weeklyPattern.map((item: { day: string; likes: number }) => ({
                date: item.day,
                likes: item.likes
              }))} />
            </Card>
          </AnimatedCard>
        </div>
      )}

      {/* Insights */}
      <div className="grid lg:grid-cols-2 gap-8">
        <AnimatedCard delay={analysisData.instagramData ? 0.9 : 0.7}>
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5" />
              주요 인사이트
            </h3>
            <ul className="space-y-3">
              {analysisData.insights.map((insight: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </AnimatedCard>

        <AnimatedCard delay={analysisData.instagramData ? 1.0 : 0.8}>
          <Card>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HeartIcon className="w-5 h-5" />
              개인화 추천
            </h3>
            <ul className="space-y-3">
              {analysisData.recommendations.map((recommendation: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </Card>
        </AnimatedCard>
      </div>
    </div>
  )
}