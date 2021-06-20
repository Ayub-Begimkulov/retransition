import { ReactElement } from "react";
import { hasOwn } from ".";

type ChildMapping = Record<string, ReactElement>;

export function getChildMapping(children: ReactElement[]) {
  const result: ChildMapping = {};
  children.forEach(child => {
    // at this point we can be sure that children have keys
    result[child.key!] = child;
  });
  return result;
}

export function mergeChildMappings(prev: ChildMapping, next: ChildMapping) {
  function getValueForKey(key: string) {
    return hasOwn(next, key) ? next[key] : prev[key];
  }

  // For each key of `next`, the list of keys to insert before that key in
  // the combined list
  const nextKeysPending = Object.create(null);

  let pendingKeys: string[] = [];
  for (const prevKey in prev) {
    if (hasOwn(next, prevKey)) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys;
        pendingKeys = [];
      }
    } else {
      pendingKeys.push(prevKey);
    }
  }

  let i, l;
  const childMapping: ChildMapping = {};
  for (const nextKey in next) {
    if (nextKeysPending[nextKey]) {
      for (i = 0, l = nextKeysPending[nextKey].length; i < l; i++) {
        const pendingNextKey = nextKeysPending[nextKey][i];
        childMapping[pendingNextKey] = getValueForKey(pendingNextKey);
      }
    }
    childMapping[nextKey] = getValueForKey(nextKey);
  }

  // Finally, add the keys which didn't appear before any key in `next`
  for (i = 0, l = pendingKeys.length; i < l; i++) {
    childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
  }

  return childMapping;
}
