import React from 'react';

/**
 * Scrolls an element into view with smooth behavior
 */
export const scrollToBottom = (ref: React.RefObject<HTMLElement | null>) => {
  ref.current?.scrollIntoView({ behavior: "smooth" });
};

/**
 * Scrolls to the top of an element
 */
export const scrollToTop = (ref: React.RefObject<HTMLElement | null>) => {
  ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};

/**
 * Checks if an element is scrolled to bottom
 */
export const isScrolledToBottom = (element: HTMLElement, threshold: number = 100) => {
  return element.scrollHeight - element.scrollTop <= element.clientHeight + threshold;
};