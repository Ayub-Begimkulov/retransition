import React, {
  Children,
  cloneElement,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { TransitionGroupContext } from "./context";
import { useIsMounted, useLatest, usePrevious } from "./hooks";
import { TransitionProps } from "./Transition";
import {
  addClass,
  combine,
  getTransitionInfo,
  hasOwn,
  removeClass,
} from "./utils";
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

const enum ElementBindings {
  registered = "_r_",
  moveCallback = "_mc_",
}

interface TransitionGroupMemoProps
  extends Omit<TransitionGroupProps, "children"> {
  childrenRef: React.MutableRefObject<React.ReactElement[]>;
  runEffect: number;
}

const TransitionGroup = ({
  children,
  name,
  appear,
  moveClass,
}: TransitionGroupProps) => {
  // we have to check that array didn't had any keys before calling toArray
  const childrenArray = Children.toArray(children) as React.ReactElement[];
  const childrenRef = useLatest(childrenArray);
  const prevChildren = usePrevious(childrenArray);
  const shouldRunLayoutEffect = useRef(0);

  if (
    !prevChildren.current ||
    !areChildrenEqual(childrenArray, prevChildren.current)
  ) {
    shouldRunLayoutEffect.current++;
  }

  return (
    <TransitionGroupMemo
      name={name}
      appear={appear}
      moveClass={moveClass}
      childrenRef={childrenRef}
      runEffect={shouldRunLayoutEffect.current}
    />
  );
};

const TransitionGroupMemo = memo(
  ({
    name,
    appear,
    moveClass,
    childrenRef,
    runEffect,
  }: TransitionGroupMemoProps) => {
    const prevRunEffect = usePrevious(runEffect);
    const isMounted = useIsMounted();

    // TODO does having `newChildrenElements` is helpful?
    const newChildrenElements = useRef<Element[]>([]);
    const prevChildrenElements = useRef<Element[]>([]);

    if (
      prevRunEffect.current !== runEffect &&
      prevChildrenElements.current.length > 0
    ) {
      prevChildrenElements.current.forEach(recordPosition);
    }

    const ctxValue = useMemo(
      () => ({
        get isAppearing() {
          return !isMounted.current;
        },
        register(el: Element) {
          if (!(el as any)[ElementBindings.registered]) {
            (el as any)[ElementBindings.registered] = true;
            newChildrenElements.current.push(el);
          }
        },
        unregister(el: Element) {
          prevChildrenElements.current = prevChildrenElements.current.filter(
            e => e !== el
          );
          (el as any)[ElementBindings.registered] = null;
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
      let childrenToMove = prevChildrenElements.current;
      if (!isMounted.current) {
        updateChildren();
        return;
      }
      console.time("transition time");
      const root = childrenToMove[0].parentElement!;
      const test = childrenToMove.map(child => {
        const clone = child.cloneNode() as HTMLElement;
        addClass(clone, moveCls);
        clone.style.display = "none";
        root.appendChild(clone);
        return [child, clone];
      });
      const result = [];
      for (let i = 0, l = test.length; i < l; i++) {
        const [child, clone] = test[i];
        if (getTransitionInfo(clone).hasTransform) {
          result.push(child);
        }
      }
      childrenToMove = result;
      test.forEach(([, clone]) => {
        root.removeChild(clone);
      });

      // 3 separate loops for performance
      // https://stackoverflow.com/questions/19250971/why-a-tiny-reordering-of-dom-read-write-operations-causes-a-huge-performance-dif
      childrenToMove.forEach(el =>
        (el as any)[ElementBindings.moveCallback]?.()
      );
      childrenToMove.forEach(recordNewPosition);
      const movedChildren = childrenToMove.filter(applyTranslation);

      forceReflow();

      movedChildren.forEach(child => {
        addClass(child, moveCls);
        (child as HTMLElement).style.transitionDuration = "";
        (child as HTMLElement).style.transform = "";
        const endCb = ((child as any)[ElementBindings.moveCallback] = (
          e?: Event
        ) => {
          if (e && e.target !== child) {
            return;
          }
          if (!e || /transform$/.test((e as TransitionEvent).propertyName)) {
            child.removeEventListener("transitionend", endCb);
            (child as any)[ElementBindings.moveCallback] = null;
            removeClass(child, moveCls);
          }
        });
        // TODO think about performance issues if using
        // whenTransitionEnds here
        child.addEventListener("transitionend", endCb);
      });
      console.timeEnd("transition time");
      updateChildren();
    }, [
      runEffect,
      // TODO move class and name should not cause update
      // only the change of the children array
      moveClass,
      name,
      isMounted,
    ]);

    const childrenToRender = /*#__NOINLINE__*/ useTransitionChildren(
      childrenRef.current,
      appear,
      name
    );

    return (
      <TransitionGroupContext.Provider value={ctxValue}>
        {childrenToRender}
      </TransitionGroupContext.Provider>
    );
  }
);

function areChildrenEqual(
  arr1: React.ReactElement[],
  arr2: React.ReactElement[]
) {
  return (
    arr1.length === arr2.length &&
    arr1.every((item, i) => item.key === arr2[i].key)
  );
}

function getProp(el: React.ReactElement, key: string, defaultValue?: any) {
  if (!hasOwn(el.props, key)) return defaultValue;
  return el.props[key];
}

function useTransitionChildren(
  children: React.ReactElement[],
  appear: boolean | undefined,
  name?: string
) {
  const currentChildren = getChildMapping(children);
  const prevChildrenMapping = useRef<Record<string, React.ReactElement> | null>(
    null
  );

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
    prevChildrenMapping.current = newChildren;
  } else {
    const mapping = (prevChildrenMapping.current = mergeChildMappings(
      prevChildren,
      newChildren
    ));
    for (const key in mapping) {
      const isOld = hasOwn(prevChildren, key);
      const isNew = hasOwn(newChildren, key);
      if (isOld && !isNew) {
        // deleted item
        const onAfterLeaveProp = getProp(prevChildren[key], "onAfterLeave");
        result.push(
          cloneElement(prevChildren[key], {
            visible: false,
            onAfterLeave: combine(
              onAfterLeaveProp,
              () =>
                prevChildrenMapping.current &&
                delete prevChildrenMapping.current[key]
            ),
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
