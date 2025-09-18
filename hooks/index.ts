// 커스텀 훅들
import { useState, useCallback } from 'react'
import { UploadedFile } from '@/types'
import { extractImageMetadata, parseJsonFile, parseCsvFile, parseKakaoChatFile, analyzeImageContent, analyzeImages, generateEmotionData, generateLocationData } from '@/utils'

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

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
      const processedFiles = await Promise.all(
        files.map(file => processFile(file))
      )

      setUploadedFiles(prev => [...prev, ...processedFiles])
      return processedFiles
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
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

  const analyzeFiles = useCallback(async (files: UploadedFile[]) => {
    setIsAnalyzing(true)
    
    try {
      // 실제로는 서버에서 AI 분석을 수행하겠지만, 여기서는 실제 데이터 기반 분석
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 파일 타입별 분석
      const instagramData = files.find(file => file.content?.type === 'instagram_likes')
      const kakaoData = files.find(file => file.content?.type === 'kakao_chat')
      const imageFiles = files.filter(file => file.type.startsWith('image/'))
      let analysis = {}
      
      if (imageFiles.length > 0) {
        // 이미지 분석
        const { analyzeImages } = await import('@/utils')
        const imageAnalysis = await analyzeImages(files)
        
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
          insights: imageAnalysis.insights,
          recommendations: imageAnalysis.recommendations,
          imageData: imageAnalysis
        }
      } else if (instagramData) {
        const { analyzeInstagramLikes } = await import('@/utils')
        const instagramAnalysis = analyzeInstagramLikes(instagramData.content.likes_media_likes)
        
        // 인스타그램 분석 결과를 기존 AnalysisData 형태로 변환
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
          emotions: generateEmotionData(), // 기본 감정 데이터
          locations: generateLocationData(), // 기본 위치 데이터
          insights: instagramAnalysis.insights,
          recommendations: instagramAnalysis.recommendations,
          totalLikes: instagramAnalysis.totalLikes,
          instagramData: instagramAnalysis
        }
      } else if (kakaoData) {
        console.log('=== 카카오톡 데이터 처리 시작 ===')
        console.log('카카오톡 데이터 발견:', kakaoData.content)
        
        const { analyzeKakaoChat } = await import('@/utils')
        const kakaoAnalysis = analyzeKakaoChat(kakaoData.content)
        
        console.log('카카오톡 분석 결과:', kakaoAnalysis)
        
        // 카카오톡 분석 결과를 기존 AnalysisData 형태로 변환
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
          emotions: generateEmotionData(), // 기본 감정 데이터
          locations: generateLocationData(), // 기본 위치 데이터
          insights: kakaoAnalysis.insights,
          recommendations: kakaoAnalysis.recommendations,
          totalMessages: kakaoAnalysis.totalMessages,
          kakaoData: kakaoAnalysis
        }
        
        console.log('=== 최종 분석 결과 ===')
        console.log('analysis:', analysis)
      } else {
        // 기본 샘플 데이터
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
            "새로운 카페나 레스토랑을 자주 찾아다니는 편입니다."
          ],
          recommendations: [
            "새로운 취미 활동을 시작해보세요",
            "운동 루틴을 추가하면 더 건강한 라이프스타일이 될 것 같습니다",
            "독서 시간을 늘려보는 것을 추천합니다"
          ]
        }
      }
      
      setAnalysisData(analysis)
      return analysis
    } catch (error) {
      console.error('Analysis error:', error)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    analysisData,
    isAnalyzing,
    analyzeFiles
  }
}
