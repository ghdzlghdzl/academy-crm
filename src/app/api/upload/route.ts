import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    console.log(`[Upload] File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    const groq = new Groq({ apiKey });

    // Convert File to a Groq-compatible file object
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'audio.wav';

    // Create a File-like object for Groq SDK
    const audioFile = new File([buffer], safeName, {
      type: file.type || 'audio/wav',
    });

    console.log('[Upload] Sending to Groq Whisper API...');

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'ko',
      response_format: 'text',
    });

    console.log(`[Upload] Transcription complete. Length: ${String(transcription).length} chars`);

    return NextResponse.json({ transcript: transcription });
  } catch (error: unknown) {
    console.error('[Upload] Error:', error);
    let message = 'STT 처리 중 오류 발생';
    if (error instanceof Error) {
      message = error.message;
    }
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string; error?: { message?: string } };
      message = `Groq API 오류 (${apiError.status}): ${apiError.error?.message || apiError.message || message}`;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
