let indent = 0;

export function debugMethods<Key extends string>(
  self: Record<Key, (...args: any[]) => any>,
  methods: Key[],
  label?: string,
) {
  const className = self.constructor.name;
  methods.forEach(method => {
    const original = self[method];

    self[method] = (...args: unknown[]) => {
      const x = '  '.repeat(indent++);
      const y = label ? ` [${label}]` : '';

      console.debug(`${x}🟢 ${className}.${method}${y}`, args[0]);
      const result = original.apply(self, args);
      console.debug(`${x}🔴 ${className}.${method}${y}`);

      indent--;
      return result;
    };
  });
}
