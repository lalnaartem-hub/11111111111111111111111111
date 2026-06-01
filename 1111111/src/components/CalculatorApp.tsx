import { useState } from 'react';

export function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);

  const input = (v: string) => {
    setDisplay((d) => (d === '0' && v !== '.' ? v : d + v));
  };

  const compute = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
      case '%':
        return a % b;
      case '^':
        return a ** b;
      default:
        return b;
    }
  };

  const onOp = (operator: string) => {
    const val = parseFloat(display);
    if (prev !== null && op) {
      const result = compute(prev, val, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(val);
    }
    setOp(operator);
    setDisplay('0');
  };

  const equals = () => {
    if (prev === null || !op) return;
    const val = parseFloat(display);
    const result = compute(prev, val, op);
    setDisplay(String(result));
    setPrev(null);
    setOp(null);
  };

  const sqrt = () => setDisplay(String(Math.sqrt(parseFloat(display) || 0)));

  const buttons = [
    ['C', '√', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', '='],
  ];

  return (
    <div className="calculator-app p-3 h-full flex flex-col bg-macos-gray-50">
      <div className="calc-display text-right text-2xl font-mono mb-3 px-2 py-3 bg-white rounded-lg border border-window-border truncate">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {buttons.flat().map((b, i) => (
          <button
            key={`${b}-${i}`}
            type="button"
            className={`calc-btn rounded-lg py-3 text-sm font-medium ${
              '+-*/%'.includes(b)
                ? 'bg-macos-blue text-white border-transparent'
                : 'bg-white border border-window-border hover:bg-macos-gray-100'
            } ${b === '0' && i === 12 ? 'col-span-2' : ''}`}
            onClick={() => {
              if (b === 'C') {
                setDisplay('0');
                setPrev(null);
                setOp(null);
              } else if (b === '√') sqrt();
              else if (b === '=') equals();
              else if ('+-*/%^'.includes(b)) onOp(b);
              else input(b);
            }}
          >
            {b}
          </button>
        ))}
      </div>
    </div>
  );
}
