const positionMap = new WeakMap<Element, { top: number; left: number }>();
const newPositionMap = new WeakMap<Element, { top: number; left: number }>();

export function recordPosition(element: Element) {
  positionMap.set(element, element.getBoundingClientRect());
}

export function recordNewPosition(element: Element) {
  newPositionMap.set(element, element.getBoundingClientRect());
}

export function applyTranslation(element: Element) {
  const oldPos = positionMap.get(element);
  const newPos = newPositionMap.get(element);
  // istanbul ignore if
  if (!oldPos || !newPos) return;
  const dx = oldPos.left - newPos.left;
  const dy = oldPos.top - newPos.top;
  if (!dx && !dy) return;
  const style = (element as HTMLElement).style;
  style.transform = `translate(${dx}px,${dy}px)`;
  style.transitionDuration = "0";
  return element;
}

export function forceReflow() {
  return document.body.offsetHeight;
}
