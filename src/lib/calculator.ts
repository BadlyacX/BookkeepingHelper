export type Operator = "+" | "-" | "×" | "÷";

export type CalculatorState = {
  display: string;
  previousValue: number | null;
  operator: Operator | null;
  /** Next digit press should replace `display` instead of appending. */
  overwrite: boolean;
};

export const initialCalculatorState: CalculatorState = {
  display: "0",
  previousValue: null,
  operator: null,
  overwrite: false,
};

const MAX_DIGITS = 9;

function compute(a: number, b: number, op: Operator): number {
  const result =
    op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : b === 0 ? a : a / b;
  // Avoid floating point noise like 0.1 + 0.2 = 0.30000000000000004.
  return Math.round(result * 100) / 100;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

export type CalculatorAction =
  | { type: "digit"; digit: string }
  | { type: "decimal" }
  | { type: "operator"; operator: Operator }
  | { type: "backspace" }
  | { type: "clear" }
  | { type: "set"; value: number };

export function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState {
  switch (action.type) {
    case "digit": {
      const digitsOnly = state.display.replace(/[.-]/g, "");
      if (!state.overwrite && digitsOnly.length >= MAX_DIGITS) return state;

      if (state.overwrite || state.display === "0") {
        return { ...state, display: action.digit, overwrite: false };
      }
      return { ...state, display: state.display + action.digit };
    }

    case "decimal": {
      if (state.overwrite) {
        return { ...state, display: "0.", overwrite: false };
      }
      if (state.display.includes(".")) return state;
      return { ...state, display: state.display + "." };
    }

    case "operator": {
      const current = parseFloat(state.display);
      if (state.previousValue !== null && state.operator && !state.overwrite) {
        const result = compute(state.previousValue, current, state.operator);
        return {
          display: formatNumber(result),
          previousValue: result,
          operator: action.operator,
          overwrite: true,
        };
      }
      return {
        ...state,
        previousValue: current,
        operator: action.operator,
        overwrite: true,
      };
    }

    case "backspace": {
      if (state.overwrite) return state;
      const next = state.display.slice(0, -1);
      return { ...state, display: next === "" || next === "-" ? "0" : next };
    }

    case "clear":
      return initialCalculatorState;

    // Load a preset amount (e.g. when opening an existing transaction
    // to edit). Pressing a digit next starts a fresh number, like
    // recalling a value on a real calculator.
    case "set":
      return {
        display: formatNumber(action.value),
        previousValue: null,
        operator: null,
        overwrite: true,
      };

    default:
      return state;
  }
}

/** The amount to submit: folds in any pending operator/operand. */
export function calculatorValue(state: CalculatorState): number {
  const current = parseFloat(state.display);
  if (state.previousValue !== null && state.operator) {
    return compute(state.previousValue, current, state.operator);
  }
  return current;
}
