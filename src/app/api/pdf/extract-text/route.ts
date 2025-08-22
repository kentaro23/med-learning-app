import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📄 PDF text extraction started');
    
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;

    console.log('📋 Form data received:', {
      hasPdfFile: !!pdfFile,
      fileType: pdfFile?.type,
      fileSize: pdfFile?.size,
      fileName: pdfFile?.name
    });

    if (!pdfFile) {
      console.log('❌ No PDF file provided');
      return NextResponse.json(
        { error: 'PDFファイルが提供されていません' },
        { status: 400 }
      );
    }

    if (pdfFile.type !== 'application/pdf') {
      console.log('❌ Invalid file type:', pdfFile.type);
      return NextResponse.json(
        { error: 'PDFファイルのみ対応しています' },
        { status: 400 }
      );
    }

    if (pdfFile.size > 10 * 1024 * 1024) { // 10MB制限
      console.log('❌ File too large:', pdfFile.size);
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 400 }
      );
    }

    console.log('✅ File validation passed, but PDF processing is temporarily disabled');
    
    // 一時的にPDF処理を無効化（ビルドエラー回避のため）
    return NextResponse.json({
      error: 'PDF処理機能は現在メンテナンス中です。後日復旧予定です。',
      text: '',
      pageCount: 0,
      info: {},
    }, { status: 503 });

  } catch (error) {
    console.error('❌ PDF text extraction error:', error);
    
    return NextResponse.json(
      { error: `PDF処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
}
