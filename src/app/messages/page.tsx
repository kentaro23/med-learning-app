'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../../components/Navigation';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

// デモ用のチャットユーザーデータ
const mockChatUsers: ChatUser[] = [
  {
    id: 'user1',
    name: '田中 花子',
    avatar: '🌸',
    lastMessage: '単語帳の共有ありがとうございます！',
    lastMessageTime: '2024-08-22T15:30:00Z',
    unreadCount: 2,
    isOnline: true
  },
  {
    id: 'user2',
    name: '佐藤 太郎',
    avatar: '🌿',
    lastMessage: '明日の勉強会に参加します',
    lastMessageTime: '2024-08-22T14:15:00Z',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 'user3',
    name: '鈴木 美咲',
    avatar: '⭐',
    lastMessage: '解剖学の問題について質問があります',
    lastMessageTime: '2024-08-22T12:45:00Z',
    unreadCount: 1,
    isOnline: true
  }
];

export default function MessagesPage() {
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // デモデータを設定
    setChatUsers(mockChatUsers);
    setIsLoading(false);
  }, []);

  const filteredChatUsers = chatUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const now = new Date();
    const messageTime = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '1時間以内';
    if (diffInHours < 24) return `${diffInHours}時間前`;
    return messageTime.toLocaleDateString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">メッセージを読み込み中...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">💬 メッセージ</h1>
              <p className="text-xl text-gray-600">
                友達やフォロワーとメッセージをやり取りしましょう
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>

        {/* 機能説明カード */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">DM機能は準備中です</h2>
            <p className="text-gray-600 mb-6">
              現在、メッセージ機能の開発を進めています。<br />
              以下の機能が予定されています：
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold text-gray-900 mb-2">リアルタイムチャット</h3>
                <p className="text-sm text-gray-600">オンラインでメッセージをやり取り</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-semibold text-gray-900 mb-2">プッシュ通知</h3>
                <p className="text-sm text-gray-600">新着メッセージをお知らせ</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <h3 className="font-semibold text-gray-900 mb-2">プライバシー保護</h3>
                <p className="text-sm text-gray-600">安全で安心なメッセージング</p>
              </div>
            </div>
          </div>
        </div>

        {/* チャット一覧（プレビュー） */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">最近のチャット</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ユーザーを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredChatUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.avatar}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{user.lastMessage}</p>
                    <p className="text-xs text-gray-400">{formatTime(user.lastMessageTime)}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  {user.unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 mb-2">
                      {user.unreadCount}
                    </div>
                  )}
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    チャット開始
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 選択されたユーザーの詳細（将来的な実装） */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  {selectedUser.avatar}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-gray-600">
                  {selectedUser.isOnline ? '🟢 オンライン' : '⚫ オフライン'}
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">最終メッセージ:</span><br />
                  {selectedUser.lastMessage}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">最終アクティブ:</span><br />
                  {formatTime(selectedUser.lastMessageTime)}
                </p>
              </div>
              
              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  チャット開始
                </button>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
