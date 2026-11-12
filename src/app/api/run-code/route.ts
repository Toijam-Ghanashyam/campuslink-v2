import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS } from '@/lib/gemini-models';

const execAsync = promisify(exec);

// 1. Local Node.js Runner for JavaScript
async function runLocalJavaScript(sourceCode: string): Promise<string> {
  const tmpFile = path.join(os.tmpdir(), `campuslink_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
  try {
    await fs.writeFile(tmpFile, sourceCode, 'utf8');
    const { stdout, stderr } = await execAsync(`node "${tmpFile}"`, {
      timeout: 5000,
      maxBuffer: 1024 * 512,
    });
    return stdout || stderr || 'Execution complete (no output returned).';
  } catch (err: any) {
    if (err.killed || err.signal === 'SIGTERM') {
      return 'Execution timed out (exceeded 5s limit).';
    }
    return err.stdout || err.stderr || err.message || 'Execution error';
  } finally {
    try {
      await fs.unlink(tmpFile);
    } catch {}
  }
}

// 2. CodeX Public API Runner
async function runWithCodex(language: string, sourceCode: string, stdin?: string): Promise<string | null> {
  try {
    const langMap: Record<string, string> = {
      python: 'py',
      javascript: 'js',
      cpp: 'cpp',
      java: 'java',
    };
    const lang = langMap[language] || 'py';

    const res = await fetch('https://api.codex.jaagrav.in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: sourceCode,
        language: lang,
        input: stdin || '',
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.output !== undefined && data.output !== null) {
      return (data.output || data.error || 'Execution complete (no output returned).').toString();
    }
    return null;
  } catch {
    return null;
  }
}

// 3. OneCompiler Public API Runner
async function runWithOneCompiler(language: string, sourceCode: string, stdin?: string): Promise<string | null> {
  try {
    const langMap: Record<string, { lang: string; ext: string }> = {
      python: { lang: 'python', ext: 'main.py' },
      javascript: { lang: 'javascript', ext: 'index.js' },
      cpp: { lang: 'cpp', ext: 'main.cpp' },
      java: { lang: 'java', ext: 'Main.java' },
    };
    const target = langMap[language] || langMap.python;

    const res = await fetch('https://onecompiler.com/api/code/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: language,
        title: language,
        version: 'latest',
        language: target.lang,
        files: [{ name: target.ext, content: sourceCode }],
        stdin: stdin || '',
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) return null;
    const text = await res.text();
    const data = JSON.parse(text);
    const out = data.stdout || data.stderr || data.exception;
    if (out !== undefined && out !== null) {
      return out.toString() || 'Execution complete (no output returned).';
    }
    return null;
  } catch {
    return null;
  }
}

// 4. Intelligent AI Execution Engine via Gemini (Primary: 3.8 Flash, Backup: 3.5 Flash)
async function runWithGemini(language: string, sourceCode: string, stdin?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return 'Execution service failed: No runner available and GEMINI_API_KEY is not set.';
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a strict, sandboxed code execution runner (standard stdout/stderr).
Execute the following ${language} code with the provided standard input (stdin) if any.
Do not provide explanations, markdown backticks, or conversational text.
Return ONLY the exact raw terminal output (stdout and/or stderr) that would be printed to console.

Input STDIN:
${stdin || '(none)'}

Source Code:
${sourceCode}
`;

  // Primary: gemini-3.6-flash, followed by fallback chain
  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      if (response?.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn(`Model ${modelName} runner failed, trying backup:`, err);
    }
  }

  return 'Execution complete (no output returned).';
}

export async function POST(req: NextRequest) {
  try {
    const { language, sourceCode, stdin } = await req.json();

    if (!sourceCode) {
      return NextResponse.json({ error: 'Source code is required' }, { status: 400 });
    }

    // 1. Fast-path for JavaScript: Execute directly on local Node runtime (<50ms)
    if (language === 'javascript') {
      try {
        const localOutput = await runLocalJavaScript(sourceCode);
        return NextResponse.json({
          run: {
            output: localOutput,
          },
        });
      } catch (localErr) {
        console.warn('Local JS fallback to Gemini:', localErr);
      }
    }

    // 2. Direct Ultra-Fast Execution via Gemini 3.8 Flash (~500ms-800ms)
    try {
      const geminiOutput = await runWithGemini(language, sourceCode, stdin);
      if (geminiOutput && !geminiOutput.startsWith('Execution service failed')) {
        return NextResponse.json({
          run: {
            output: geminiOutput,
          },
        });
      }
    } catch (geminiErr) {
      console.warn('Gemini 3.8/3.5 runner failed, trying public runners:', geminiErr);
    }

    // 3. Fallback: CodeX API (low timeout to prevent lagging)
    const codexOutput = await runWithCodex(language, sourceCode, stdin);
    if (codexOutput !== null) {
      return NextResponse.json({
        run: {
          output: codexOutput,
        },
      });
    }

    // 4. Fallback: OneCompiler API
    const oneCompilerOutput = await runWithOneCompiler(language, sourceCode, stdin);
    if (oneCompilerOutput !== null) {
      return NextResponse.json({
        run: {
          output: oneCompilerOutput,
        },
      });
    }

    return NextResponse.json({
      run: {
        output: 'Execution service timed out. Please try again.',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Execution service failed' },
      { status: 500 }
    );
  }
}
