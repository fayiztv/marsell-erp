/**
 * Shared Framer Motion animation variants.
 * Import and spread these into motion components for consistent animations.
 */
import type { Variants } from 'framer-motion';

/** Backdrop for modals/overlays */
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Modal/dialog content */
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/** Dropdown menus (select, context menus) */
export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -6, scaleY: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scaleY: 0.97,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

/** Toast notifications (slide in from right) */
export const toastVariants: Variants = {
  initial: { opacity: 0, x: 40, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    x: 40,
    scale: 0.95,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/** Cards and list items (fade + slide up) */
export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
};

/** Page-level transitions */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};
