export const isNearBottom = (element: HTMLElement, threshold = 50): boolean => {
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight < threshold;
};

export const scrollToBottom = (element: HTMLElement): void => {
  element.scrollTop = element.scrollHeight;
};

export const maintainScroll = (
  element: HTMLElement,
  callback: () => void
): void => {
  const { scrollTop } = element;
  callback();
  element.scrollTop = scrollTop;
}; 