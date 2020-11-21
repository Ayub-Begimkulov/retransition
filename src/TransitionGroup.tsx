import React, {
  ReactElement,
  useCallback,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";
import { useHasChanged, useIsMounted, usePrevious } from "hooks";
import Transition, { TransitionProps } from "Transition";
import { addClass, hasOwn, removeClass } from "utils";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

function applyTranslation(c: Element) {
  const oldPos = positionMap.get(c);
  const newPos = newPositionMap.get(c);
  if (!oldPos || !newPos) return;
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
  return document.body.offsetHeight;
}

interface TransitionGroupProps extends Omit<TransitionProps, "visible"> {
  tag?: string;
  moveClass?: string;
  className?: string;
}

export function useTraceUpdate(props: any) {
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

const TransitionGroup: React.FC<TransitionGroupProps> = ({
  name = "transition",
  moveClass,
  children,
  className,
}) => {
  const isMounted = useIsMounted();
  const prevChildrenElements = useRef<Element[]>([]);

  const childrenChanged = useHasChanged(children);

  if (childrenChanged && prevChildrenElements.current.length > 0) {
    prevChildrenElements.current.forEach(el => {
      positionMap.set(el, el.getBoundingClientRect());
    });
  }

  useLayoutEffect(() => {
    if (rootEl.current) {
      if (!isMounted.current) {
        prevChildrenElements.current = [...rootEl.current.children];
        return;
      }
      const childrenElements = [...rootEl.current.children];
      const childrenToMove = prevChildrenElements.current || [];
      childrenToMove.forEach(el => (el as any)._endCb?.());
      childrenToMove.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (i < 2) {
          console.log(positionMap.get(el), rect);
        }
        newPositionMap.set(el, rect);
      });
      const movedChildren = childrenToMove.filter(applyTranslation);
      forceReflow();

      const moveCls = moveClass || `${name}-move`;
      movedChildren.forEach(child => {
        addClass(child, moveCls);
        // positionMap.set(child, newPositionMap.get(child)!);
        (child as HTMLElement).style.transitionDuration = "";
        (child as HTMLElement).style.transform = "";
        const endCb = ((child as any)._endCb = (e?: Event) => {
          if (e && e.target !== child) {
            return;
          }
          if (!e || /transform$/.test((e as TransitionEvent).propertyName)) {
            child.removeEventListener("transitionend", endCb);
            (child as any)._endCb = null;
            removeClass(child, moveCls);
          }
        });
        child.addEventListener("transitionend", endCb);
      });
      prevChildrenElements.current = childrenElements;
    }
  }, [children, moveClass, name, isMounted]);

  const rootEl = useRef<HTMLDivElement>(null);

  const onAfterEnter = useCallback((el: Element) => {
    positionMap.set(el, el.getBoundingClientRect());
  }, []);

  const currentChildren = getChildMapping(children);
  const prevChildrenMapping = usePrevious(currentChildren);

  const childrenToRender = getChildrenWithProps(
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
          name,
          onAfterEnter,
        });
      })}
    </div>
  );
};

function getChildrenWithProps(
  newChildren: Record<string, React.ReactElement>,
  prevChildren: Record<string, React.ReactElement> | null
) {
  const [, forceRerender] = useReducer(x => x + 1, 0);
  if (!prevChildren) {
    const result = {} as typeof newChildren;
    for (const key in newChildren) {
      result[key] = <Transition visible={true}>{newChildren[key]}</Transition>;
    }
    return result;
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
}

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
