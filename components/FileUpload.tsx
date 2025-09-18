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

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const { uploadedFiles, isUploading, uploadFiles, removeFile, clearAllFiles } = useFileUpload()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showImagePreviews, setShowImagePreviews] = useState(true)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

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
                  onClick={() => setShowImagePreviews(!showImagePreviews)}
                  className={`p-2 rounded ${showImagePreviews ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showImagePreviews ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
                </button>
                <span className="text-sm text-gray-500">이미지 미리보기</span>
              </div>
            </div>

            {/* 파일 목록 */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {uploadedFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`
                      relative group cursor-pointer rounded-lg border-2 transition-all duration-200
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
                    <div className="p-2">
                      <p className="text-xs font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {file.status === 'completed' && (
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mt-1" />
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
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
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
    </div>
  )
}
