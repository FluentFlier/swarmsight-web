// Statistical tests for motion data comparison

export interface StatResult {
  testName: string
  statistic: number
  pValue: number
  effectSize?: number
  warning?: string
}

/** Compute mean of an array */
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/** Compute standard deviation */
function std(arr: number[]): number {
  const m = mean(arr)
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

/** Divide frame-level data into time bins and compute bin means */
export function blockData(data: number[], binSize: number): number[] {
  const bins: number[] = []
  for (let i = 0; i < data.length; i += binSize) {
    const chunk = data.slice(i, i + binSize)
    bins.push(mean(chunk))
  }
  return bins
}

/** Two-sample t-test on bin means */
export function tTest(group1: number[], group2: number[]): StatResult {
  const n1 = group1.length
  const n2 = group2.length
  const m1 = mean(group1)
  const m2 = mean(group2)
  const s1 = std(group1)
  const s2 = std(group2)

  // Welch's t-test (unequal variances)
  const se = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2)
  const t = (m1 - m2) / se

  // Approximate df using Welch-Satterthwaite
  const v1 = (s1 * s1) / n1
  const v2 = (s2 * s2) / n2
  const df = (v1 + v2) ** 2 / (v1 * v1 / (n1 - 1) + v2 * v2 / (n2 - 1))

  // Approximate p-value using normal distribution for large df
  const pValue = 2 * (1 - normalCDF(Math.abs(t)))

  // Cohen's d
  const pooledStd = Math.sqrt(((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2))
  const effectSize = pooledStd > 0 ? (m1 - m2) / pooledStd : 0

  return {
    testName: `Welch's t-test (df=${df.toFixed(1)})`,
    statistic: t,
    pValue,
    effectSize,
  }
}

/** Permutation test: shuffle group labels 10,000 times */
export function permutationTest(group1: number[], group2: number[], nPerms = 10000): StatResult {
  const observed = Math.abs(mean(group1) - mean(group2))
  const combined = [...group1, ...group2]
  const n1 = group1.length
  let count = 0

  for (let i = 0; i < nPerms; i++) {
    // Fisher-Yates shuffle
    const shuffled = [...combined]
    for (let j = shuffled.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1))
      ;[shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]]
    }

    const permMean1 = mean(shuffled.slice(0, n1))
    const permMean2 = mean(shuffled.slice(n1))
    if (Math.abs(permMean1 - permMean2) >= observed) {
      count++
    }
  }

  return {
    testName: `Permutation test (n=${nPerms})`,
    statistic: observed,
    pValue: count / nPerms,
  }
}

/** Mann-Whitney U test (non-parametric) */
export function mannWhitneyU(group1: number[], group2: number[]): StatResult {
  const n1 = group1.length
  const n2 = group2.length

  // Count how many times a value from group1 exceeds a value from group2
  let u = 0
  for (const a of group1) {
    for (const b of group2) {
      if (a > b) u++
      else if (a === b) u += 0.5
    }
  }

  const meanU = (n1 * n2) / 2
  const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12)
  const z = (u - meanU) / stdU
  const pValue = 2 * (1 - normalCDF(Math.abs(z)))

  return {
    testName: 'Mann-Whitney U',
    statistic: u,
    pValue,
  }
}

/** Lag-1 autocorrelation */
export function autocorrelation(data: number[]): number {
  const m = mean(data)
  let num = 0
  let den = 0
  for (let i = 0; i < data.length; i++) {
    den += (data[i] - m) ** 2
    if (i > 0) {
      num += (data[i] - m) * (data[i - 1] - m)
    }
  }
  return den > 0 ? num / den : 0
}

/** Standard normal CDF approximation (Abramowitz & Stegun) */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.SQRT2

  const t = 1 / (1 + p * x)
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1 + sign * y)
}
