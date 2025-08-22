'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../../components/Navigation';

interface CardSetForm {
  title: string;
  description: string;
  visibility: 'private' | 'unlisted' | 'public';
  category: string;
  subcategory: string;
  tags: string;
}

const categories = {
  '基礎医学': ['解剖学', '生理学', '生化学', '薬理学', '病理学', '微生物学', '免疫学', '分子遺伝学', '組織学', '発生学'],
  '臨床医学': ['循環器', '呼吸器', '消化器', '腎臓・泌尿器', '内分泌・代謝', '血液・腫瘍', '神経', '精神', '小児', '産科・婦人科', '皮膚', '眼科', '耳鼻咽喉科', '整形外科', '救急・集中治療', '麻酔', '放射線', 'リハビリテーション'],
  '社会医学': ['公衆衛生', '法医学', '医療倫理', '医療経済', '疫学', '統計学'],
  'その他': ['看護学', '薬学', '歯学', '理学療法', '作業療法']
};

export default function CreateCardSetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CardSetForm>({
    title: '',
    description: '',
    visibility: 'private',
    category: '',
    subcategory: '',
    tags: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // APIを呼び出して単語帳を作成
      const response = await fetch('/api/card-sets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Card set created:', result);
        alert('単語帳が正常に作成されました！');
        
        // 成功したらカード追加ページにリダイレクト
        router.push(`/card-sets/${result.cardSet.id}/add-cards`);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        alert(`単語帳の作成に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating card set:', error);
      alert('単語帳の作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category,
      subcategory: '' // カテゴリが変わったらサブカテゴリをリセット
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">新しい単語帳を作成</h1>
              <p className="text-lg text-gray-600">
                効率的な学習のための単語帳を作成しましょう
              </p>
            </div>
            <Link
              href="/card-sets"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              一覧に戻る
            </Link>
          </div>
        </div>

        {/* 作成フォーム */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">基本情報</h2>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：循環器疾患の重要ポイント"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  説明
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="この単語帳の内容や学習のポイントを説明してください"
                />
              </div>
            </div>

            {/* 分類・カテゴリ */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">分類・カテゴリ</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    大分類 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">選択してください</option>
                    {Object.keys(categories).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-2">
                    小分類 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subcategory"
                    required
                    value={formData.subcategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!formData.category}
                  >
                    <option value="">大分類を先に選択してください</option>
                    {formData.category && categories[formData.category as keyof typeof categories]?.map(subcategory => (
                      <option key={subcategory} value={subcategory}>{subcategory}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 公開設定 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">公開設定</h2>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公開範囲
                </label>
                
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.visibility === 'private'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'private' | 'unlisted' | 'public' }))}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">非公開</div>
                      <div className="text-sm text-gray-600">自分だけが見ることができます</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="unlisted"
                      checked={formData.visibility === 'unlisted'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'private' | 'unlisted' | 'public' }))}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">限定公開</div>
                      <div className="text-sm text-gray-600">リンクを知っている人だけがアクセスできます</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'private' | 'unlisted' | 'public' }))}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">公開</div>
                      <div className="text-sm text-gray-600">誰でも検索して見つけることができます</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* タグ */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">タグ</h2>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  タグ（カンマ区切り）
                </label>
                <input
                  type="text"
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例：循環器, 心臓, 血管, 疾患"
                />
                <p className="text-sm text-gray-500 mt-1">
                  関連するキーワードをカンマ区切りで入力してください
                </p>
              </div>
            </div>

            {/* プレビュー */}
            {formData.title && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">プレビュー</h2>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{formData.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      formData.visibility === 'public' ? 'bg-green-100 text-green-800' :
                      formData.visibility === 'unlisted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.visibility === 'public' ? '公開' :
                       formData.visibility === 'unlisted' ? '限定公開' : '非公開'}
                    </span>
                  </div>
                  
                  {formData.description && (
                    <p className="text-gray-600 mb-3">{formData.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {formData.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {formData.category}
                      </span>
                    )}
                    {formData.subcategory && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {formData.subcategory}
                      </span>
                    )}
                    {formData.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                href="/card-sets"
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={isLoading || !formData.title || !formData.category || !formData.subcategory}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    作成中...
                  </div>
                ) : (
                  '単語帳を作成'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
