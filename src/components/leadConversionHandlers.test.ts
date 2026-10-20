import { readFile } from "node:fs/promises";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { isConfirmedLeadResponse } from "../lib/analytics";

const handlers = [
  {
    file: "./ui/QuickCapture.tsx",
    success: ["setSent(", "markLeadSent(", "onSent?.("],
    error: ["if (!res.ok || !json.ok)", "catch {"],
  },
  {
    file: "./costCalculator/CcScript.tsx",
    success: ["return name.split(/\\s+/)[0]", "function unlock(firstName: string)"],
    error: ["if (!res?.ok)", "c.err.hidden = false"],
  },
  {
    file: "./sections/Callback.tsx",
    success: ['setStatus({ kind: "sent" })'],
    error: ['kind: "error"', "catch {"],
  },
  {
    file: "./accounting/AcQuote.tsx",
    success: ["window.location.assign(THANK_YOU_URL)", 'setPhase({ kind: "sent", firstName })'],
    error: ['setPhase({ kind: "error"', "catch {"],
  },
  {
    file: "./corporateTax/CtScript.tsx",
    success: ["return name.split(/\\s+/)[0]", "reviewDone(firstName)"],
    error: ["if (!res?.ok)", "c.errBox.hidden = false"],
  },
  {
    file: "./spv/SpvConsultForm.tsx",
    success: ["setDone(true)"],
    error: ["if (!res.ok || !json.ok)", "catch {"],
  },
];

function containsIdentifier(node: ts.Node, identifier: string): boolean {
  if (ts.isIdentifier(node) && node.text === identifier) return true;
  return node.getChildren().some((child) => containsIdentifier(child, identifier));
}

function callsIn(node: ts.Node, identifier: string): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];
  const visit = (child: ts.Node) => {
    if (
      ts.isCallExpression(child) &&
      ts.isIdentifier(child.expression) &&
      child.expression.text === identifier
    ) {
      calls.push(child);
    }
    child.forEachChild(visit);
  };
  visit(node);
  return calls;
}

async function loadConversionBranch(file: string): Promise<string> {
  const source = await readFile(new URL(file, import.meta.url), "utf8");
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const conditions: ts.IfStatement[] = [];
  const findConditions = (node: ts.Node) => {
    if (ts.isIfStatement(node) && containsIdentifier(node.expression, "isConfirmedLeadResponse")) {
      conditions.push(node);
    }
    node.forEachChild(findConditions);
  };
  findConditions(parsed);

  expect(conditions, `${file} should have one explicit creation check`).toHaveLength(1);
  const condition = conditions[0];
  const formSubmitCalls = callsIn(parsed, "pushFormSubmit");
  const generateLeadCalls = callsIn(parsed, "pushGenerateLead");
  expect(formSubmitCalls, `${file} should emit one form_submit`).toHaveLength(1);
  expect(generateLeadCalls, `${file} should emit one generate_lead`).toHaveLength(1);

  const inTrueBranch = (call: ts.CallExpression) =>
    call.getStart(parsed) >= condition.thenStatement.getStart(parsed) &&
    call.end <= condition.thenStatement.end;
  const branchCalls = [formSubmitCalls[0], generateLeadCalls[0]];
  const branch = branchCalls.every(inTrueBranch)
    ? condition
    : (() => {
        expect(
          containsIdentifier(condition.expression, "isConfirmedLeadResponse"),
          `${file} creation check should guard both events`,
        ).toBe(true);
        expect(
          condition.thenStatement.getText(parsed),
          `${file} unconfirmed response should return before conversion events`,
        ).toMatch(/\breturn\b/);
        expect(branchCalls.every((call) => call.getStart(parsed) > condition.end)).toBe(true);
        return {
          getStart: () => condition.getStart(parsed),
          end: Math.max(...branchCalls.map((call) => {
            const statement = call.parent;
            return ts.isExpressionStatement(statement) ? statement.end : call.end;
          })),
        };
      })();

  const replacements = branchCalls.map((call) => ({
    start: call.getStart(parsed) - branch.getStart(),
    end: call.end - branch.getStart(),
    text: `events.push("${ts.isIdentifier(call.expression) ? call.expression.text : ""}")`,
  }));
  let executable = source.slice(branch.getStart(), branch.end);
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    executable = executable.slice(0, replacement.start) + replacement.text + executable.slice(replacement.end);
  }
  return ts.transpile(executable, { target: ts.ScriptTarget.ES2020 });
}

describe("lead conversion handlers", () => {
  it.each(handlers)("$file emits only the events allowed by its actual response gate", async ({ file }) => {
    const branch = await loadConversionBranch(file);
    const run = new Function(
      "isConfirmedLeadResponse",
      "json",
      "responseBody",
      "counted",
      "events",
      "name",
      branch,
    ) as (
      predicate: typeof isConfirmedLeadResponse,
      json: unknown,
      responseBody: unknown,
      counted: { current: boolean },
      events: string[],
      name: string,
    ) => void;

    for (const created of [false, true]) {
      const events: string[] = [];
      run(isConfirmedLeadResponse, { created }, { created }, { current: false }, events, "Test Person");
      expect(events).toEqual(created ? ["pushFormSubmit", "pushGenerateLead"] : []);
    }
  });

  it.each(handlers)("$file retains its existing success and error paths", async ({ file, success, error }) => {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    for (const marker of [...success, ...error]) {
      expect(source, `${file} should retain ${marker}`).toContain(marker);
    }
  });
});
