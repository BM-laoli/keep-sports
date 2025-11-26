const setter =
  <T>(key: string) =>
  (set: any) =>
  (value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      set((state: any) => ({
        ...state,
        [key]: (value as Function)(state[key]),
      }))
    } else {
      set({ [key]: value })
    }
  }

export { setter }
