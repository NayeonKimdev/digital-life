'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  PhotoIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { useFileUpload } from '@/hooks'
import { Card, LoadingSpinner } from '@/components/ui'
import { SUPPORTED_FILE_TYPES } from '@/constants'
import { UploadedFile } from '@/types'

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const { uploadedFiles, isUploading, uploadFiles, removeFile } = useFileUpload()

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
            <p className="text-gray-500">
              이미지, JSON, CSV, PDF, 문서 파일을 지원합니다
            </p>
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
            <h3 className="text-lg font-semibold mb-4">업로드된 파일</h3>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {file.type.startsWith('image/') ? (
                      <PhotoIcon className="w-8 h-8 text-blue-500" />
                    ) : (
                      <DocumentIcon className="w-8 h-8 text-gray-500" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    )}
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <XMarkIcon className="w-4 h-4 text-gray-500" />
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
    </div>
  )
}
