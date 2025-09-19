// 커스텀 훅들
import { useState, useCallback } from 'react'
import { UploadedFile } from '@/types'
import { extractImageMetadata, parseJsonFile, parseCsvFile, parseKakaoChatFile, analyzeImageContent, analyzeImages, generateEmotionData, generateLocationData } from '@/utils'
import { detectObjectsInImage, generateObjectInsights, ObjectDetectionResult } from '@/utils/objectDetection'
import { recognizeTextInImage, TextRecognitionResult } from '@/utils/textRecognition'
import { analyzeImageAdvanced, AdvancedImageAnalysis } from '@/utils/advancedImageAnalysis'
import { personalAnalysisSystem, PersonalAnalysisResult } from '@/utils/personalDataAnalyzer'
import { optimizedAnalysisPipeline } from '@/utils/optimizedAnalysisPipeline'

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // 긴급 중단 기능
  const forceStopUpload = useCallback(() => {
    console.log('🚨 강제 업로드 중단!')
    setIsUploading(false)
  }, [])
  
  // 긴급 중단 기능을 전역으로 노출
  if (typeof window !== 'undefined') {
    (window as any).forceStopUpload = forceStopUpload
  }

  const processFile = async (file: File): Promise<UploadedFile> => {
    const fileData: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file: file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      status: 'processing',
      isImage: file.type.startsWith('image/')
    }

    try {
      // 파일 타입별 처리
      if (file.type.startsWith('image/')) {
        // 이미지 메타데이터 추출
        fileData.imageMetadata = await extractImageMetadata(file)
        
        // 이미지 내용 분석 (메타데이터 전달)
        fileData.imageContentAnalysis = await analyzeImageContent(file, fileData.imageMetadata)
        
        // 텍스트 인식 수행 (개선된 타임아웃 처리)
        try {
          console.log('🔍 텍스트 인식 시작:', file.name)
          
          // Promise.race를 사용한 타임아웃 처리
          const textRecognitionPromise = recognizeTextInImage(file)
          const timeoutPromise = new Promise<TextRecognitionResult>((_, reject) => 
            setTimeout(() => reject(new Error('텍스트 인식 타임아웃 (20초)')), 20000)
          )
          
          fileData.textRecognitionResult = await Promise.race([
            textRecognitionPromise,
            timeoutPromise
          ])
          
          console.log('✅ 텍스트 인식 완료:', {
            fileName: file.name,
            textLength: fileData.textRecognitionResult.text.length,
            confidence: fileData.textRecognitionResult.confidence,
            processingTime: fileData.textRecognitionResult.processingTime,
            qualityScore: fileData.textRecognitionResult.qualityAssessment?.overallScore || 0
          })
          
        } catch (error: any) {
          console.warn('⚠️ 텍스트 인식 실패, 기본값 설정:', error.message)
          
          // 실패시에도 기본 구조 유지하되 더 상세한 오류 정보 제공
          fileData.textRecognitionResult = {
            text: `텍스트 인식 실패: ${error.message}`,
            confidence: 0.1,
            words: [],
            lines: [],
            processingTime: 0,
            qualityAssessment: {
              overallScore: 10,
              textLength: 0,
              wordCount: 0,
              averageConfidence: 0.1,
              hasKorean: false,
              hasEnglish: false,
              hasNumbers: false,
              readabilityScore: 0
            }
          }
          
          // 에러 타입별 추가 처리
          if (error.message.includes('타임아웃')) {
            console.warn('⏰ 타임아웃으로 인한 실패 - 이미지 크기나 복잡도를 확인하세요')
            fileData.textRecognitionResult.text = '텍스트 인식 타임아웃 - 이미지가 너무 크거나 복잡합니다'
          } else if (error.message.includes('API')) {
            console.warn('🌐 API 연결 문제 - 네트워크 상태를 확인하세요')
            fileData.textRecognitionResult.text = 'API 연결 실패 - 네트워크 상태를 확인하세요'
          }
        }
        
        // 객체 인식 수행 (비동기 처리로 메인 플로우 차단 방지)
        console.log('🔍 객체 인식 시작:', file.name)
        const objectDetectionPromise = detectObjectsInImage(file)
          .then(result => {
            fileData.objectDetectionResult = result
            console.log('✅ 객체 인식 완료:', {
              fileName: file.name,
              objectCount: result.objects.length,
              processingTime: result.processingTime
            })
          })
          .catch(error => {
            console.warn('⚠️ 객체 인식 실패:', error.message)
            // 객체 인식 실패는 전체 프로세스를 중단시키지 않음
          })

        // 고급 이미지 분석 수행 (선택적, 비동기)
        console.log('⚡ 고급 이미지 분석 시작:', file.name)
        const advancedAnalysisPromise = (async () => {
          try {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            
            await new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
              img.src = fileData.preview!
            })
            
            const { analyzeImageAdvanced } = await import('@/utils/advancedImageAnalysis')
            fileData.advancedAnalysisResult = await analyzeImageAdvanced(img)
            console.log('✅ 고급 이미지 분석 완료:', file.name)
          } catch (error) {
            console.warn('⚠️ 고급 이미지 분석 실패:', error)
          }
        })()

        // 모든 비동기 작업 완료 대기 (타임아웃 적용)
        try {
          await Promise.race([
            Promise.allSettled([objectDetectionPromise, advancedAnalysisPromise]),
            new Promise(resolve => setTimeout(resolve, 25000)) // 25초 최대 대기
          ])
          console.log('🏁 모든 이미지 분석 완료:', file.name)
        } catch (error) {
          console.warn('⚠️ 일부 분석 작업 타임아웃:', error)
        }
      } else if (file.type === 'application/json') {
        fileData.content = await parseJsonFile(file)
      } else if (file.type === 'text/csv') {
        fileData.content = await parseCsvFile(file)
      } else if (file.type === 'text/plain' && (file.name.includes('Talk_') || file.name.includes('카카오톡'))) {
        // 카카오톡 채팅 파일 감지
        fileData.content = await parseKakaoChatFile(file)
      }

      fileData.status = 'completed'
    } catch (error) {
      fileData.status = 'error'
      console.error('File processing error:', error)
    }

    return fileData
  }

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsUploading(true)
    
    try {
      console.log('🚀 파일 업로드 시작:', files.length, '개 파일')
      
      // 각 파일을 순차적으로 처리 (병렬 처리 대신)
      const processedFiles: UploadedFile[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`📁 파일 처리 중 (${i + 1}/${files.length}):`, file.name)
        
        try {
          const processedFile = await processFile(file)
          processedFiles.push(processedFile)
          console.log(`✅ 파일 처리 완료 (${i + 1}/${files.length}):`, file.name)
        } catch (error) {
          console.error(`❌ 파일 처리 실패 (${i + 1}/${files.length}):`, file.name, error)
          // 실패한 파일도 기본 정보로 추가
          const failedFile: UploadedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            status: 'error',
            isImage: file.type.startsWith('image/')
          }
          processedFiles.push(failedFile)
        }
      }

      setUploadedFiles(prev => [...prev, ...processedFiles])
      console.log('🎉 모든 파일 처리 완료:', processedFiles.length, '개')
      return processedFiles
    } catch (error) {
      console.error('❌ 업로드 오류:', error)
      throw error
    } finally {
      console.log('🔄 업로드 상태 해제')
      setIsUploading(false)
    }
  }, [])

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }, [])

  const clearAllFiles = useCallback(() => {
    setUploadedFiles([])
  }, [])

  return {
    uploadedFiles,
    isUploading,
    uploadFiles,
    removeFile,
    clearAllFiles
  }
}

export const useAnalysis = () => {
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  const analyzeFiles = useCallback(async (files: UploadedFile[]) => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentStep('분석 시작...')
    
    try {
      // 새로운 최적화된 분석 시스템 사용
      console.log('🚀 최적화된 개인 데이터 분석 시작')
      
      // 진행 상황 업데이트를 위한 콜백 설정
      const progressCallback = (progress: number, message: string) => {
        setAnalysisProgress(progress)
        setCurrentStep(message)
      }

      // 최적화된 분석 파이프라인 실행
      const personalAnalysisResult = await optimizedAnalysisPipeline.runOptimizedAnalysis(files)
      
      // 기존 분석 결과와 통합
      const instagramData = files.find(file => file.content?.type === 'instagram_likes')
      const kakaoData = files.find(file => file.content?.type === 'kakao_chat')
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      
      let analysis = {}
      
      if (imageFiles.length > 0) {
        // 이미지 분석 + 개인 데이터 분석 통합
        const { analyzeImages } = await import('@/utils')
        const imageAnalysis = await analyzeImages(files)
        
        // 객체 인식 결과 수집 및 분석
        const allDetectedObjects = imageFiles
          .filter(file => file.objectDetectionResult)
          .flatMap(file => file.objectDetectionResult!.objects)
        
        const objectInsights = allDetectedObjects.length > 0 
          ? generateObjectInsights(allDetectedObjects)
          : []
        
        // 개인 분석 결과의 인사이트와 기존 인사이트 결합
        const personalInsights = [
          ...personalAnalysisResult.recommendations.immediate.optimalWorkHours,
          ...personalAnalysisResult.recommendations.immediate.wellnessTips,
          ...personalAnalysisResult.recommendations.longterm.personalGrowth
        ]
        
        const combinedInsights = [...imageAnalysis.insights, ...objectInsights, ...personalInsights]
        
        analysis = {
          timeline: imageAnalysis.preferenceAnalysis.temporalPatterns.timeOfDay.map(item => ({
            time: item.period,
            photos: item.count
          })),
          categories: imageAnalysis.preferenceAnalysis.categories.slice(0, 5).map((cat, index) => ({
            name: cat.category,
            value: cat.count,
            color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index] || '#E0E0E0'
          })),
          emotions: generateEmotionData(),
          locations: generateLocationData(),
          insights: combinedInsights,
          recommendations: [
            ...imageAnalysis.recommendations,
            ...personalAnalysisResult.recommendations.immediate.contentSuggestions,
            ...personalAnalysisResult.recommendations.longterm.hobbyDevelopment
          ],
          imageData: {
            ...imageAnalysis,
            objectDetection: {
              totalObjects: allDetectedObjects.length,
              uniqueObjects: new Set(allDetectedObjects.map(obj => obj.class)).size,
              objectsByCategory: allDetectedObjects.reduce((acc, obj) => {
                acc[obj.class] = (acc[obj.class] || 0) + 1
                return acc
              }, {} as Record<string, number>),
              averageConfidence: allDetectedObjects.length > 0 
                ? allDetectedObjects.reduce((sum, obj) => sum + obj.score, 0) / allDetectedObjects.length
                : 0
            }
          },
          // 개인 분석 결과 추가
          personalAnalysis: personalAnalysisResult,
          behaviorPatterns: personalAnalysisResult.behaviorPatterns,
          emotionalAnalysis: personalAnalysisResult.deepAnalysis.emotionalPsychology,
          performanceMetrics: {
            processingTime: personalAnalysisResult.processingTime,
            filesProcessed: personalAnalysisResult.dataSummary.totalFilesProcessed,
            cacheStats: optimizedAnalysisPipeline.getCacheStats()
          }
        }
      } else if (instagramData) {
        const { analyzeInstagramLikes } = await import('@/utils')
        const instagramAnalysis = analyzeInstagramLikes(instagramData.content.likes_media_likes)
        
        // 인스타그램 분석 결과를 기존 AnalysisData 형태로 변환 + 개인 분석 통합
        analysis = {
          timeline: instagramAnalysis.timeline.map(item => ({
            date: item.date,
            likes: item.likes,
            users: item.users
          })),
          categories: instagramAnalysis.topUsers.slice(0, 5).map((user, index) => ({
            name: user.username,
            value: user.likes,
            color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index] || '#E0E0E0'
          })),
          emotions: generateEmotionData(),
          locations: generateLocationData(),
          insights: [
            ...instagramAnalysis.insights,
            ...personalAnalysisResult.recommendations.immediate.contentSuggestions
          ],
          recommendations: [
            ...instagramAnalysis.recommendations,
            ...personalAnalysisResult.recommendations.longterm.personalGrowth
          ],
          totalLikes: instagramAnalysis.totalLikes,
          instagramData: instagramAnalysis,
          personalAnalysis: personalAnalysisResult
        }
      } else if (kakaoData) {
        console.log('=== 카카오톡 데이터 처리 시작 ===')
        console.log('카카오톡 데이터 발견:', kakaoData.content)
        
        const { analyzeKakaoChat } = await import('@/utils')
        const kakaoAnalysis = analyzeKakaoChat(kakaoData.content)
        
        console.log('카카오톡 분석 결과:', kakaoAnalysis)
        
        // 카카오톡 분석 결과를 기존 AnalysisData 형태로 변환 + 개인 분석 통합
        analysis = {
          timeline: kakaoAnalysis.timeline.map(item => ({
            date: item.date,
            messages: item.messages,
            senders: item.senders
          })),
          categories: kakaoAnalysis.topSenders.slice(0, 5).map((sender, index) => ({
            name: sender.sender,
            value: sender.messages,
            color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][index] || '#E0E0E0'
          })),
          emotions: generateEmotionData(),
          locations: generateLocationData(),
          insights: [
            ...kakaoAnalysis.insights,
            ...personalAnalysisResult.recommendations.immediate.wellnessTips
          ],
          recommendations: [
            ...kakaoAnalysis.recommendations,
            ...personalAnalysisResult.recommendations.longterm.relationshipImprovement
          ],
          totalMessages: kakaoAnalysis.totalMessages,
          kakaoData: kakaoAnalysis,
          personalAnalysis: personalAnalysisResult
        }
        
        console.log('=== 최종 분석 결과 ===')
        console.log('analysis:', analysis)
      } else {
        // 기본 샘플 데이터 + 개인 분석 통합
        const { 
          generateTimelineData, 
          generateCategoryData
        } = await import('@/utils')
        
        analysis = {
          timeline: generateTimelineData(),
          categories: generateCategoryData(),
          emotions: generateEmotionData(),
          locations: generateLocationData(),
          insights: [
            "당신은 주로 저녁 시간에 사진을 찍는 경향이 있습니다.",
            "음식과 여행 관련 콘텐츠를 가장 많이 소비합니다.",
            "주말에는 야외 활동을 선호하는 것으로 보입니다.",
            "새로운 카페나 레스토랑을 자주 찾아다니는 편입니다.",
            ...personalAnalysisResult.recommendations.immediate.optimalWorkHours,
            ...personalAnalysisResult.recommendations.immediate.wellnessTips
          ],
          recommendations: [
            "새로운 취미 활동을 시작해보세요",
            "운동 루틴을 추가하면 더 건강한 라이프스타일이 될 것 같습니다",
            "독서 시간을 늘려보는 것을 추천합니다",
            ...personalAnalysisResult.recommendations.longterm.hobbyDevelopment,
            ...personalAnalysisResult.recommendations.longterm.personalGrowth
          ],
          personalAnalysis: personalAnalysisResult
        }
      }
      
      setAnalysisProgress(100)
      setCurrentStep('분석 완료!')
      setAnalysisData(analysis)
      
      console.log('✨ 분석 완료!', analysis)
      return analysis
    } catch (error) {
      console.error('Analysis error:', error)
      setCurrentStep('분석 중 오류 발생')
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const clearCache = useCallback(() => {
    optimizedAnalysisPipeline.clearCache()
    console.log('캐시가 클리어되었습니다.')
  }, [])

  const getCacheStats = useCallback(() => {
    return optimizedAnalysisPipeline.getCacheStats()
  }, [])

  return {
    analysisData,
    isAnalyzing,
    analysisProgress,
    currentStep,
    analyzeFiles,
    clearCache,
    getCacheStats
  }
}
