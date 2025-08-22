import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateMedicalQuestions(
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
) {
  const difficultyMap = {
    easy: '基本的な医学知識、一般的な症状や疾患',
    medium: '診断や治療の選択肢、薬理学の基礎',
    hard: '複雑な症例、最新の研究、専門的な治療法'
  };

  const prompt = `
以下の条件で医学の問題を作成してください：

トピック: ${topic}
難易度: ${difficulty} (${difficultyMap[difficulty]})
問題数: ${count}問

各問題は以下の形式で作成してください：
- 問題文は明確で簡潔
- 選択肢は4つ（A, B, C, D）
- 正解とその理由を説明
- 医学的に正確で、実用的な知識

出力形式：
問題1: [問題文]
A) [選択肢A]
B) [選択肢B]
C) [選択肢C]
D) [選択肢D]
正解: [正解の選択肢]
理由: [正解の理由]

問題2: [問題文]
...
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは医学教育の専門家です。医学の問題を作成する際は、正確性と教育効果を重視してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('問題の生成に失敗しました');
  }
}

export async function createClozeFromText(text: string) {
  const prompt = `
以下の医学テキストから穴埋め問題を作成してください：

テキスト:
${text}

以下のルールに従って穴埋め問題を作成してください：
1. 重要な医学用語や概念を[[blank]]で囲む
2. 文脈から推測できる程度の難易度にする
3. 5-10個程度の穴埋めを作成
4. 元のテキストの流れを保つ

出力形式：
[[blank]]は[[穴埋めの語句]]で置き換えてください。

例：
[[心臓]]は[[血液]]を全身に送り出す[[ポンプ]]の役割を果たします。
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "あなたは医学教育の専門家です。テキストから効果的な穴埋め問題を作成してください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('穴埋め問題の作成に失敗しました');
  }
}
