// Shared Motion (motion/react) variants — kept centralized so every page's
// entrance/stagger/hover motion is consistent instead of one-off per file.

export const pageFade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
};

export const staggerContainer = {
  initial: "hidden",
  animate: "show",
  variants: {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.05, delayChildren: 0.04 },
    },
  },
};

export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  },
};

export const cardIn = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
};

export const tapScale = { scale: 0.97 };
export const hoverLift = { y: -2 };
