import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

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

    console.log('✅ File validation passed, processing PDF...');

    // PDFファイルをバッファに変換
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('📦 Buffer created, size:', buffer.length);

    // PDFからテキストを抽出
    console.log('🔍 Extracting text from PDF...');
    const data = await pdf(buffer);
    const extractedText = data.text;
    
    console.log('📝 Text extraction completed:', {
      textLength: extractedText?.length || 0,
      pageCount: data.numpages,
      hasText: !!extractedText
    });

    if (!extractedText || extractedText.trim().length === 0) {
      console.log('⚠️ No text extracted from PDF');
      return NextResponse.json(
        { error: 'PDFからテキストを抽出できませんでした。スキャン画像のみのPDFの可能性があります。' },
        { status: 400 }
      );
    }

    console.log('✅ PDF processing successful');
    return NextResponse.json({
      text: extractedText,
      pageCount: data.numpages,
      info: data.info,
    });

  } catch (error) {
    console.error('❌ PDF text extraction error:', error);
    
    // エラーの詳細情報をログに出力
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    if (error instanceof Error && error.message.includes('Invalid PDF')) {
      return NextResponse.json(
        { error: '無効なPDFファイルです' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `テキスト抽出に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` },
      { status: 500 }
    );
  }
}
