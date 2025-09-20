'use client'
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload, IconFileText, IconLoader2, IconCheck, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";
import { extractPDFText, PDFExtractionResponse, formatExtractedText } from "@/lib/pdf-api";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface PDFFile extends File {
  status?: UploadStatus;
  extractedText?: string;
  error?: string;
  metadata?: {
    char_count: number;
    word_count: number;
    line_count: number;
  };
}

export const PDFUpload = ({
  onTextExtracted,
  onError,
}: {
  onTextExtracted?: (text: string, filename: string, metadata?: {
    char_count: number;
    word_count: number;
    line_count: number;
  }) => void;
  onError?: (error: string, filename: string) => void;
}) => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (newFiles: File[]) => {
    // Filter only PDF files
    const pdfFiles = newFiles.filter(file => 
      file.name.toLowerCase().endsWith('.pdf')
    ) as PDFFile[];

    if (pdfFiles.length === 0) {
      alert('Please upload only PDF files');
      return;
    }

    // Add files with initial status
    const filesWithStatus = pdfFiles.map(file => ({
      ...file,
      status: 'idle' as UploadStatus
    }));

    setFiles(prev => [...prev, ...filesWithStatus]);

    // Process each file
    for (const file of filesWithStatus) {
      await processFile(file);
    }
  };

  const processFile = async (file: PDFFile) => {
    try {
      // Update status to uploading
      updateFileStatus(file.name, 'uploading');

      // Extract text from PDF
      updateFileStatus(file.name, 'processing');
      const result: PDFExtractionResponse = await extractPDFText(file);

      // Format the extracted text
      const formattedText = formatExtractedText(result.text);

      // Update file with extracted data
      setFiles(prev => prev.map(f => 
        f.name === file.name 
          ? { 
              ...f, 
              status: 'success', 
              extractedText: formattedText,
              metadata: result.metadata 
            }
          : f
      ));

      // Call the callback with extracted text
      if (onTextExtracted) {
        onTextExtracted(formattedText, result.filename, result.metadata);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setFiles(prev => prev.map(f => 
        f.name === file.name 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      // Call the error callback
      if (onError) {
        onError(errorMessage, file.name);
      }
    }
  };

  const updateFileStatus = (filename: string, status: UploadStatus) => {
    setFiles(prev => prev.map(f => 
      f.name === filename ? { ...f, status } : f
    ));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (filename: string) => {
    setFiles(prev => prev.filter(f => f.name !== filename));
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    accept: {
      'application/pdf': ['.pdf']
    },
    onDrop: handleFileChange,
    onDropRejected: (rejectedFiles) => {
      console.log('Rejected files:', rejectedFiles);
      alert('Only PDF files are allowed');
    },
  });

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <IconLoader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <IconCheck className="h-4 w-4 text-green-500" />;
      case 'error':
        return <IconX className="h-4 w-4 text-red-500" />;
      default:
        return <IconFileText className="h-4 w-4 text-neutral-500" />;
    }
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Extracting text...';
      case 'success':
        return 'Text extracted successfully';
      case 'error':
        return 'Extraction failed';
      default:
        return 'Ready to process';
    }
  };

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="pdf-upload-handle"
          type="file"
          accept=".pdf"
          multiple
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-neutral-700 dark:text-neutral-300 text-base">
            Upload PDF for Text Extraction
          </p>
          <p className="relative z-20 font-sans font-normal text-neutral-400 dark:text-neutral-400 text-base mt-2">
            Drag or drop PDF files here or click to upload (Max 16MB)
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"pdf-file" + idx}
                  layoutId={idx === 0 ? "pdf-upload" : "pdf-upload-" + idx}
                  className={cn(
                    "relative overflow-hidden z-40 bg-white dark:bg-neutral-900 flex flex-col items-start justify-start md:h-auto p-4 mt-4 w-full mx-auto rounded-md",
                    "shadow-sm border",
                    file.status === 'success' && "border-green-200 bg-green-50 dark:bg-green-900/20",
                    file.status === 'error' && "border-red-200 bg-red-50 dark:bg-red-900/20"
                  )}
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status || 'idle')}
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="text-base text-neutral-700 dark:text-neutral-300 truncate max-w-xs"
                      >
                        {file.name}
                      </motion.p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600 dark:bg-neutral-800 dark:text-white shadow-input"
                      >
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.name);
                        }}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <IconX className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 dark:text-neutral-400">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className={cn(
                        "px-2 py-1 rounded-md text-xs",
                        file.status === 'success' && "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200",
                        file.status === 'error' && "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200",
                        file.status === 'processing' && "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200",
                        !file.status || file.status === 'idle' && "bg-gray-100 dark:bg-neutral-800"
                      )}
                    >
                      {getStatusText(file.status || 'idle')}
                    </motion.p>

                    {file.metadata && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        layout
                        className="text-xs"
                      >
                        {file.metadata.word_count} words, {file.metadata.char_count} chars
                      </motion.p>
                    )}
                  </div>

                  {file.error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-500 text-xs mt-2"
                    >
                      Error: {file.error}
                    </motion.p>
                  )}

                  {file.extractedText && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="w-full mt-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded text-xs"
                    >
                      <p className="font-medium mb-2">Extracted Text Preview:</p>
                      <p className="text-neutral-600 dark:text-neutral-400 max-h-20 overflow-y-auto">
                        {file.extractedText.substring(0, 200)}
                        {file.extractedText.length > 200 && '...'}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="pdf-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className={cn(
                  "relative group-hover/file:shadow-2xl z-40 bg-white dark:bg-neutral-900 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md",
                  "shadow-[0px_10px_50px_rgba(0,0,0,0.1)]"
                )}
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-neutral-600 flex flex-col items-center"
                  >
                    Drop PDF here
                    <IconUpload className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  </motion.p>
                ) : (
                  <div className="flex flex-col items-center">
                    <IconFileText className="h-6 w-6 text-neutral-600 dark:text-neutral-300 mb-1" />
                    <span className="text-xs text-neutral-500">PDF</span>
                  </div>
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export function GridPattern() {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-100 dark:bg-neutral-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-gray-50 dark:bg-neutral-950"
                  : "bg-gray-50 dark:bg-neutral-950 shadow-[0px_0px_1px_3px_rgba(255,255,255,1)_inset] dark:shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
}