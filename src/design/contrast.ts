/** WCAG 2.1 relative luminance and contrast, used by the styleguide and the tests. */

function channels(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const parse = (start: number) => parseInt(full.slice(start, start + 2), 16) / 255
  return [parse(0), parse(2), parse(4)]
}

const toLinear = (channel: number) =>
  channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4)

export function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map(toLinear) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

export const meetsAA = (foreground: string, background: string, min = 4.5) =>
  contrastRatio(foreground, background) >= min
