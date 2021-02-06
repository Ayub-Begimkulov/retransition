import React, {
  Children,
  cloneElement,
  memo,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { TransitionGroupContext } from "./context";
import { useHasChanged, useIsMounted, usePrevious } from "./hooks";
import { TransitionProps } from "./Transition";
import { addClass, combine, hasOwn, removeClass } from "./utils";
import { getChildMapping, mergeChildMappings } from "./utils/children";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

export interface TransitionGroupProps {
  name?: string;
  appear?: boolean;
  moveClass?: string;
  children:
    | React.ReactElement<TransitionProps>
    | React.ReactElement<TransitionProps>[];
}

const TransitionGroup = memo(
  ({ name, appear, moveClass, children }: TransitionGroupProps) => {
    const isMounted = useIsMounted();
    // TODO test if it's useful to have
    // `newChildrenElements` array
    const newChildrenElements = useRef<Element[]>([]);
    const prevChildrenElements = useRef<Element[]>([]);

    const childrenChanged = useHasChanged(children);
    // TODO can you pass info from memo compare function
    // so we don't need to check for children difference
    if (childrenChanged && prevChildrenElements.current.length > 0) {
      prevChildrenElements.current.forEach(recordPosition);
    }

    const ctxValue = useMemo(
      () => ({
        // TODO rename getter
        get isAppear() {
          return !isMounted.current;
        },
        register(el: Element) {
          newChildrenElements.current.push(el);
        },
        unregister(el: Element) {
          prevChildrenElements.current = prevChildrenElements.current.filter(
            e => e !== el
          );
        },
      }),
      [isMounted]
    );

    useLayoutEffect(() => {
      const updateChildren = () => {
        if (newChildrenElements.current.length > 0) {
          prevChildrenElements.current = prevChildrenElements.current.concat(
            newChildrenElements.current
          );
          newChildrenElements.current = [];
        }
      };
      const moveCls = moveClass || `${name || "transition"}-move`;
      const childrenToMove = prevChildrenElements.current;
      if (!isMounted.current) {
        updateChildren();
        return;
      }
      // 3 separate loops for performance
      // https://stackoverflow.com/questions/19250971/why-a-tiny-reordering-of-dom-read-write-operations-causes-a-huge-performance-dif
      childrenToMove.forEach(el => (el as any)._endCb?.());
      childrenToMove.forEach(recordNewPosition);
      const movedChildren = childrenToMove.filter(applyTranslation);
      forceReflow();

      movedChildren.forEach(child => {
        addClass(child, moveCls);
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
        // TODO think about performance issues if using
        // whenTransitionEnds here
        child.addEventListener("transitionend", endCb);
      });
      updateChildren();
    }, [children, moveClass, name, isMounted]);

    const childrenToRender = useTransitionChildren(children, appear, name);

    return (
      <TransitionGroupContext.Provider value={ctxValue}>
        {childrenToRender}
      </TransitionGroupContext.Provider>
    );
  },
  arePropsEqual
);

function arePropsEqual(
  prevProps: TransitionGroupProps,
  nextProps: TransitionGroupProps
) {
  if (prevProps === nextProps) {
    return true;
  }
  const prevKeys = Object.keys(prevProps) as (keyof TransitionGroupProps)[];
  const nextKeys = Object.keys(nextProps) as (keyof TransitionGroupProps)[];

  if (!areArraysEqual(prevKeys, nextKeys)) {
    return false;
  }
  for (let i = 0, l = prevKeys.length; i < l; i++) {
    const key = prevKeys[i];
    if (key === "children") {
      const prevChildren = Children.toArray(
        prevProps[key]
      ) as React.ReactElement[];
      const nextChildren = Children.toArray(
        nextProps[key]
      ) as React.ReactElement[];
      if (
        !areArraysEqual(prevChildren, nextChildren, (a, b) => a.key === b.key)
      ) {
        return false;
      }
      continue;
    }
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  return true;
}

const defaultCompare = (a: any, b: any) => a === b;

function areArraysEqual<T>(arr1: T[], arr2: T[], compare = defaultCompare) {
  return (
    arr1.length === arr2.length &&
    arr1.every((item, i) => compare(item, arr2[i]))
  );
}

const getProp = (el: React.ReactElement, key: string, defaultValue?: any) => {
  if (!hasOwn(el.props, key)) return defaultValue;
  return el.props[key];
};

function useTransitionChildren(
  children: React.ReactElement | React.ReactElement[],
  appear: boolean | undefined,
  name?: string
) {
  // TODO think about different way to update children
  const [, forceRerender] = useReducer(x => x + 1, 0);
  const currentChildren = getChildMapping(children);
  const prevChildrenMapping = usePrevious(currentChildren);

  const newChildren = currentChildren;
  const prevChildren = prevChildrenMapping.current;

  const result: React.ReactElement[] = [];
  if (!prevChildren) {
    for (const key in newChildren) {
      const childAppear = getProp(newChildren[key], "appear", appear);
      const childName = getProp(newChildren[key], "name", name);
      result.push(
        cloneElement(newChildren[key], {
          key,
          visible: true,
          appear: childAppear,
          name: childName,
        })
      );
    }
  } else {
    const mapping = mergeChildMappings(prevChildren, newChildren);
    for (const key in mapping) {
      const isOld = hasOwn(prevChildren, key);
      const isNew = hasOwn(newChildren, key);
      if (isOld && !isNew) {
        // deleted item
        const onAfterLeaveProp = getProp(prevChildren[key], "onAfterLeave");
        result.push(
          cloneElement(prevChildren[key], {
            visible: false,
            onAfterLeave: onAfterLeaveProp
              ? combine(onAfterLeaveProp, forceRerender)
              : forceRerender,
            name: getProp(prevChildren[key], "name", name),
          })
        );
      } else if (isNew) {
        // new item
        result.push(
          cloneElement(newChildren[key], {
            key,
            visible: true,
            // passing appear true, because without it
            // we won't get enter transition
            // TODO think about the situation where
            // it could lead to bugs
            appear: true,
            name: getProp(newChildren[key], "name", name),
          })
        );
      } else {
        // old item
        result.push(
          cloneElement(newChildren[key], {
            key,
            visible: true,
            name: getProp(newChildren[key], "name", name),
          })
        );
      }
    }
  }
  return result;
}

function recordPosition(el: Element) {
  positionMap.set(el, el.getBoundingClientRect());
}

function recordNewPosition(el: Element) {
  newPositionMap.set(el, el.getBoundingClientRect());
}

function applyTranslation(c: Element) {
  const oldPos = positionMap.get(c);
  const newPos = newPositionMap.get(c);
  if (!oldPos || !newPos) return;
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;
  if (!dx && !dy) return;
  const s = (c as HTMLElement).style;
  s.transform = `translate(${dx}px,${dy}px)`;
  s.transitionDuration = "0";
  return c;
}

function forceReflow() {
  return document.body.offsetHeight;
}

export default TransitionGroup;
