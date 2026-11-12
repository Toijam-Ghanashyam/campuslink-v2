import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 1. Local Node.js Runner for JavaScript
async function runLocalJavaScript(sourceCode: string, stdin?: string): Promise<string> {
  const tmpFile = path.join(os.tmpdir(), `campuslink_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
  try {
    await fs.writeFile(tmpFile, sourceCode, 'utf8');
    const { stdout, stderr } = await execAsync(`node "${tmpFile}"`, {
      timeout: 6000,
      maxBuffer: 1024 * 512,
    });
    return stdout || stderr || 'Execution complete (no output returned).';
  } catch (err: any) {
    if (err.killed || err.signal === 'SIGTERM') {
      return 'Execution timed out (exceeded 6s limit).';
    }
    return err.stdout || err.stderr || err.message || 'Execution error';
  } finally {
    try {
      await fs.unlink(tmpFile);
    } catch {}
  }
}

// 2. Wandbox Public Compiler API (100% Free, Zero Quota, No API Key)
async function runWithWandbox(language: string, sourceCode: string, stdin?: string): Promise<string | null> {
  try {
    let compiler = 'gcc-head';
    if (language === 'python') {
      compiler = 'cpython-3.12.7';
    } else if (language === 'javascript') {
      compiler = 'nodejs-head';
    } else if (language === 'java') {
      compiler = 'openjdk-jdk-21+35';
    }

    const payload: Record<string, any> = {
      compiler,
      code: sourceCode,
      stdin: stdin || '',
    };

    if (language === 'cpp') {
      payload.options = 'c++20,warning,optimize';
    }

    const res = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const output = data.program_output || data.program_error || data.compiler_error || data.signal;
    return output ? output.toString() : 'Execution complete (no output returned).';
  } catch (err) {
    console.warn('[RunCode] Wandbox runner failed or timed out:', err);
    return null;
  }
}

// 3. OneCompiler Public API Backup
async function runWithOneCompiler(language: string, sourceCode: string, stdin?: string): Promise<string | null> {
  try {
    const langMap: Record<string, { lang: string; ext: string }> = {
      python: { lang: 'python', ext: 'main.py' },
      javascript: { lang: 'javascript', ext: 'index.js' },
      cpp: { lang: 'cpp', ext: 'main.cpp' },
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
      signal: AbortSignal.timeout(5000),
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

// 4. Automated Deterministic LeetCode Test Case Evaluator
async function evaluateTestCases(
  language: string,
  sourceCode: string,
  functionName: string,
  testCases: Array<{ inputDisplay: string; args: any[]; expected: any }>
) {
  if (language === 'javascript') {
    const harness = `
${sourceCode}

(function runSuite() {
  const tcs = ${JSON.stringify(testCases)};
  const results = [];
  
  for (let i = 0; i < tcs.length; i++) {
    const tc = tcs[i];
    const t0 = Date.now();
    try {
      let fn = typeof ${functionName} === 'function' ? ${functionName} : null;
      if (!fn && typeof Solution === 'function') {
        const s = new Solution();
        if (typeof s.${functionName} === 'function') fn = s.${functionName}.bind(s);
      }
      if (!fn) throw new Error("Could not find function '${functionName}' in code.");
      
      const actual = fn(...tc.args);
      const passed = JSON.stringify(actual) === JSON.stringify(tc.expected) || actual === tc.expected;
      results.push({
        testIndex: i + 1,
        passed,
        input: tc.inputDisplay,
        expected: tc.expected,
        actual,
        runtimeMs: Math.max(1, Date.now() - t0)
      });
    } catch (err) {
      results.push({
        testIndex: i + 1,
        passed: false,
        input: tc.inputDisplay,
        expected: tc.expected,
        error: err.message,
        runtimeMs: Math.max(1, Date.now() - t0)
      });
    }
  }
  console.log("CAMPUSLINK_TEST_RESULTS:" + JSON.stringify(results));
})();
`;
    const out = await runLocalJavaScript(harness);
    if (out.includes('CAMPUSLINK_TEST_RESULTS:')) {
      const jsonStr = out.split('CAMPUSLINK_TEST_RESULTS:')[1].trim();
      return JSON.parse(jsonStr);
    }
  } else if (language === 'python') {
    const harness = `
${sourceCode}

import json, time

tcs = ${JSON.stringify(testCases)}
results = []
sol = Solution() if 'Solution' in globals() else None

for i, tc in enumerate(tcs):
    t0 = time.time()
    try:
        fn = getattr(sol, '${functionName}', None) or globals().get('${functionName}')
        if not fn:
            raise Exception("Could not find function '${functionName}'")
        actual = fn(*tc['args'])
        passed = (actual == tc['expected']) or (json.dumps(actual) == json.dumps(tc['expected']))
        results.append({
            'testIndex': i + 1,
            'passed': bool(passed),
            'input': tc['inputDisplay'],
            'expected': tc['expected'],
            'actual': actual,
            'runtimeMs': max(1, int((time.time() - t0) * 1000))
        })
    except Exception as e:
        results.append({
            'testIndex': i + 1,
            'passed': False,
            'input': tc['inputDisplay'],
            'expected': tc['expected'],
            'error': str(e),
            'runtimeMs': max(1, int((time.time() - t0) * 1000))
        })

print("CAMPUSLINK_TEST_RESULTS:" + json.dumps(results))
`;
    const out = await runWithWandbox('python', harness);
    if (out && out.includes('CAMPUSLINK_TEST_RESULTS:')) {
      const jsonStr = out.split('CAMPUSLINK_TEST_RESULTS:')[1].trim();
      return JSON.parse(jsonStr);
    }
  } else if (language === 'java') {
    function toJavaLiteral(val: any): string {
      if (val === null || val === undefined) return 'null';
      if (typeof val === 'string') return JSON.stringify(val);
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'boolean') return val.toString();
      if (Array.isArray(val)) {
        if (val.length === 0) return 'new int[]{}';
        if (typeof val[0] === 'number') {
          return `new int[]{${val.join(', ')}}`;
        }
        if (typeof val[0] === 'string' && val[0].length === 1) {
          return `new char[]{${val.map((c) => `'${c}'`).join(', ')}}`;
        }
        if (Array.isArray(val[0])) {
          if (typeof val[0][0] === 'string' && val[0][0].length === 1) {
            return `new char[][]{${val.map((row) => `{${row.map((c: string) => `'${c}'`).join(', ')}}`).join(', ')}}`;
          }
          return `new int[][]{${val.map((row) => `{${row.join(', ')}}`).join(', ')}}`;
        }
        return `Arrays.asList(${val.map(toJavaLiteral).join(', ')})`;
      }
      return String(val);
    }

    const casesCode = testCases
      .map((tc, idx) => {
        const callArgs = tc.args.map(toJavaLiteral).join(', ');
        const expLit = toJavaLiteral(tc.expected);
        return `
        {
          long t0 = System.currentTimeMillis();
          try {
            var act = sol.${functionName}(${callArgs});
            long t1 = System.currentTimeMillis();
            boolean passed = checkEq(act, ${expLit});
            outList.add(formatCase(${idx + 1}, passed, ${JSON.stringify(tc.inputDisplay)}, ${JSON.stringify(JSON.stringify(tc.expected))}, strVal(act), Math.max(1, t1 - t0)));
          } catch (Exception e) {
            outList.add(formatError(${idx + 1}, ${JSON.stringify(tc.inputDisplay)}, ${JSON.stringify(JSON.stringify(tc.expected))}, e.getMessage()));
          }
        }
        `;
      })
      .join('\n');

    const harness = `
${sourceCode}

class Main {
    static boolean checkEq(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof int[] && b instanceof int[]) return Arrays.equals((int[]) a, (int[]) b);
        if (a instanceof char[] && b instanceof char[]) return Arrays.equals((char[]) a, (char[]) b);
        if (a.getClass().isArray() && b.getClass().isArray()) return Arrays.deepEquals((Object[]) a, (Object[]) b);
        return a.equals(b);
    }

    static String strVal(Object a) {
        if (a == null) return "null";
        if (a instanceof int[]) return Arrays.toString((int[]) a);
        if (a instanceof char[]) return new String((char[]) a);
        if (a.getClass().isArray()) return Arrays.deepToString((Object[]) a);
        return a.toString();
    }

    static String formatCase(int idx, boolean passed, String in, String exp, String act, long ms) {
        return "{\\"testIndex\\":" + idx + ",\\"passed\\":" + passed + ",\\"input\\":\\"" + in + "\\",\\"expected\\":" + exp + ",\\"actual\\":\\"" + act + "\\",\\"runtimeMs\\":" + ms + "}";
    }

    static String formatError(int idx, String in, String exp, String err) {
        return "{\\"testIndex\\":" + idx + ",\\"passed\\":false,\\"input\\":\\"" + in + "\\",\\"expected\\":" + exp + ",\\"error\\":\\"" + (err == null ? "Runtime Error" : err.replace("\\\"", "\\\\'")) + "\\",\\"runtimeMs\\":1}";
    }

    public static void main(String[] args) {
        Solution sol = new Solution();
        List<String> outList = new ArrayList<>();
        ${casesCode}
        System.out.println("CAMPUSLINK_TEST_RESULTS:[" + String.join(",", outList) + "]");
    }
}
    `;

    const out = await runWithWandbox('java', harness);
    if (out && out.includes('CAMPUSLINK_TEST_RESULTS:')) {
      const jsonStr = out.split('CAMPUSLINK_TEST_RESULTS:')[1].trim();
      return JSON.parse(jsonStr);
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { language, sourceCode, stdin, testCases, functionName } = await req.json();

    if (!sourceCode) {
      return NextResponse.json({ error: 'Source code is required' }, { status: 400 });
    }

    // 1. If LeetCode Test Cases are passed, execute deterministic grading suite
    if (testCases && Array.isArray(testCases) && testCases.length > 0 && functionName) {
      const testResults = await evaluateTestCases(language, sourceCode, functionName, testCases);
      if (testResults) {
        const passedCount = testResults.filter((r: any) => r.passed).length;
        const allPassed = passedCount === testResults.length;
        const totalRuntime = testResults.reduce((acc: number, r: any) => acc + (r.runtimeMs || 1), 0);

        return NextResponse.json({
          run: {
            output: allPassed
              ? `✅ Accepted\nPassed: ${passedCount}/${testResults.length} test cases\nTotal Runtime: ${totalRuntime}ms`
              : `❌ Wrong Answer\nPassed: ${passedCount}/${testResults.length} test cases`,
            testResults,
            allPassed,
            passedCount,
            totalCount: testResults.length,
          },
        });
      }
    }

    // 2. Direct Raw Code Execution (Standard Run)
    let processedSource = sourceCode;
    if (language === 'java' && !sourceCode.includes('main(') && !sourceCode.includes('main (')) {
      processedSource += '\nclass Main { public static void main(String[] args) { System.out.println("Java code compiled successfully with zero syntax errors. Click \\"Run LeetCode Tests\\" to test your solution."); } }';
    }

    // Fast path: JavaScript on local node runtime (<30ms)
    if (language === 'javascript') {
      const localOut = await runLocalJavaScript(sourceCode, stdin);
      return NextResponse.json({ run: { output: localOut } });
    }

    // Free zero-cost compiler: Wandbox (Java, C++, Python)
    const wandboxOut = await runWithWandbox(language, processedSource, stdin);
    if (wandboxOut !== null) {
      return NextResponse.json({ run: { output: wandboxOut } });
    }

    // Backup: OneCompiler
    const oneCompilerOut = await runWithOneCompiler(language, processedSource, stdin);
    if (oneCompilerOut !== null) {
      return NextResponse.json({ run: { output: oneCompilerOut } });
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
