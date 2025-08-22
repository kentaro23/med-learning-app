'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

interface SearchResult {
  id: string;
  type: 'cardSet' | 'card' | 'pdf';
  title: string;
  description?: string;
  tags?: string;
  owner?: string;
  createdAt: string;
  url: string;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'cardSet' | 'card' | 'pdf'>('all');

  useEffect(() => {
    if (searchTerm) {
      performSearch();
    }
  }, [searchTerm, selectedType]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${selectedType}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cardSet': return '単語帳';
      case 'card': return 'カード';
      case 'pdf': return 'PDF';
      default: return '不明';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'cardSet': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'pdf': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddToHome = async (cardSetId: string) => {
    try {
      const response = await fetch('/api/card-sets/add-to-home', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cardSetId }),
      });

      if (response.ok) {
        alert('単語帳がホームに追加されました！');
      } else {
        const errorData = await response.json();
        alert(`追加に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding to home:', error);
      alert('ホームへの追加に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">検索</h1>
          <p className="text-xl text-gray-600">
            単語帳、カード、PDF資料から必要な情報を見つけましょう
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="キーワードを入力してください（例：循環器、解剖学、心臓...）"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                検索
              </button>
            </div>
            
            {/* Type Filter */}
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="all"
                  checked={selectedType === 'all'}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">全て</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="cardSet"
                  checked={selectedType === 'cardSet'}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">単語帳</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="card"
                  checked={selectedType === 'card'}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">カード</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="pdf"
                  checked={selectedType === 'pdf'}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">PDF</span>
              </label>
            </div>
          </form>
        </div>

        {/* Search Results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">検索中...</p>
            </div>
          ) : searchTerm && searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">検索結果が見つかりません</h3>
              <p className="text-gray-600">
                「{searchTerm}」に一致する結果がありませんでした。<br />
                別のキーワードで検索してみてください。
              </p>
            </div>
          ) : searchTerm && searchResults.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  検索結果: {searchResults.length}件
                </h2>
                <p className="text-gray-600">
                  「{searchTerm}」の検索結果
                </p>
              </div>
              
              <div className="grid gap-6">
                {searchResults.map((result) => (
                  <div key={`${result.type}-${result.id}`} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(result.type)}`}>
                            {getTypeLabel(result.type)}
                          </span>
                          {result.owner && (
                            <span className="text-sm text-gray-500">
                              作成者: {result.owner}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          <Link href={result.url} className="hover:text-blue-600 transition-colors">
                            {result.title}
                          </Link>
                        </h3>
                        
                        {result.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        
                        {result.tags && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {result.tags.split(',').map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          作成日: {new Date(result.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Link
                          href={result.url}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          詳細を見る
                        </Link>
                        {result.type === 'cardSet' && (
                          <button
                            onClick={() => handleAddToHome(result.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            ホームに追加
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">検索を開始してください</h3>
              <p className="text-gray-600">
                上記の検索バーにキーワードを入力して、<br />
                単語帳、カード、PDF資料を検索できます。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
