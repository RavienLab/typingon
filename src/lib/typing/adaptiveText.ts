export function generateAdaptiveText(
  weakKeys: string[],
  baseText: string
) {
  if (!weakKeys || weakKeys.length === 0) return baseText;

  let result = "";
  let i = 0;

  while (result.length < baseText.length) {
    if (Math.random() < 0.4) {
      result += weakKeys[i % weakKeys.length];
      i++;
    } else {
      result += baseText[Math.floor(Math.random() * baseText.length)];
    }
  }

  return result;
}
 