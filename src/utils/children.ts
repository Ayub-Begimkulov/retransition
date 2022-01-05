import { Children, ReactElement } from "react";
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

// check whether the children are the same
// using keys
export function areChildrenEqual(
  arr1: React.ReactElement[],
  arr2: React.ReactElement[]
) {
  if (arr1 === arr2) return true;
  if (arr1.length !== arr2.length) return false;
  for (let i = 0, l = arr1.length; i < l; i++) {
    if (arr1[i].key !== arr2[i].key) return false;
  }
  return true;
}

export function ensureChildrenKeys(children: ReactElement | ReactElement[]) {
  const seen = new Set();
  Children.forEach(children, child => {
    if (!child.key) {
      throw new Error(
        "[retransition]: <TransitionGroup /> children must have unique keys."
      );
    }
    if (seen.has(child.key)) {
      throw new Error(
        "[retransition]: Duplicate key " +
          child.key +
          ". <TransitionGroup /> children must have unique keys."
      );
    }
    seen.add(child.key);
  });
}

export function getElementProps(
  child: ReactElement,
  key: string,
  defaultValue?: any
) {
  if (hasOwn(child.props, key)) return child.props[key];
  return defaultValue;
}
