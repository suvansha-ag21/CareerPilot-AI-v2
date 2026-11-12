"use client";

import React, { useState } from "react";
import { Code2, Database, Play, RotateCcw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export type SandboxLanguage = "javascript" | "sql" | "python" | "java";

const STARTER_SNIPPETS: Record<SandboxLanguage, string> = {
  javascript: `// Write your solution here and click Run Code to verify output
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log("Test 1:", JSON.stringify(twoSum([2, 7, 11, 15], 9)));
console.log("Test 2:", JSON.stringify(twoSum([3, 2, 4], 6)));`,
  sql: `-- Available tables: employees(id, name, department_id, salary),
-- departments(id, name), orders(id, customer, amount, status)
SELECT d.name AS department, COUNT(e.id) AS headcount, AVG(e.salary) AS avg_salary
FROM employees e
JOIN departments d ON e.department_id = d.id
GROUP BY d.name
ORDER BY avg_salary DESC;`,
  python: `# Write your Python implementation & time/space complexity
def solve(nums, target):
    seen = {}
    for i, val in enumerate(nums):
        if target - val in seen:
            return [seen[target - val], i]
        seen[val] = i
    return []`,
  java: `// Write your Java solution cleanly
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int rem = target - nums[i];
            if (map.containsKey(rem)) return new int[]{map.get(rem), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
};

type RowObj = Record<string, string | number>;

const SAMPLE_SQL_TABLES: Record<string, RowObj[]> = {
  employees: [
    { id: 1, name: "Ananya", department_id: 10, salary: 120000 },
    { id: 2, name: "Vikram", department_id: 10, salary: 135000 },
    { id: 3, name: "Meera", department_id: 20, salary: 110000 },
    { id: 4, name: "Kabir", department_id: 30, salary: 98000 },
    { id: 5, name: "Riya", department_id: 20, salary: 128000 },
  ],
  departments: [
    { id: 10, name: "Platform Engineering" },
    { id: 20, name: "AI Research" },
    { id: 30, name: "Product" },
  ],
  orders: [
    { id: 101, customer: "Acme", amount: 450, status: "PAID" },
    { id: 102, customer: "Nova", amount: 890, status: "PAID" },
    { id: 103, customer: "Acme", amount: 310, status: "PENDING" },
  ],
};

function runInBrowserSql(rawSql: string): { columns: string[]; rows: RowObj[]; summary: string } {
  const clean = rawSql
    .split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join(" ")
    .replace(/;+\s*$/, "")
    .trim();

  if (!/^select\s+/i.test(clean)) {
    throw new Error("Sandbox SQL engine supports read-only SELECT queries.");
  }

  const fromMatch = clean.match(/\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?/i);
  if (!fromMatch) {
    throw new Error("Missing FROM <table> clause.");
  }

  const mainTableName = fromMatch[1].toLowerCase();
  const mainAlias = (fromMatch[2] || mainTableName).toLowerCase();
  const baseRows = SAMPLE_SQL_TABLES[mainTableName];
  if (!baseRows) {
    throw new Error(
      `Unknown table '${mainTableName}'. Available: ${Object.keys(SAMPLE_SQL_TABLES).join(", ")}`
    );
  }

  // Prefix columns with alias & support single INNER/LEFT JOIN cleanly
  let working: RowObj[] = baseRows.map((row) => {
    const out: RowObj = {};
    for (const [k, v] of Object.entries(row)) {
      out[k] = v;
      out[`${mainAlias}.${k}`] = v;
    }
    return out;
  });

  const joinMatch = clean.match(
    /\bjoin\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(?:as\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?\s+on\s+([a-zA-Z0-9_.]+)\s*=\s*([a-zA-Z0-9_.]+)/i
  );
  if (joinMatch) {
    const joinTableName = joinMatch[1].toLowerCase();
    const joinAlias = (joinMatch[2] || joinTableName).toLowerCase();
    const joinRows = SAMPLE_SQL_TABLES[joinTableName];
    if (!joinRows) {
      throw new Error(`Unknown joined table '${joinTableName}'.`);
    }
    const leftKey = joinMatch[3].toLowerCase();
    const rightKey = joinMatch[4].toLowerCase();

    const joined: RowObj[] = [];
    for (const leftRow of working) {
      for (const jr of joinRows) {
        const candidate: RowObj = { ...leftRow };
        for (const [k, v] of Object.entries(jr)) {
          if (candidate[k] === undefined) candidate[k] = v;
          candidate[`${joinAlias}.${k}`] = v;
        }
        if (candidate[leftKey] === candidate[rightKey]) {
          joined.push(candidate);
        }
      }
    }
    working = joined;
  }

  const whereMatch = clean.match(/\bwhere\s+(.+?)(?=\bgroup\s+by|\border\s+by|\blimit|$)/i);
  if (whereMatch) {
    const cond = whereMatch[1].trim();
    const cmp = cond.match(/^([a-zA-Z0-9_.]+)\s*(=|!=|<>|>=|<=|>|<)\s*('[^']*'|\d+(?:\.\d+)?)$/i);
    if (cmp) {
      const col = cmp[1].toLowerCase();
      const op = cmp[2];
      const rawVal = cmp[3];
      const targetVal: string | number = rawVal.startsWith("'")
        ? rawVal.slice(1, -1)
        : Number(rawVal);
      working = working.filter((r) => {
        const lv = r[col] ?? r[col.split(".").pop() || col];
        if (op === "=") return String(lv) === String(targetVal);
        if (op === "!=" || op === "<>") return String(lv) !== String(targetVal);
        const nl = Number(lv);
        const nr = Number(targetVal);
        if (op === ">") return nl > nr;
        if (op === "<") return nl < nr;
        if (op === ">=") return nl >= nr;
        if (op === "<=") return nl <= nr;
        return true;
      });
    }
  }

  const selectMatch = clean.match(/^select\s+(.+?)\s+from\b/i);
  const selectExprs = (selectMatch?.[1] || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const groupMatch = clean.match(/\bgroup\s+by\s+([a-zA-Z0-9_.,\s]+?)(?=\border\s+by|\blimit|$)/i);
  const groupCols = groupMatch
    ? groupMatch[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : [];

  let resultRows: RowObj[] = [];

  if (groupCols.length > 0 || selectExprs.some((e) => /\b(count|sum|avg|min|max)\(/i.test(e))) {
    const groups = new Map<string, RowObj[]>();
    for (const r of working) {
      const key = groupCols.map((gc) => String(r[gc] ?? "")).join("||");
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }

    for (const groupRows of Array.from(groups.values())) {
      const outRow: RowObj = {};
      for (const expr of selectExprs) {
        const aliasParts = expr.split(/\s+as\s+/i);
        const rawExpr = aliasParts[0].trim();
        const colName = (aliasParts[1] || rawExpr).trim();
        const agg = rawExpr.match(/^(count|sum|avg|min|max)\(\s*([a-zA-Z0-9_.*]+)\s*\)$/i);
        if (agg) {
          const fn = agg[1].toLowerCase();
          const field = agg[2].toLowerCase();
          if (fn === "count") {
            outRow[colName] = groupRows.length;
          } else {
            const nums = groupRows
              .map((gr: RowObj) => Number(gr[field] ?? gr[field.split(".").pop() || field]))
              .filter((n: number) => Number.isFinite(n));
            if (fn === "sum") outRow[colName] = nums.reduce((a: number, b: number) => a + b, 0);
            if (fn === "avg")
              outRow[colName] = nums.length
                ? Math.round((nums.reduce((a: number, b: number) => a + b, 0) / nums.length) * 100) /
                  100
                : 0;
            if (fn === "min") outRow[colName] = nums.length ? Math.min(...nums) : 0;
            if (fn === "max") outRow[colName] = nums.length ? Math.max(...nums) : 0;
          }
        } else {
          const k = rawExpr.toLowerCase();
          outRow[colName] = groupRows[0]?.[k] ?? groupRows[0]?.[k.split(".").pop() || k] ?? "";
        }
      }
      resultRows.push(outRow);
    }
  } else {
    resultRows = working.map((r) => {
      if (selectExprs.length === 1 && selectExprs[0] === "*") {
        const plain: RowObj = {};
        for (const [k, v] of Object.entries(r)) {
          if (!k.includes(".")) plain[k] = v;
        }
        return plain;
      }
      const outRow: RowObj = {};
      for (const expr of selectExprs) {
        const aliasParts = expr.split(/\s+as\s+/i);
        const rawExpr = aliasParts[0].trim().toLowerCase();
        const colName = (aliasParts[1] || aliasParts[0]).trim();
        outRow[colName] = r[rawExpr] ?? r[rawExpr.split(".").pop() || rawExpr] ?? "";
      }
      return outRow;
    });
  }

  const orderMatch = clean.match(/\border\s+by\s+([a-zA-Z0-9_.]+)(?:\s+(asc|desc))?/i);
  if (orderMatch) {
    const orderCol = orderMatch[1].trim();
    const desc = (orderMatch[2] || "ASC").toUpperCase() === "DESC";
    resultRows.sort((a, b) => {
      const av = a[orderCol] ?? a[orderCol.toLowerCase()] ?? "";
      const bv = b[orderCol] ?? b[orderCol.toLowerCase()] ?? "";
      if (typeof av === "number" && typeof bv === "number") {
        return desc ? bv - av : av - bv;
      }
      return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }

  const limitMatch = clean.match(/\blimit\s+(\d+)/i);
  if (limitMatch) {
    resultRows = resultRows.slice(0, Number(limitMatch[1]));
  }

  const columns = resultRows[0] ? Object.keys(resultRows[0]) : [];
  return {
    columns,
    rows: resultRows,
    summary: `Returned ${resultRows.length} row(s): ${JSON.stringify(resultRows.slice(0, 6))}`,
  };
}

export function CodeSqlSandbox({
  language,
  code,
  onChange,
}: {
  language: SandboxLanguage;
  code: string;
  onChange: (next: { language: SandboxLanguage; code: string; output?: string }) => void;
}) {
  const [running, setRunning] = useState(false);
  const [consoleOut, setConsoleOut] = useState<string>("");
  const [sqlTable, setSqlTable] = useState<{ columns: string[]; rows: RowObj[] } | null>(null);

  function handleLanguageSwitch(nextLang: SandboxLanguage) {
    setConsoleOut("");
    setSqlTable(null);
    onChange({
      language: nextLang,
      code: STARTER_SNIPPETS[nextLang],
      output: undefined,
    });
  }

  async function handleRun() {
    setRunning(true);
    setConsoleOut("");
    setSqlTable(null);

    try {
      if (language === "javascript") {
        const workerSrc = `
          self.onmessage = function(e) {
            const logs = [];
            const origLog = console.log;
            console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
            try {
              const fn = new Function(e.data);
              const ret = fn();
              if (ret !== undefined) logs.push('Return: ' + (typeof ret === 'object' ? JSON.stringify(ret) : String(ret)));
              self.postMessage({ ok: true, output: logs.join('\\n') || '(No output)' });
            } catch (err) {
              self.postMessage({ ok: false, output: 'Runtime Error: ' + (err && err.message ? err.message : String(err)) });
            } finally {
              console.log = origLog;
            }
          };
        `;
        const blob = new Blob([workerSrc], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        const out = await new Promise<string>((resolve) => {
          const worker = new Worker(workerUrl);
          const timer = setTimeout(() => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve("Execution timed out after 2000ms.");
          }, 2000);
          worker.onmessage = (ev) => {
            clearTimeout(timer);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            resolve(String(ev.data?.output || ""));
          };
          worker.postMessage(code);
        });
        setConsoleOut(out);
        onChange({ language, code, output: out });
      } else if (language === "sql") {
        const res = runInBrowserSql(code);
        setSqlTable({ columns: res.columns, rows: res.rows });
        setConsoleOut(res.summary);
        onChange({ language, code, output: res.summary });
      } else {
        const msg = `${language.toUpperCase()} syntax attached for AI evaluation (in-browser execution runs JavaScript & SQL directly).`;
        setConsoleOut(msg);
        onChange({ language, code, output: msg });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution error";
      setConsoleOut(msg);
      onChange({ language, code, output: msg });
    } finally {
      setRunning(false);
    }
  }

  const currentCode = code || STARTER_SNIPPETS[language];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0F172A] text-slate-100 overflow-hidden">
      <div className="px-4 py-2.5 bg-[#111827] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            {language === "sql" ? (
              <Database className="h-4 w-4 text-[#8B7CFF]" />
            ) : (
              <Code2 className="h-4 w-4 text-[#8B7CFF]" />
            )}
            <span className="text-xs font-semibold text-white">Live Code &amp; SQL Sandbox</span>
            <Badge tone="brand">Included in AI Feedback</Badge>
          </div>
          <p className="text-[11px] text-slate-400">
            Switch between SQL or JavaScript and click Run to see live output right below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Sandbox language"
            value={language}
            onChange={(e) => handleLanguageSwitch(e.target.value as SandboxLanguage)}
            className="h-8 px-2.5 rounded-md bg-slate-800 border border-slate-700 text-xs text-white"
          >
            <option value="javascript">JavaScript (Runnable)</option>
            <option value="sql">SQL (Runnable)</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          <button
            type="button"
            onClick={() =>
              onChange({ language, code: STARTER_SNIPPETS[language], output: undefined })
            }
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            title="Reset starter snippet"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <Button type="button" size="sm" variant="primary" onClick={() => void handleRun()} loading={running}>
            <Play className="h-3 w-3" />
            Run
          </Button>
        </div>
      </div>

      <textarea
        value={currentCode}
        onChange={(e) => onChange({ language, code: e.target.value })}
        rows={10}
        spellCheck={false}
        className="w-full p-4 bg-[#0B1120] text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-y"
      />

      {(consoleOut || sqlTable) && (
        <div className="border-t border-slate-800 bg-[#080D1A] p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Terminal className="h-3.5 w-3.5 text-[#8B7CFF]" />
            Sandbox Output
          </div>

          {sqlTable && sqlTable.columns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    {sqlTable.columns.map((c) => (
                      <th key={c} className="py-1.5 px-2.5 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                  {sqlTable.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {sqlTable.columns.map((c) => (
                        <td key={c} className="py-1.5 px-2.5">
                          {String(row[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap">{consoleOut}</pre>
          )}
        </div>
      )}
    </div>
  );
}
