export const enum ElementBindings {
  registered = "_r_",
  moveCallback = "_mc_",
  transitionClasses = "_tc_",
}

export const __DEV__ =
  process.env.NODE_ENV !== "production" || process.env.TESTING;
