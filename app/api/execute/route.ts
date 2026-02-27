import { NextRequest, NextResponse } from "next/server";

// Self-hosted Piston: no /piston/ in path. Use full URL in env.
const PISTON_API_URL_DEFAULT = "http://localhost:2000/api/v2/execute";

/** Editor language id → Piston language, version, and file extension for execute payload */
const LANGUAGE_MAP: Record<
  string,
  { language: string; version: string; filename: string }
> = {
  python: { language: "python", version: "3.12.0", filename: "main.py" },
  cpp: { language: "c++", version: "10.2.0", filename: "main.cpp" },
  java: { language: "java", version: "15.0.2", filename: "Main.java" },
  sql: { language: "sqlite3", version: "3.36.0", filename: "query.sql" },
};

const RUN_TIMEOUT_MS = 3000; // Server limit; do not exceed
const COMPILE_TIMEOUT_MS = 10000;

export async function POST(req: NextRequest) {
  try {
    const { language, code } = await req.json();

    if (!language || !code) {
      return NextResponse.json(
        { error: "Language and code are required." },
        { status: 400 },
      );
    }

    const runtime = LANGUAGE_MAP[language];

    if (!runtime) {
      return NextResponse.json(
        { error: `Language '${language}' is not supported for execution.` },
        { status: 400 },
      );
    }

    const pistonUrl = process.env.PISTON_API_URL ?? PISTON_API_URL_DEFAULT;

    const response = await fetch(pistonUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: runtime.filename, content: code }],
        run_timeout: RUN_TIMEOUT_MS,
        compile_timeout: COMPILE_TIMEOUT_MS,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Execution service failed. Please try again.";
      try {
        const errBody = await response.json();
        if (errBody?.message) errorMessage = errBody.message;
      } catch {
        // use default errorMessage
      }
      console.error("[Piston API] Error:", response.status, errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 502 });
    }

    const data = (await response.json()) as {
      run: {
        stdout?: string;
        stderr?: string;
        code?: number | null;
        signal?: string | null;
      };
      compile?: {
        stdout?: string;
        stderr?: string;
        code?: number | null;
        signal?: string | null;
      };
    };

    const run = data.run ?? {};
    const compile = data.compile;

    let stderr = run.stderr ?? "";
    if (compile?.stderr?.trim()) {
      stderr = compile.stderr.trim() + (stderr ? "\n" + stderr : "");
    }

    const result = {
      stdout: run.stdout ?? "",
      stderr,
      code: run.code ?? compile?.code ?? null,
      signal: run.signal ?? null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/execute] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
