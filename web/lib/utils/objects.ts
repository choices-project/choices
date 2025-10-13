// Utility functions for object manipulation
export const withOptional = <T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[] | string
): Partial<T> => {
  const result: Partial<T> = {}
  const keysArray = Array.isArray(keys) ? keys : [keys]
  keysArray.forEach(key => {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  })
  return result
}

export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj }
  keys.forEach(key => {
    delete result[key]
  })
  return result
}

export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T => {
  const result = { ...target }
  Object.keys(source).forEach(key => {
    const sourceValue = source[key as keyof T]
    const targetValue = result[key as keyof T]
    
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key as keyof T] = deepMerge(targetValue, sourceValue) as T[keyof T]
    } else {
      result[key as keyof T] = sourceValue as T[keyof T]
    }
  })
  return result
}