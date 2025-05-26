'use client';

import { useState } from 'react';

// 定義 API 回應的資料結構
interface ShortenResponse {
  success: boolean;
  data?: {
    id: string;
    originalUrl: string;
    shortUrl: string;
    shortId: string;
    createdAt: Date;
  };
  error?: string;
}

export default function Home() {
  // 狀態管理：原始網址輸入
  const [originalUrl, setOriginalUrl] = useState<string>('');
  // 狀態管理：產生的短網址
  const [shortUrl, setShortUrl] = useState<string>('');
  // 狀態管理：載入狀態
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 狀態管理：錯誤訊息
  const [error, setError] = useState<string>('');
  // 狀態管理：複製成功提示
  const [copied, setCopied] = useState<boolean>(false);

  // 處理表單提交，呼叫 API 產生短網址
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShortUrl('');

    try {
      // 呼叫短網址產生 API
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ originalUrl }),
      });

      const data: ShortenResponse = await response.json();

      // 檢查 API 回應是否成功
      if (data.success && data.data) {
        setShortUrl(data.data.shortUrl);
      } else {
        setError(data.error || '產生短網址失敗');
      }
    } catch (err) {
      // 處理網路錯誤
      setError('網路錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理複製短網址到剪貼簿
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      // 2秒後隱藏複製成功提示
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('複製失敗:', err);
    }
  };

  // 處理在新分頁開啟短網址
  const handleVisit = () => {
    if (shortUrl) {
      window.open(shortUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* 頁面標題區域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">長網址產生器</h1>
          <p className="text-gray-600">將您的長網址轉換為簡短易分享的連結</p>
        </div>

        {/* 網址輸入表單 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-black mb-2">
              請輸入網址
            </label>
            <input
              type="url"
              id="url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              required
            />
          </div>

          {/* 提交按鈕，載入時顯示不同文字並禁用 */}
          <button
            type="submit"
            disabled={isLoading || !originalUrl.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '產生中...' : '產生短網址'}
          </button>
        </form>

        {/* 錯誤訊息顯示區域 */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* 短網址結果顯示區域 */}
        {shortUrl && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-black mb-2">您的短網址：</h3>
            <div className="flex items-center space-x-2">
              {/* 短網址顯示輸入框（唯讀） */}
              <input
                type="text"
                value={shortUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-black text-sm"
              />
              {/* 複製按鈕，複製成功時顯示不同文字 */}
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors text-sm"
              >
                {copied ? '已複製!' : '複製'}
              </button>
              {/* 前往短網址按鈕 */}
              <button
                onClick={handleVisit}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
              >
                前往
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
