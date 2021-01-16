import React, { ReactElement } from "react";
import { hasOwn } from ".";

export function getChildMapping(
  children: React.ReactElement | React.ReactElement[]
) {
  const result = {} as Record<string, ReactElement>;
  React.Children.forEach(children, child => {
    if (!child.key || hasOwn(result, child.key)) {
      // if (process.env.NODE_ENV === "development") {
      throw new Error(
        // TODO change accordion to the library name
        "[ReactTransition]: <TransitionGroup /> children must have unique keys"
      );
      // }
      // return;
    }
    result[child.key] = child;
  });
  return result;
}

export function mergeChildMappings(
  prev: Record<string, ReactElement> = {},
  next: Record<string, ReactElement> = {}
) {
  function getValueForKey(key: string) {
    return key in next ? next[key] : prev[key];
  }

  // For each key of `next`, the list of keys to insert before that key in
  // the combined list
  const nextKeysPending = Object.create(null);

  let pendingKeys = [];
  for (const prevKey in prev) {
    if (prevKey in next) {
      if (pendingKeys.length) {
        nextKeysPending[prevKey] = pendingKeys;
        pendingKeys = [];
      }
    } else {
      pendingKeys.push(prevKey);
    }
  }

  let i;
  const childMapping: Record<string, ReactElement> = {};
  for (const nextKey in next) {
    if (nextKeysPending[nextKey]) {
      for (i = 0; i < nextKeysPending[nextKey].length; i++) {
        const pendingNextKey = nextKeysPending[nextKey][i];
        childMapping[pendingNextKey] = getValueForKey(pendingNextKey);
      }
    }
    childMapping[nextKey] = getValueForKey(nextKey);
  }

  // Finally, add the keys which didn't appear before any key in `next`
  for (i = 0; i < pendingKeys.length; i++) {
    childMapping[pendingKeys[i]] = getValueForKey(pendingKeys[i]);
  }

  return childMapping;
}
