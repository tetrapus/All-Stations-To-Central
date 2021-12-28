const ops: { [key: string]: (a: number, b: number) => number } = {
  "+": (a, b) => a + b,
  "*": (a, b) => a * b,
  "^": (a, b) => a ** b,
  "/": (a, b) => a / b,
};

const bracket = (a: string) => (a.match(/ /) ? `(${a})` : a);

const modifiers: {
  op: (n: number) => number;
  canApply: (n: number) => boolean;
  formatter: (n: string) => string;
}[] = [
  {
    op: (a) => Math.sqrt(a),
    canApply: (a) => a > 0,
    formatter: (a) => `sqrt(${a})`,
  },
  { op: (a) => -a, canApply: (a) => true, formatter: (a) => `-${bracket(a)}` },
  {
    op: (a) => [...Array(a).keys()].reduce((a, b) => a * (b + 1), 1),
    canApply: (a) => a < 10 && a >= 0 && Number.isInteger(a),
    formatter: (a) => `${bracket(a)}!`,
  },
  {
    op: (a) => a,
    canApply: (a) => true,
    formatter: bracket,
  },
];

type AST = (AST | number)[];

function runPermutations(ast: AST): { value: number; ops: string }[] {
  // Flatten all children in the AST
  const flat: { value: number; ops: string }[][] = ast
    .map((node) =>
      Array.isArray(node)
        ? runPermutations(node)
        : [{ value: node, ops: `${node}` }]
    )
    .map((options) =>
      options
        .map((option) =>
          modifiers
            .filter(({ canApply }) => canApply(option.value))
            .map((mod) => ({
              value: mod.op(option.value),
              ops: mod.formatter(option.ops),
            }))
        )
        .flat(1)
    );
  console.log("flat", flat);

  if (ast.length === 1 && !Array.isArray(ast[0])) {
    return flat[0];
  } else {
    // Flatten the level of the tree into a set of single values
    const result = flat
      .slice(1)
      .reduce(
        (a, b) =>
          Object.entries(ops)
            .map(([symbol, op]) =>
              a.map(({ value: v1, ops: o1 }) =>
                b.map(({ value: v2, ops: o2 }) => ({
                  value: op(v1, v2),
                  ops: `(${o1} ${symbol} ${o2})`,
                }))
              )
            )
            .flat(2),
        flat[0]
      )
      .filter(({ value }) => value === 10);
    console.log("result", result);
    return result;
  }
}

export function traingame([a, b, c, d]: [number, number, number, number]) {
  const asts = [
    [a, b, c, d],
    [[a, b], c, d],
    [a, [b, c], d],
    [a, b, [c, d]],
    [
      [a, b],
      [c, d],
    ],
    [[a, b, c], d],
    [[[a, b], c], d],
    [[a, [b, c]], d],
    [a, [b, c, d]],
    [a, [[b, c], d]],
    [a, [b, [c, d]]],
  ];
  return asts.map((ast) => runPermutations(ast)).flat(1);
}
