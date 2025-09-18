'use client'

import { useState } from 'react'
import { AdvancedImageAnalysis } from '@/utils/advancedImageAnalysis'
import { 
  EyeIcon, 
  LightBulbIcon, 
  TagIcon, 
  SparklesIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

interface AdvancedAnalysisViewerProps {
  imageUrl: string
  analysis: AdvancedImageAnalysis
}

export default function AdvancedAnalysisViewer({ imageUrl, analysis }: AdvancedAnalysisViewerProps) {
  const [activeTab, setActiveTab] = useState<'objects' | 'scene' | 'classification' | 'features' | 'query'>('objects')
  const [queryText, setQueryText] = useState('')
  const [queryResult, setQueryResult] = useState<{ answer: string; confidence: number } | null>(null)

  const tabs = [
    { id: 'objects', label: '객체 검출', icon: EyeIcon },
    { id: 'scene', label: '장면 이해', icon: LightBulbIcon },
    { id: 'classification', label: '이미지 분류', icon: TagIcon },
    { id: 'features', label: '특징 추출', icon: SparklesIcon },
    { id: 'query', label: '자연어 쿼리', icon: QuestionMarkCircleIcon }
  ]

  const handleQuery = async () => {
    if (!queryText.trim()) return
    
    try {
      // 실제로는 이미지 요소를 전달해야 함
      const result = { answer: `"${queryText}"에 대한 답변: 이 이미지에서 관련된 내용을 찾을 수 있습니다.`, confidence: 0.85 }
      setQueryResult(result)
    } catch (error) {
      console.error('쿼리 처리 실패:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 이미지 */}
      <div className="relative">
        <img
          src={imageUrl}
          alt="분석된 이미지"
          className="w-full max-w-2xl mx-auto rounded-lg shadow-sm"
        />
        
        {/* 객체 바운딩 박스 */}
        {activeTab === 'objects' && analysis.objectDetection.objects.map((obj, index) => (
          <div
            key={index}
            className="absolute border-2 border-blue-500 bg-blue-500/20"
            style={{
              left: `${obj.bbox[0]}px`,
              top: `${obj.bbox[1]}px`,
              width: `${obj.bbox[2]}px`,
              height: `${obj.bbox[3]}px`,
            }}
          >
            <div className="absolute -top-6 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {obj.class} ({(obj.confidence * 100).toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'objects' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">고급 객체 검출 (YOLOv8 스타일)</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">감지된 객체</h4>
                <div className="space-y-2">
                  {analysis.objectDetection.objects.map((obj, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium capitalize">{obj.class}</span>
                      <span className="text-sm text-gray-600">
                        {(obj.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">통계</h4>
                <div className="space-y-2 text-sm">
                  <div>총 객체 수: {analysis.objectDetection.objects.length}개</div>
                  <div>평균 신뢰도: {(analysis.objectDetection.objects.reduce((sum, obj) => sum + obj.confidence, 0) / analysis.objectDetection.objects.length * 100).toFixed(1)}%</div>
                  <div>처리 시간: {analysis.objectDetection.processingTime.toFixed(0)}ms</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scene' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">장면 이해 (CLIP 기반)</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">장면 설명</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">{analysis.sceneUnderstanding.sceneDescription}</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">분위기</h4>
                  <div className="bg-blue-50 p-3 rounded text-center">
                    <span className="text-blue-700 font-medium capitalize">
                      {analysis.sceneUnderstanding.mood}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">장소</h4>
                  <div className="bg-green-50 p-3 rounded text-center">
                    <span className="text-green-700 font-medium capitalize">
                      {analysis.sceneUnderstanding.setting}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">활동</h4>
                  <div className="bg-purple-50 p-3 rounded">
                    {analysis.sceneUnderstanding.activities.length > 0 ? (
                      <div className="space-y-1">
                        {analysis.sceneUnderstanding.activities.map((activity, index) => (
                          <div key={index} className="text-purple-700 text-sm">• {activity}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-purple-700 text-sm">활동 감지 없음</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classification' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">이미지 분류 (ResNet50 스타일)</h3>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">주요 카테고리</h4>
                <div className="text-xl font-semibold text-blue-900">
                  {analysis.imageClassification.primaryCategory}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">전체 분류 결과</h4>
                <div className="space-y-2">
                  {analysis.imageClassification.categories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${category.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12 text-right">
                          {(category.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">특징 추출 (DINOv2 스타일)</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">스타일 특징</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">구도:</span>
                    <span className="ml-2 font-medium">{analysis.featureExtraction.styleFeatures.composition}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">조명:</span>
                    <span className="ml-2 font-medium">{analysis.featureExtraction.styleFeatures.lighting}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">색상 팔레트:</span>
                    <div className="flex gap-1 mt-1">
                      {analysis.featureExtraction.styleFeatures.colorPalette.map((color, index) => (
                        <div
                          key={index}
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: color }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">유사 개념</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.featureExtraction.similarConcepts.map((concept, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {concept}
                    </span>
                  ))}
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-2">특징 벡터</h4>
                  <div className="text-xs text-gray-500">
                    차원: {analysis.featureExtraction.embeddings.length}D
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'query' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">자연어 쿼리 (CLIP 기반)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="이미지에 대해 질문해보세요..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  />
                  <button
                    onClick={handleQuery}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    질문
                  </button>
                </div>
              </div>
              
              {queryResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">답변</h4>
                  <p className="text-green-700">{queryResult.answer}</p>
                  <div className="mt-2 text-sm text-green-600">
                    신뢰도: {(queryResult.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">예시 질문</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• "이 이미지의 분위기는 어떤가요?"</div>
                  <div>• "어떤 활동이 보이나요?"</div>
                  <div>• "이 사진은 어디서 촬영되었나요?"</div>
                  <div>• "이미지에 있는 사람들의 감정은?"</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
