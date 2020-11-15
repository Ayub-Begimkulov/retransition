import { usePrevious } from "hooks";
import React, {
  ReactElement,
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";
import Transition, { TransitionProps } from "Transition";
import { addClass, hasOwn, removeClass } from "utils";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

function applyTranslation(c: Element) {
  const oldPos = positionMap.get(c)!;
  const newPos = newPositionMap.get(c)!;
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;

  if (dx || dy) {
    const s = (c as HTMLElement).style;
    s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`;
    s.transitionDuration = "0";
    return c;
  }
  return;
}

function forceReflow() {
  console.log("force reflow");
  return document.body.offsetHeight;
}

function areArraysEqual(arr1: any[], arr2: any[]) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

interface TransitionGroupProps extends Omit<TransitionProps, "visible"> {
  tag?: string;
  moveClass?: string;
  className?: string;
}

function useTraceUpdate(props: any) {
  const prev = useRef(props);
  const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
    if (prev.current[k] !== v) {
      ps[k] = [prev.current[k], v];
    }
    return ps;
  }, {} as any);
  if (Object.keys(changedProps).length > 0) {
    console.log("Changed:", changedProps);
  }
  prev.current = props;
}

const TransitionGroup = ({
  name = "transition",
  moveClass,
  children,
  className,
}: React.PropsWithChildren<TransitionGroupProps>) => {
  const isFirst = useRef(true);
  const prevChildrenElements = useRef<Element[]>([]);

  useTraceUpdate({ name, moveClass, children, className });
  useLayoutEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      if (rootEl.current) {
        prevChildrenElements.current = [...rootEl.current.children];
      }
      return;
    }

    if (rootEl.current) {
      const childrenElements = [...rootEl.current.children];
      if (areArraysEqual(childrenElements, prevChildrenElements.current)) {
        return;
      }
      const childrenToMove = prevChildrenElements.current || [];
      childrenToMove.forEach(el => (el as any)._endCb?.());
      childrenToMove.forEach(el => {
        newPositionMap.set(el, el.getBoundingClientRect());
      });
      const movedChildren = childrenToMove.filter(applyTranslation);

      forceReflow();

      const moveCls = moveClass || `${name}-move`;
      movedChildren.forEach(child => {
        addClass(child, moveCls);
        positionMap.set(child, newPositionMap.get(child)!);
        (child as HTMLElement).style.transitionDuration = "";
        (child as HTMLElement).style.transform = "";
        const endCb = ((child as any)._endCb = (e?: Event) => {
          if (e && e.target !== child) {
            return;
          }
          if (!e || /transform$/.test((e as TransitionEvent).propertyName)) {
            removeClass(child, moveCls);
            (child as any)._endCb = null;
            child.removeEventListener("transitionend", endCb);
          }
        });
        child.addEventListener("transitionend", endCb);
      });
      prevChildrenElements.current = childrenElements;
    }
  }, [children]);

  const rootEl = useRef<HTMLDivElement>(null);

  const ref = useCallback((node: Element | null) => {
    if (node) {
      positionMap.set(node, node.getBoundingClientRect());
    }
  }, []);

  const [, forceRerender] = useReducer(x => x + 1, 0);
  if (isFirst.current) {
    console.log(forceRerender, hasOwn);
  }

  const getChildrenWithProps = (
    newChildren: Record<string, React.ReactElement>,
    prevChildren: Record<string, React.ReactElement> | null
  ) => {
    if (!prevChildren) {
      return Object.fromEntries(
        Object.entries(newChildren).map(([key, child]) => {
          return [key, <Transition visible={true}>{child}</Transition>];
        })
      );
    } else {
      const mapping = mergeChildMappings(prevChildren, newChildren);
      const result = {} as Record<string, JSX.Element>;
      Object.keys(mapping).forEach(key => {
        const isOld = hasOwn(prevChildren, key);
        const isNew = hasOwn(newChildren, key);
        if (isOld && !isNew) {
          result[key] = (
            <Transition
              visible={false}
              onAfterLeave={() => {
                console.log("leave");
                forceRerender();
              }}
            >
              {prevChildren[key]}
            </Transition>
          );
        } else {
          result[key] = (
            <Transition visible={true}>{newChildren[key]}</Transition>
          );
        }
      });
      return result;
    }
  };

  const currentChildren = getChildMapping(children);
  const prevChildrenMapping = usePrevious(currentChildren);

  let childrenToRender = getChildrenWithProps(
    currentChildren,
    prevChildrenMapping.current
  );

  const keysToRender = Object.keys(childrenToRender);

  return (
    <div className={className} ref={rootEl}>
      {keysToRender.map(key => {
        return React.cloneElement(childrenToRender[key], {
          key,
          appear: true,
          nodeRef: ref,
          name,
        });
      })}
    </div>
  );
};

function getChildMapping(children: React.ReactNode) {
  const result = {} as Record<string, React.ReactElement>;
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && child.key) {
      result[child.key] = child;
    }
  });
  return result;
}

export function mergeChildMappings(
  prev: Record<string, ReactElement>,
  next: Record<string, ReactElement>
) {
  prev = prev || {};
  next = next || {};

  function getValueForKey(key: string) {
    return key in next ? next[key] : prev[key];
  }

  // For each key of `next`, the list of keys to insert before that key in
  // the combined list
  let nextKeysPending = Object.create(null);

  let pendingKeys = [];
  for (let prevKey in prev) {
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
  let childMapping: Record<string, ReactElement> = {};
  for (let nextKey in next) {
    if (nextKeysPending[nextKey]) {
      for (i = 0; i < nextKeysPending[nextKey].length; i++) {
        let pendingNextKey = nextKeysPending[nextKey][i];
        childMapping[nextKeysPending[nextKey][i]] = getValueForKey(
          pendingNextKey
        );
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

export default TransitionGroup;
