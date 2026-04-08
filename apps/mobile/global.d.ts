declare global {
  var process: {
    env: Record<string, string | undefined>;
  };
}

export {};