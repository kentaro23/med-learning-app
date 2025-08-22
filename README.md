# Med Memo AI

医学学習をAIで効率化する次世代プラットフォーム。CBT・国試対策から日常学習まで、AIがあなたの医学知識習得をサポートします。

## 🚀 主要機能

### AI問題作成
- トピックを指定して、AIが最適な医学問題を自動生成
- 初級〜上級の難易度設定
- 5〜25問の柔軟な問題数

### 単語帳・カードセット
- 自分だけのカードセットを作成し、他の学習者と共有
- SNS要素で学習を楽しく、効率的に進められる
- 公開・限定公開・非公開設定

### PDF穴埋め問題
- 講義資料や教科書のPDFから、AIが自動で穴埋め問題を生成
- 資料ごと共有して、効率的な学習を実現

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **データベース**: Prisma + SQLite（ローカル）
- **認証**: NextAuth.js（Email/Password）
- **AI**: OpenAI API（GPT-4o-mini）
- **PDF処理**: pdf-parse
- **バリデーション**: Zod
- **フォーム**: React Hook Form

## 📋 前提条件

- Node.js 20+
- pnpm
- OpenAI API キー

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd med-memo-ai
```

### 2. 依存関係のインストール
```bash
pnpm install
```

### 3. 環境変数の設定
`.env`ファイルを作成し、以下の内容を設定してください：

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. データベースのセットアップ
```bash
# データベースのマイグレーション
npx prisma migrate dev

# データベースのシード（テストデータ投入）
pnpm run db:seed
```

### 5. 開発サーバーの起動
```bash
pnpm dev
```

## 🌱 Seed実行手順

### 初回実行
```bash
pnpm run db:seed
```

### 再実行（データリセット）
```bash
# データベースをリセット
npx prisma migrate reset

# シードを再実行
pnpm run db:seed
```

### 生成されるテストデータ
- **ユーザー**: demo@med.ai / demo1234
- **CardSet**: "循環器 基礎"（3枚のQ&Aカード付き）

## 📱 アクセス方法

開発サーバー起動後、以下のURLでアクセスできます：

- **アプリ紹介ページ**: `http://localhost:3000/intro`
- **ログイン**: `http://localhost:3000/auth/signin`
- **新規登録**: `http://localhost:3000/auth/signup`
- **メインダッシュボード**: `http://localhost:3000`（認証必要）
- **AI問題作成**: `http://localhost:3000/ai-questions`（認証必要）
- **単語帳**: `http://localhost:3000/card-sets`（認証必要）
- **PDF穴埋め**: `http://localhost:3000/pdf-cloze`（認証必要）

## 🔐 認証

- **新規登録**: ユーザー名、メール、パスワードでアカウント作成
- **ログイン**: メール・パスワード認証
- **セッション管理**: NextAuth.jsによる安全なセッション管理

## 🧪 テスト

### テストアカウント
```
Email: demo@med.ai
Password: demo1234
```

### API テスト
```bash
# カードセット生成API
curl -X POST http://localhost:3000/api/cardsets/[id]/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"心臓の構造について","count":5,"source":"テスト"}'
```

## 📁 プロジェクト構造

```
med-memo-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API エンドポイント
│   │   ├── auth/              # 認証ページ
│   │   ├── intro/             # アプリ紹介ページ
│   │   └── ...                # その他のページ
│   ├── lib/                   # ユーティリティ
│   └── types/                 # 型定義
├── prisma/                    # データベース関連
│   ├── schema.prisma         # Prismaスキーマ
│   └── seed.ts               # シードデータ
├── .env                      # 環境変数
└── package.json              # 依存関係
```

## 🚀 デプロイ

### Vercel
```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

### 本番環境の注意点
- 環境変数の適切な設定
- データベースの本番環境対応（PostgreSQL推奨）
- OpenAI API キーの管理

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesを作成してください。
