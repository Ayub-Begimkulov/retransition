import React, { Children, cloneElement, memo, useMemo, useRef } from "react";
import { ElementBindings, __DEV__ } from "./constants";
import { TransitionGroupContext } from "./context";
import {
  useIsMounted,
  useLatest,
  usePrevious,
  useIsomorphicLayoutEffect as useLayoutEffect,
} from "./hooks";
import { TransitionProps } from "./Transition";
import { addClass, hasOwn, removeArrayElement, removeClass } from "./utils";
import {
  areChildrenEqual,
  ensureChildrenKeys,
  getChildMapping,
  getElementProps,
  mergeChildMappings,
} from "./utils/children";
import {
  recordPosition,
  recordNewPosition,
  applyTranslation,
  forceReflow,
} from "./utils/position";

interface TransitionCloneProps extends Omit<TransitionProps, "children"> {
  key: React.Key;
}

export interface TransitionGroupProps {
  name?: string;
  appear?: boolean;
  moveTransition?: boolean;
  moveClass?: string;
  children:
    | React.ReactElement<TransitionProps>
    | React.ReactElement<TransitionProps>[];
}

const TransitionGroup = memo(
  ({
    children,
    name = "transition",
    appear,
    moveTransition = true,
    moveClass,
  }: TransitionGroupProps) => {
    // we have to check that array didn't had any keys before calling toArray
    // because it will add keys itself that'd be unstable
    if (__DEV__) {
      ensureChildrenKeys(children);
    }
    const latestProps = useLatest({ name, moveClass, moveTransition });
    const isMounted = useIsMounted();

    const childrenArray = Children.toArray(children) as React.ReactElement[];
    const prevChildren = usePrevious(childrenArray);

    // is it helpful to have `newChildrenElements`?
    const newChildrenElements = useRef<Element[]>([]);
    const prevChildrenElements = useRef<Element[]>([]);

    const runEffect = useRef(0);

    if (
      moveTransition &&
      (!prevChildren.current ||
        !areChildrenEqual(childrenArray, prevChildren.current))
    ) {
      // children are changed, increment counter to
      // run layout effect
      runEffect.current++;
      // only record positions if children has changed
      prevChildrenElements.current.forEach(recordPosition);
    }

    const ctxValue = useMemo(
      () => ({
        get isAppearing() {
          return !isMounted.current;
        },
        register(element: Element) {
          if (!(element as any)[ElementBindings.registered]) {
            (element as any)[ElementBindings.registered] = true;
            newChildrenElements.current.push(element);
          }
        },
        unregister(element: Element) {
          removeArrayElement(prevChildrenElements.current, element);
          (element as any)[ElementBindings.registered] = null;
        },
      }),
      [isMounted]
    );

    useLayoutEffect(() => {
      const { moveTransition, moveClass, name } = latestProps.current;

      if (!moveTransition) return;

      if (isMounted.current) {
        const moveCls = moveClass || `${name}-move`;
        const childrenToMove = prevChildrenElements.current;

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
      }

      if (newChildrenElements.current.length > 0) {
        prevChildrenElements.current = prevChildrenElements.current.concat(
          newChildrenElements.current
        );
        newChildrenElements.current = [];
      }
    }, [runEffect.current, latestProps, isMounted]);

    const childrenToRender = /*#__NOINLINE__*/ useTransitionChildren(
      childrenArray,
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

function useTransitionChildren(
  children: React.ReactElement[],
  appear: boolean | undefined,
  name?: string
) {
  const prevChildrenMapping = useRef<Record<string, React.ReactElement> | null>(
    null
  );

  const newChildren = getChildMapping(children);
  const prevChildren = prevChildrenMapping.current;

  const result: React.ReactElement[] = [];

  if (!prevChildren) {
    for (const key in newChildren) {
      const childAppear = getElementProps(newChildren[key], "appear", appear);
      const childName = getElementProps(newChildren[key], "name", name);

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
        const onAfterLeaveProp = getElementProps(
          prevChildren[key],
          "onAfterLeave"
        );
        result.push(
          cloneElement(prevChildren[key], {
            visible: false,
            onAfterLeave: (el: Element) => {
              onAfterLeaveProp?.(el);
              delete prevChildrenMapping.current?.[key];
            },
            name: getElementProps(prevChildren[key], "name", name),
          })
        );
      } else {
        // new or old item
        const props: TransitionCloneProps = {
          key,
          visible: true,
          name: getElementProps(newChildren[key], "name", name),
          // passing appear `true` for new items, because without it
          // we won't get enter transition
          appear: isNew,
        };

        result.push(cloneElement(newChildren[key], props));
      }
    }
  }
  return result;
}

export default TransitionGroup;
