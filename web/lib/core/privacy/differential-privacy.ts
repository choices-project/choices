export function dpNoise(value: number, epsilon = 1): number {
  // simple laplace-ish stub; replace with real lib
  return value + (Math.random() - 0.5) / Math.max(epsilon, 0.0001);
}






