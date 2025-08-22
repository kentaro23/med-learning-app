'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PDFClozePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [generatedCloze, setGeneratedCloze] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📄 File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    if (file.type !== 'application/pdf') {
      setError('PDFファイルのみアップロード可能です');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB制限
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }

    setUploadedFile(file);
    setError('');
    setIsUploading(true);
    console.log('🚀 Starting PDF upload and text extraction...');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/pdf/extract-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'テキスト抽出に失敗しました');
      }

      const result = await response.json();
      setExtractedText(result.text);
      console.log('✅ PDF text extracted successfully:', {
        textLength: result.text.length,
        pageCount: result.pageCount
      });
    } catch (err) {
      console.error('❌ PDF processing error:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsUploading(false);
    }
  };

  const generateCloze = async () => {
    if (!extractedText) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/create-cloze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText }),
      });

      if (!response.ok) {
        throw new Error('穴埋め問題の生成に失敗しました');
      }

      const result = await response.json();
      setGeneratedCloze(result.cloze);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const clearAll = () => {
    setUploadedFile(null);
    setExtractedText('');
    setGeneratedCloze('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">PDF穴埋め作成</h1>
          <p className="text-gray-600 mt-2">
            A4 PDFから穴埋め問題を自動生成し、資料ごと共有できます
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* PDFアップロード */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">1. PDFアップロード</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="pdf-upload"
                  disabled={isUploading}
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">
                    {isUploading ? 'アップロード中...' : 'PDFファイルを選択'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    最大10MB、PDF形式のみ
                  </p>
                </label>
              </div>

              {uploadedFile && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-800 font-medium">{uploadedFile.name}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* テキスト抽出結果 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">2. テキスト抽出結果</h2>
            
            {extractedText ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {extractedText.length > 500 
                      ? `${extractedText.substring(0, 500)}...` 
                      : extractedText
                    }
                  </p>
                  {extractedText.length > 500 && (
                    <p className="text-xs text-gray-500 mt-2">
                      表示中: 500文字 / 全体: {extractedText.length}文字
                    </p>
                  )}
                </div>
                
                <button
                  onClick={generateCloze}
                  disabled={isGenerating}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? '生成中...' : '穴埋め問題を生成'}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>PDFをアップロードしてテキストを抽出してください</p>
              </div>
            )}
          </div>

          {/* 生成された穴埋め問題 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">3. 穴埋め問題</h2>
            
            {generatedCloze ? (
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {generatedCloze}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedCloze)}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    コピー
                  </button>
                  <button
                    onClick={clearAll}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    クリア
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>テキスト抽出後に穴埋め問題を生成してください</p>
              </div>
            )}
          </div>
        </div>

        {/* 使用上の注意 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">使用上の注意</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• PDFファイルは最大10MBまでアップロード可能です</li>
            <li>• テキストが抽出できないPDF（スキャン画像のみ）は対応していません</li>
            <li>• 生成された穴埋め問題は医学教育目的での使用を推奨します</li>
            <li>• 機密情報を含むPDFはアップロードしないでください</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
