export default {
    '**/*.{ts,tsx,js,jsx,json,md,yml,yaml}': ['prettier -w'],
    '**/*.{ts,tsx,js,jsx}': ['eslint --fix']
  };