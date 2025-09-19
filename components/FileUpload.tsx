'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowDownTrayIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useFileUpload } from '@/hooks'
import { Card, LoadingSpinner, Button } from '@/components/ui'
import { SUPPORTED_FILE_TYPES } from '@/constants'
import { UploadedFile } from '@/types'
import ObjectDetectionVisualizer from './ObjectDetectionVisualizer'
import AdvancedAnalysisViewer from './AdvancedAnalysisViewer'
import { qwenOCRService } from '@/utils/qwenOCR'

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const { uploadedFiles, isUploading, uploadFiles, removeFile, clearAllFiles } = useFileUpload()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showImagePreviews, setShowImagePreviews] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedImageForDetection, setSelectedImageForDetection] = useState<UploadedFile | null>(null)
  const [selectedImageForAdvancedAnalysis, setSelectedImageForAdvancedAnalysis] = useState<UploadedFile | null>(null)
  const [selectedImageForTextRecognition, setSelectedImageForTextRecognition] = useState<UploadedFile | null>(null)
  const [selectedImageForComprehensiveAnalysis, setSelectedImageForComprehensiveAnalysis] = useState<UploadedFile | null>(null)
  const [showPerformanceStats, setShowPerformanceStats] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const processedFiles = await uploadFiles(acceptedFiles)
      onFilesUploaded(processedFiles)
      toast.success(`${acceptedFiles.length}개 파일이 성공적으로 업로드되었습니다!`)
    } catch (error) {
      toast.error('파일 업로드 중 오류가 발생했습니다.')
      console.error('Upload error:', error)
    }
  }, [uploadFiles, onFilesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: SUPPORTED_FILE_TYPES,
    multiple: true
  })

  const handleSelectAll = () => {
    if (selectedFiles.size === uploadedFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(uploadedFiles.map(file => file.id)))
    }
  }

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const handleDeleteSelected = () => {
    selectedFiles.forEach(fileId => removeFile(fileId))
    setSelectedFiles(new Set())
    toast.success(`${selectedFiles.size}개 파일이 삭제되었습니다.`)
  }

  const imageFiles = uploadedFiles.filter(file => file.type.startsWith('image/'))
  const otherFiles = uploadedFiles.filter(file => !file.type.startsWith('image/'))

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div {...getRootProps()}>
        <motion.div
          className={`
            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-xl text-primary-600 font-medium">
            파일을 여기에 놓으세요...
          </p>
        ) : (
          <div>
            <p className="text-xl text-gray-600 font-medium mb-2">
              파일을 드래그하거나 클릭하여 업로드하세요
            </p>
            <p className="text-gray-500 mb-4">
              이미지, JSON, CSV, PDF, 문서 파일을 지원합니다
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-400">
              <span>• 다중 선택 가능</span>
              <span>• 대용량 파일 지원</span>
              <span>• 실시간 미리보기</span>
            </div>
          </div>
        )}
        </motion.div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            {/* 파일 관리 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold">
                  업로드된 파일 ({uploadedFiles.length}개)
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>이미지: {imageFiles.length}개</span>
                  <span>•</span>
                  <span>문서: {otherFiles.length}개</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 전체 선택 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs"
                >
                  {selectedFiles.size === uploadedFiles.length ? '전체 해제' : '전체 선택'}
                </Button>
                
                {/* 선택된 파일 삭제 */}
                {selectedFiles.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4 mr-1" />
                    삭제 ({selectedFiles.size})
                  </Button>
                )}
                
                {/* 전체 삭제 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearAllFiles()
                    setSelectedFiles(new Set())
                    toast.success('모든 파일이 삭제되었습니다.')
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  전체 삭제
                </Button>
              </div>
            </div>

            {/* 뷰 모드 토글 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPerformanceStats(!showPerformanceStats)}
                  className={`p-2 rounded ${showPerformanceStats ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="OCR 성능 통계 보기"
                >
                  📊
                </button>
                <button
                  onClick={() => setShowImagePreviews(!showImagePreviews)}
                  className={`p-2 rounded ${showImagePreviews ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showImagePreviews ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                </button>
                <span className="text-sm text-gray-500">이미지 미리보기</span>
              </div>
            </div>

            {/* 성능 통계 패널 */}
            {showPerformanceStats && (
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  📊 OCR 성능 통계
                  <button
                    onClick={() => qwenOCRService.clearCache()}
                    className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                  >
                    캐시 클리어
                  </button>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">총 요청 수</div>
                    <div className="text-xl font-bold text-blue-600">
                      {qwenOCRService.getPerformanceStats().totalRequests}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Qwen2.5-VL 사용률</div>
                    <div className="text-xl font-bold text-green-600">
                      {qwenOCRService.getPerformanceStats().qwenUsageRate}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">캐시 적중률</div>
                    <div className="text-xl font-bold text-purple-600">
                      {qwenOCRService.getPerformanceStats().cacheHitRate}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <div className="text-sm text-gray-600">평균 처리 시간</div>
                    <div className="text-xl font-bold text-orange-600">
                      {qwenOCRService.getPerformanceStats().averageProcessingTime.toFixed(0)}ms
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  서비스 상태: {qwenOCRService.getServiceStatus().available ? '🟢 Qwen2.5-VL 사용 가능' : '🟡 폴백 모드 (Tesseract.js)'}
                </div>
              </div>
            )}

            {/* 파일 목록 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
                      relative group cursor-pointer rounded-lg border-2 transition-all duration-200 min-h-[140px]
                      ${selectedFiles.has(file.id) 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleSelectFile(file.id)}
                  >
                    {/* 체크박스 */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${selectedFiles.has(file.id) 
                          ? 'bg-primary-500 border-primary-500' 
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {selectedFiles.has(file.id) && (
                          <CheckCircleIcon className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* 파일 미리보기 */}
                    <div className="aspect-square p-2">
                      {file.type.startsWith('image/') && showImagePreviews && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                          {file.type.startsWith('image/') ? (
                            <PhotoIcon className="w-8 h-8 text-blue-500" />
                          ) : (
                            <DocumentIcon className="w-8 h-8 text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* 파일 정보 */}
                    <div className="p-3 pb-2">
                      <p className="text-xs font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {file.status === 'completed' && (
                        <div className="flex items-center gap-2 mt-2">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <div className="flex gap-1 flex-wrap">
                            {file.textRecognitionResult && file.textRecognitionResult.text.trim() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForTextRecognition(file)
                                }}
                                className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                                title={`텍스트 인식 결과 보기 (품질: ${file.textRecognitionResult?.qualityAssessment?.overallScore || 0}점)`}
                              >
                                📝
                              </button>
                            )}
                            {file.objectDetectionResult && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForDetection(file)
                                }}
                                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                              >
                                🔍 {file.objectDetectionResult.objects.length}
                              </button>
                            )}
                            {file.advancedAnalysisResult && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForAdvancedAnalysis(file)
                                }}
                                className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                              >
                                ⚡
                              </button>
                            )}
                            {file.comprehensiveMetadata && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForComprehensiveAnalysis(file)
                                }}
                                className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-2 py-1 rounded hover:from-blue-200 hover:to-purple-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                                title={`종합 분석 결과 보기 (신뢰도: ${file.comprehensiveMetadata.processingInfo.confidence.overall}%)`}
                              >
                                📊
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                      ${selectedFiles.has(file.id) 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => handleSelectFile(file.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* 체크박스 */}
                      <div className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center
                        ${selectedFiles.has(file.id) 
                          ? 'bg-primary-500 border-primary-500' 
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {selectedFiles.has(file.id) && (
                          <CheckCircleIcon className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* 파일 아이콘 또는 미리보기 */}
                      {file.type.startsWith('image/') && showImagePreviews && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded">
                          {file.type.startsWith('image/') ? (
                            <PhotoIcon className="w-6 h-6 text-blue-500" />
                          ) : (
                            <DocumentIcon className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                      )}

                      {/* 파일 정보 */}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                          {file.type.startsWith('image/') && file.imageMetadata && (
                            <span className="ml-2">
                              • {file.imageMetadata.width}×{file.imageMetadata.height}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          <div className="flex gap-1 flex-wrap">
                            {file.textRecognitionResult && file.textRecognitionResult.text.trim() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForTextRecognition(file)
                                }}
                                className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded hover:bg-green-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                                title={`텍스트 인식 결과 보기 (품질: ${file.textRecognitionResult?.qualityAssessment?.overallScore || 0}점)`}
                              >
                                📝
                              </button>
                            )}
                            {file.objectDetectionResult && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForDetection(file)
                                }}
                                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                              >
                                🔍 {file.objectDetectionResult.objects.length}
                              </button>
                            )}
                            {file.advancedAnalysisResult && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForAdvancedAnalysis(file)
                                }}
                                className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                              >
                                ⚡
                              </button>
                            )}
                            {file.comprehensiveMetadata && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedImageForComprehensiveAnalysis(file)
                                }}
                                className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-2 py-1 rounded hover:from-blue-200 hover:to-purple-200 transition-colors min-w-[24px] h-6 flex items-center justify-center"
                                title={`종합 분석 결과 보기 (신뢰도: ${file.comprehensiveMetadata.processingInfo.confidence.overall}%)`}
                              >
                                📊
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <XMarkIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-gray-600">파일을 처리하고 있습니다...</p>
          </Card>
        </motion.div>
      )}

      {/* 객체 인식 시각화 모달 */}
      {selectedImageForDetection && selectedImageForDetection.objectDetectionResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">객체 인식 결과</h3>
                <button
                  onClick={() => setSelectedImageForDetection(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <ObjectDetectionVisualizer
                imageUrl={selectedImageForDetection.preview!}
                objects={selectedImageForDetection.objectDetectionResult.objects}
                imageSize={selectedImageForDetection.objectDetectionResult.imageSize}
              />
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 인식 결과 모달 */}
      {selectedImageForTextRecognition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">텍스트 인식 결과</h3>
                <button
                  onClick={() => setSelectedImageForTextRecognition(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* 이미지 미리보기 */}
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src={selectedImageForTextRecognition.preview!}
                      alt={selectedImageForTextRecognition.name}
                      className="w-64 h-64 object-cover rounded-lg border"
                    />
                  </div>
                  
                  {/* 텍스트 결과 */}
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold mb-3">인식된 텍스트</h4>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedImageForTextRecognition.textRecognitionResult?.text || '텍스트를 찾을 수 없습니다.'}
                      </p>
                    </div>
                    
                    {/* 품질 평가 */}
                    {selectedImageForTextRecognition.textRecognitionResult?.qualityAssessment && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600 font-medium">전체 품질 점수</div>
                          <div className="text-2xl font-bold text-blue-800">
                            {selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.overallScore}/100
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600 font-medium">평균 신뢰도</div>
                          <div className="text-2xl font-bold text-green-800">
                            {Math.round(selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.averageConfidence * 100)}%
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600 font-medium">텍스트 길이</div>
                          <div className="text-2xl font-bold text-purple-800">
                            {selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.textLength}자
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-sm text-orange-600 font-medium">단어 수</div>
                          <div className="text-2xl font-bold text-orange-800">
                            {selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.wordCount}개
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* 언어 정보 */}
                    {selectedImageForTextRecognition.textRecognitionResult?.qualityAssessment && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-2">언어 구성</h5>
                        <div className="flex gap-2">
                          {selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.hasKorean && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">한국어</span>
                          )}
                          {selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.hasEnglish && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">영어</span>
                          )}
                          {selectedImageForTextRecognition.textRecognitionResult.qualityAssessment.hasNumbers && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">숫자</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 단어별 상세 정보 */}
                {selectedImageForTextRecognition.textRecognitionResult?.words && selectedImageForTextRecognition.textRecognitionResult.words.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">단어별 분석</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedImageForTextRecognition.textRecognitionResult.words.map((word, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{word.text}</span>
                            <span className="text-xs text-gray-600">
                              {Math.round(word.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 고급 분석 모달 */}
      {selectedImageForAdvancedAnalysis && selectedImageForAdvancedAnalysis.advancedAnalysisResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">고급 이미지 분석 결과</h3>
                <button
                  onClick={() => setSelectedImageForAdvancedAnalysis(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              <AdvancedAnalysisViewer
                analysisResult={selectedImageForAdvancedAnalysis.advancedAnalysisResult}
              />
            </div>
          </div>
        </div>
      )}

      {/* 통합 분석 모달 */}
      {selectedImageForComprehensiveAnalysis && selectedImageForComprehensiveAnalysis.comprehensiveMetadata && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">🎯 종합 이미지 분석 결과</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    신뢰도: {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.processingInfo.confidence.overall}% | 
                    처리시간: {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.processingInfo.processingTime.toFixed(0)}ms
                  </p>
                </div>
                <button
                  onClick={() => setSelectedImageForComprehensiveAnalysis(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 이미지 미리보기 */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={selectedImageForComprehensiveAnalysis.preview!}
                      alt={selectedImageForComprehensiveAnalysis.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  
                  {/* 기본 정보 */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">📄 기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">파일명:</span>
                        <span className="font-medium">{selectedImageForComprehensiveAnalysis.comprehensiveMetadata.fileInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">크기:</span>
                        <span className="font-medium">{(selectedImageForComprehensiveAnalysis.comprehensiveMetadata.fileInfo.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">해상도:</span>
                        <span className="font-medium">
                          {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.imageProperties.dimensions.width} × 
                          {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.imageProperties.dimensions.height}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">비율:</span>
                        <span className="font-medium">{selectedImageForComprehensiveAnalysis.comprehensiveMetadata.imageProperties.dimensions.aspectRatio.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 분석 결과 */}
                <div className="space-y-4">
                  {/* 사람 인식 */}
                  {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.peopleDetection.totalCount > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-3">👥 사람 인식 ({selectedImageForComprehensiveAnalysis.comprehensiveMetadata.peopleDetection.totalCount}명)</h4>
                      <div className="space-y-2">
                        {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.peopleDetection.people.map((person: any, index: number) => (
                          <div key={index} className="bg-white rounded p-3 text-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">사람 {index + 1}</span>
                              <span className="text-green-600">신뢰도: {Math.round(person.confidence * 100)}%</span>
                            </div>
                            {person.demographics.estimatedAge && (
                              <div className="text-gray-600">나이: {person.demographics.estimatedAge.range}</div>
                            )}
                            {person.demographics.estimatedGender && (
                              <div className="text-gray-600">성별: {person.demographics.estimatedGender.gender}</div>
                            )}
                            {person.emotions.length > 0 && (
                              <div className="text-gray-600">
                                감정: {person.emotions.map((e: any) => e.emotion).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 객체 인식 */}
                  {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.objectDetection.totalObjects > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-3">🔍 객체 인식 ({selectedImageForComprehensiveAnalysis.comprehensiveMetadata.objectDetection.totalObjects}개)</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedImageForComprehensiveAnalysis.comprehensiveMetadata.objectDetection.categories).map(([category, objects]) => {
                          if (Array.isArray(objects) && objects.length > 0) {
                            return (
                              <div key={category} className="bg-white rounded p-3 text-sm">
                                <div className="font-medium text-gray-800 mb-1">{category}:</div>
                                <div className="text-gray-600">
                                  {objects.map((obj: any, index: number) => (
                                    <span key={index} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                                      {obj.type || obj.species || obj.equipment || obj.item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    </div>
                  )}

                  {/* 텍스트 인식 */}
                  {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.textAnalysis.hasText && (
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-3">📝 텍스트 인식</h4>
                      <div className="bg-white rounded p-3 text-sm">
                        <div className="mb-2">
                          <span className="font-medium">총 텍스트 길이:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.textAnalysis.totalTextLength}자
                        </div>
                        <div className="mb-2">
                          <span className="font-medium">언어:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.textAnalysis.languages.map((l: any) => l.language).join(', ')}
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.textAnalysis.textBlocks.map((block: any) => block.text).join(' ')}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 장면 분석 */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-3">🏞️ 장면 분석</h4>
                    <div className="bg-white rounded p-3 text-sm space-y-2">
                      <div>
                        <span className="font-medium">위치:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.sceneAnalysis.setting.location}
                      </div>
                      <div>
                        <span className="font-medium">환경:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.sceneAnalysis.environment.type}
                      </div>
                      <div>
                        <span className="font-medium">주요 활동:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.sceneAnalysis.activity.mainActivity}
                      </div>
                      <div>
                        <span className="font-medium">분위기:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.sceneAnalysis.activity.atmosphere}
                      </div>
                    </div>
                  </div>

                  {/* 색상 분석 */}
                  <div className="bg-pink-50 rounded-lg p-4">
                    <h4 className="font-semibold text-pink-900 mb-3">🎨 색상 분석</h4>
                    <div className="bg-white rounded p-3 text-sm space-y-2">
                      <div>
                        <span className="font-medium">분위기:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.colorAnalysis.mood}
                      </div>
                      <div>
                        <span className="font-medium">밝기:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.colorAnalysis.brightness}%
                      </div>
                      <div>
                        <span className="font-medium">대비:</span> {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.colorAnalysis.contrast}%
                      </div>
                      <div className="flex gap-2 mt-2">
                        {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.colorAnalysis.dominantColors.slice(0, 3).map((color: any, index: number) => (
                          <div key={index} className="flex items-center gap-1">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: color.color }}
                            ></div>
                            <span className="text-xs">{color.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 개인화 분석 */}
                  {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.personalAnalysis && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-900 mb-3">💡 개인화 분석</h4>
                      <div className="bg-white rounded p-3 text-sm space-y-2">
                        {selectedImageForComprehensiveAnalysis.comprehensiveMetadata.personalAnalysis.suggestions.recommendations.map((rec: any, index: number) => (
                          <div key={index} className="text-gray-700">• {rec}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
