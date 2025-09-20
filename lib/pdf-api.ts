/**
 * API service for PDF text extraction
 * Handles communication with the Flask backend
 */

export interface PDFExtractionResponse {
  success: boolean;
  filename: string;
  text: string;
  metadata: {
    char_count: number;
    word_count: number;
    line_count: number;
  };
}

export interface PDFExtractionError {
  error: string;
  message: string;
}

/**
 * Upload a PDF file and extract its text content (using hardcoded sample data)
 * @param file - The PDF file to upload
 * @returns Promise with sample extracted text data
 */
export async function extractPDFText(file: File): Promise<PDFExtractionResponse> {
  // Validate file type on frontend
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF files are supported');
  }

  // Validate file size (16MB limit)
  const maxSize = 16 * 1024 * 1024; // 16MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 16MB limit');
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Return hardcoded sample response
  const sampleText = `Research Paper Sample

--- Page 1 ---
ABSTRACT

This study investigates the effectiveness of machine learning algorithms in predicting customer behavior patterns. We analyzed data from 10,000 customers over a 12-month period using multiple classification algorithms including Random Forest, Support Vector Machines, and Neural Networks. Our findings indicate that ensemble methods achieve 87% accuracy in predicting customer churn, significantly outperforming traditional statistical models.

Keywords: machine learning, customer analytics, predictive modeling, churn prediction

--- Page 2 ---
1. INTRODUCTION

Customer retention has become increasingly important in today's competitive market environment. Organizations are constantly seeking innovative approaches to understand and predict customer behavior patterns. Machine learning techniques offer promising solutions for analyzing large datasets and identifying complex patterns that traditional methods might miss.

Previous research in this domain has shown mixed results, with accuracy rates ranging from 65% to 82% depending on the methodology and dataset characteristics. This study aims to improve upon existing approaches by implementing ensemble methods and comprehensive feature engineering.

--- Page 3 ---
2. METHODOLOGY

2.1 Data Collection
We collected customer transaction data from a large e-commerce platform over 12 months (January 2023 - December 2023). The dataset includes:
- Customer demographics (age, location, income level)
- Transaction history (frequency, amount, product categories)
- Website interaction data (page views, session duration)
- Customer service interactions

2.2 Data Preprocessing
Data cleaning procedures included handling missing values, outlier detection, and feature normalization. We applied principal component analysis (PCA) to reduce dimensionality while preserving 95% of the variance.

--- Page 4 ---
3. RESULTS

The Random Forest algorithm achieved the highest individual performance with 84% accuracy, 82% precision, and 86% recall. However, our ensemble approach combining multiple algorithms improved performance to 87% accuracy.

Table 1: Algorithm Performance Comparison
Algorithm | Accuracy | Precision | Recall | F1-Score
Random Forest | 84% | 82% | 86% | 84%
SVM | 79% | 77% | 81% | 79%
Neural Network | 82% | 80% | 84% | 82%
Ensemble | 87% | 85% | 89% | 87%

4. DISCUSSION

The results demonstrate that ensemble methods can significantly improve prediction accuracy for customer churn. The combination of different algorithmic approaches helps capture various aspects of customer behavior that individual models might miss.

5. CONCLUSION

This research contributes to the growing body of knowledge in customer analytics by demonstrating the effectiveness of ensemble machine learning approaches. Future work should explore additional feature sets and longer observation periods.

REFERENCES

[1] Smith, J. et al. (2022). "Customer Analytics in the Digital Age." Journal of Business Intelligence, 15(3), 45-62.
[2] Johnson, A. (2023). "Machine Learning Applications in E-commerce." Data Science Review, 8(2), 123-140.
[3] Brown, M. et al. (2021). "Predictive Modeling for Customer Retention." Analytics Quarterly, 12(4), 78-95.`;

  const wordCount = sampleText.split(/\s+/).length;
  const charCount = sampleText.length;
  const lineCount = sampleText.split('\n').length;

  return {
    success: true,
    filename: file.name,
    text: sampleText,
    metadata: {
      char_count: charCount,
      word_count: wordCount,
      line_count: lineCount
    }
  };
}

/**
 * Check if the PDF extraction service is healthy (always returns true for hardcoded version)
 * @returns Promise<boolean> - always true since no backend is needed
 */
export async function checkAPIHealth(): Promise<boolean> {
  return true;
}

/**
 * Format extracted text for display or further processing
 * @param text - Raw extracted text
 * @returns Formatted text with cleaned whitespace
 */
export function formatExtractedText(text: string): string {
  return text
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Split extracted text into chunks for LLM processing
 * @param text - Text to chunk
 * @param maxChunkSize - Maximum characters per chunk (default: 4000)
 * @param overlap - Overlap between chunks in characters (default: 200)
 * @returns Array of text chunks
 */
export function chunkTextForLLM(
  text: string, 
  maxChunkSize: number = 4000, 
  overlap: number = 200
): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // If we're not at the end, try to find a good breaking point
    if (end < text.length) {
      // Look for sentence boundaries (. ! ?) followed by space
      const sentenceBreak = text.lastIndexOf('. ', end);
      const questionBreak = text.lastIndexOf('? ', end);
      const exclamationBreak = text.lastIndexOf('! ', end);
      
      const breakPoint = Math.max(sentenceBreak, questionBreak, exclamationBreak);
      
      if (breakPoint > start + maxChunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks;
}