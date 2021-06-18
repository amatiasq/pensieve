let indent = 0;

export function debugMethods<Key extends string>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  self: Record<Key, Function>,
  methods: Key[],
  label?: string,
) {
  const className = self.constructor.name;
  methods.forEach(method => {
    const original = self[method];

    self[method] = (...args: any[]) => {
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
