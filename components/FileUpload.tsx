'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useFileUpload } from '@/hooks'
import { Card, LoadingSpinner, Button } from '@/components/ui'
import { SUPPORTED_FILE_TYPES } from '@/constants'
import { UploadedFile } from '@/types'
import { textRecognitionService } from '@/utils/textRecognition'

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const { uploadedFiles, isUploading, uploadFiles, removeFile, clearAllFiles } = useFileUpload()
  const [selectedImageForAnalysis, setSelectedImageForAnalysis] = useState<UploadedFile | null>(null)

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
              <h3 className="text-lg font-semibold">
                업로드된 파일 ({uploadedFiles.length}개)
              </h3>
              
              <div className="flex items-center gap-2">
                {/* 전체 삭제 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearAllFiles()
                    toast.success('모든 파일이 삭제되었습니다.')
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4 mr-1" />
                  전체 삭제
                </Button>
              </div>
            </div>


            {/* 파일 목록 */}
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    {/* 이미지 미리보기 */}
                    <div className="flex-shrink-0">
                      {file.type.startsWith('image/') && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg">
                          <PhotoIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* 파일 정보 */}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {file.status === 'completed' && file.textRecognitionResult && (
                        <div className="mt-2">
                          <div className="text-sm text-gray-600 mb-2">
                            주제: {file.textRecognitionResult.imageAnalysis?.topic || '분석 중...'}
                          </div>
                          <button
                            onClick={() => setSelectedImageForAnalysis(file)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            🔍 분석 결과 보기
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
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

      {/* 이미지 분석 결과 모달 */}
      {selectedImageForAnalysis && selectedImageForAnalysis.textRecognitionResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">🔍 이미지 분석 결과</h3>
                <button
                  onClick={() => setSelectedImageForAnalysis(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* 이미지 주제 분석 */}
                {selectedImageForAnalysis.textRecognitionResult.imageAnalysis && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-3">🎯 이미지 주제</h4>
                    <div className="bg-white rounded p-4 space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">주제:</span>
                        <p className="text-gray-900 mt-1">{selectedImageForAnalysis.textRecognitionResult.imageAnalysis.topic}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">설명:</span>
                        <p className="text-gray-900 mt-1">{selectedImageForAnalysis.textRecognitionResult.imageAnalysis.description}</p>
                      </div>
                      {selectedImageForAnalysis.textRecognitionResult.imageAnalysis.detectedElements.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">감지된 요소:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedImageForAnalysis.textRecognitionResult.imageAnalysis.detectedElements.map((element, index) => (
                              <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                                {element}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 추출된 텍스트 */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-3">📝 추출된 텍스트</h4>
                  <div className="bg-white rounded p-4">
                    <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                      {selectedImageForAnalysis.textRecognitionResult.text || '텍스트를 찾을 수 없습니다.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
