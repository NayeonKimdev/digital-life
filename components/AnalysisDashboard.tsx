'use client'

import { useEffect } from 'react'
import {
  CalendarIcon,
  PhotoIcon,
  EyeIcon,
  SwatchIcon
} from '@heroicons/react/24/outline'
import { useAnalysis } from '@/hooks'
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
      <div className="text-center py-20">
        <div className="animate-spin border-4 border-primary-200 border-t-primary-600 rounded-full w-16 h-16 mx-auto mb-6"></div>
        <h3 className="text-2xl font-semibold text-gray-700 mb-2">분석 중입니다...</h3>
        <p className="text-gray-500">AI가 당신의 데이터를 분석하고 있습니다</p>
      </div>
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
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          {analysisData?.imageData ? "이미지 취향 분석 결과" :
           analysisData?.totalLikes ? "Instagram 좋아요 분석 결과" : 
           analysisData?.totalMessages ? "카카오톡 채팅 분석 결과" : 
           "나의 디지털 라이프 분석 결과"}
        </h2>
        <p className="text-xl text-gray-600">
          {files.length}개의 파일을 분석한 결과입니다
          {analysisData?.imageData && ` (총 ${analysisData.imageData.totalImages}장 이미지 분석)`}
          {analysisData?.totalLikes && ` (총 ${analysisData.totalLikes}개 좋아요 분석)`}
          {analysisData?.totalMessages && ` (총 ${analysisData.totalMessages}개 메시지 분석)`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-blue-500">
            <CalendarIcon className="w-8 h-8" />
          </div>
          <div className="text-2xl font-bold text-gray-900">7일</div>
          <div className="text-sm text-gray-500">분석 기간</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-green-500">
            <PhotoIcon className="w-8 h-8" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analysisData?.imageData?.totalImages || analysisData?.totalLikes || analysisData?.totalMessages || 89}
          </div>
          <div className="text-sm text-gray-500">
            {analysisData?.imageData ? "총 이미지 수" : analysisData?.totalMessages ? "총 메시지 수" : "총 좋아요 수"}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-purple-500">
            <EyeIcon className="w-8 h-8" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {analysisData?.imageData?.objectDetection?.uniqueObjects || analysisData?.imageData?.contentAnalysis?.uniqueObjects || analysisData?.instagramData?.uniqueUsers || analysisData?.kakaoData?.uniqueSenders || "5"}
          </div>
          <div className="text-sm text-gray-500">
            {analysisData?.imageData ? 
              "감지된 객체 종류" : 
              analysisData?.instagramData ? "팔로우한 사용자" : 
              analysisData?.kakaoData ? "참여자 수" : 
              "방문 지역"}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <div className="w-8 h-8 mx-auto mb-2 text-red-500">
            <SwatchIcon className="w-8 h-8" />
          </div>
          <div className="text-2xl font-bold text-gray-900">85%</div>
          <div className="text-sm text-gray-500">긍정적 감정</div>
        </div>
      </div>

      {/* Simple Analysis Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">분석 결과</h3>
        <div className="space-y-4">
          {analysisData.insights && analysisData.insights.map((insight: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-700">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">추천사항</h3>
        <div className="space-y-4">
          {analysisData.recommendations && analysisData.recommendations.map((recommendation: string, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-700">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 이미지 분석 결과 (간단 버전) */}
      {analysisData?.imageData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">이미지 분석 결과</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">주요 선호 카테고리</h4>
              <div className="space-y-2">
                {analysisData.imageData.preferenceAnalysis.categories.slice(0, 5).map((cat: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{cat.category}</span>
                    <span>{cat.count}개 ({cat.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">사진 스타일</h4>
              <div className="space-y-2 text-sm">
                <div>주요 스타일: {analysisData.imageData.preferenceAnalysis.stylePreferences.photographyStyle}</div>
                <div>구도 선호: {analysisData.imageData.preferenceAnalysis.stylePreferences.compositionStyle}</div>
                <div>조명 선호: {analysisData.imageData.preferenceAnalysis.stylePreferences.lightingPreference}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 객체 인식 결과 */}
      {analysisData?.imageData?.objectDetection && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">향상된 객체 인식 결과</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">감지된 객체 통계</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>총 감지된 객체</span>
                  <span className="font-medium">{analysisData.imageData.objectDetection.totalObjects}개</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>고유 객체 종류</span>
                  <span className="font-medium">{analysisData.imageData.objectDetection.uniqueObjects}종류</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>평균 신뢰도</span>
                  <span className="font-medium">{(analysisData.imageData.objectDetection.averageConfidence * 100).toFixed(1)}%</span>
                </div>
                {analysisData.imageData.objectDetection.chemistryObjects && analysisData.imageData.objectDetection.chemistryObjects.total > 0 && (
                  <div className="flex justify-between text-sm bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 font-medium">화학 관련 객체</span>
                    <span className="text-blue-700 font-medium">{analysisData.imageData.objectDetection.chemistryObjects.total}개</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">주요 객체 카테고리</h4>
              <div className="space-y-2">
                {Object.entries(analysisData.imageData.objectDetection.objectsByCategory)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 5)
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="capitalize">{category}</span>
                      <span>{count as number}개</span>
                    </div>
                  ))}
              </div>
              
              {/* 텍스트 인식 결과 */}
              {analysisData.imageData.objectDetection.textRecognition && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">텍스트 인식 결과</h5>
                  <div className="space-y-2">
                    <div className="text-sm text-green-700">
                      <span className="font-medium">인식된 텍스트:</span>
                      <div className="mt-1 p-2 bg-white rounded border text-xs max-h-20 overflow-y-auto">
                        {analysisData.imageData.objectDetection.textRecognition.text || '텍스트를 인식하지 못했습니다.'}
                      </div>
                    </div>
                    <div className="text-sm text-green-700">
                      <span className="font-medium">OCR 신뢰도:</span> {(analysisData.imageData.objectDetection.textRecognition.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-green-600">
                      텍스트 인식 시간: {analysisData.imageData.objectDetection.textRecognition.processingTime.toFixed(0)}ms
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}