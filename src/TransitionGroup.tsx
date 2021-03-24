import React, {
  Children,
  cloneElement,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { ElementBindings, __DEV__ } from "./constants";
import { TransitionGroupContext } from "./context";
import { useIsMounted, useLatest, usePrevious } from "./hooks";
import { TransitionProps } from "./Transition";
import { addClass, combine, hasOwn, removeClass } from "./utils";
import { getChildMapping, mergeChildMappings } from "./utils/children";

const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

export interface TransitionGroupProps {
  name?: string;
  appear?: boolean;
  moveTransition?: boolean;
  moveClass?: string;
  children:
    | React.ReactElement<TransitionProps>
    | React.ReactElement<TransitionProps>[];
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
  moveTransition,
  moveClass,
}: TransitionGroupProps) => {
  // we have to check that array didn't had any keys before calling toArray
  // because it will add keys itself that'd be unstable
  if (__DEV__) {
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
  const childrenArray = Children.toArray(children) as React.ReactElement[];
  const childrenRef = useLatest(childrenArray);
  const prevChildren = usePrevious(childrenArray);
  const shouldRunLayoutEffect = useRef(0);

  if (
    !prevChildren.current ||
    !areChildrenEqual(childrenArray, prevChildren.current)
  ) {
    // children are changed, increment counter to
    // update `TransitionGroupMemo` and run it layout effect
    shouldRunLayoutEffect.current++;
  }

  return (
    <TransitionGroupMemo
      name={name}
      appear={appear}
      moveTransition={moveTransition}
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
    moveTransition,
    moveClass,
    childrenRef,
    runEffect,
  }: TransitionGroupMemoProps) => {
    const latestProps = useLatest({ name, moveClass, moveTransition });
    const prevRunEffect = usePrevious(runEffect);
    const isMounted = useIsMounted();

    // TODO does having `newChildrenElements` is helpful?
    const newChildrenElements = useRef<Element[]>([]);
    const prevChildrenElements = useRef<Element[]>([]);

    if (prevRunEffect.current !== runEffect) {
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
      const { moveTransition = true, moveClass, name } = latestProps.current;
      if (!moveTransition) return;
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
      // separate loops for reads and writes to improve performance
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
        child.addEventListener("transitionend", endCb);
      });
      updateChildren();
    }, [runEffect, latestProps, isMounted]);

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
  if (hasOwn(el.props, key)) return el.props[key];
  return defaultValue;
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
