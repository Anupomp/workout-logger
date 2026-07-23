// Shared presentational UI kit. No business/app logic lives here — every
// component just renders + styles, and takes the same props a plain
// <div>/<input>/<button> would (value, onChange, onClick, children, ...).
// This keeps every page's actual logic (state, handlers, API calls)
// completely untouched while giving the whole app one consistent look.

import { forwardRef, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { animate } from "animejs";

// Created once at module scope — motion.create() should never be called
// inside a render function, or React remounts the element every render.
const MotionLink = motion.create(Link);

/* ---------------------------------------------------------------- layout */

export function PageShell({ children, maxWidth = 900 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ maxWidth, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem",
      }}
    >
      <div>
        {eyebrow && (
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: "0.01em",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: "var(--color-text-secondary)", margin: "8px 0 0", fontSize: 14 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ card */

export const cardBaseStyle = {
  background: "var(--color-background-secondary)",
  borderRadius: 14,
  padding: "1.4rem",
  border: "1px solid var(--color-border-tertiary)",
  boxShadow: "var(--shadow-card)",
};

export const Card = forwardRef(function Card({ children, style, glow = false, as = "div", ...rest }, ref) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      ref={ref}
      style={{
        ...cardBaseStyle,
        ...(glow ? { borderColor: "var(--color-border-info)", background: "var(--color-background-info)" } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
});

export function Row({ children, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.7rem 0",
        borderBottom: "1px solid var(--color-border-tertiary)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- button */

const buttonVariants = {
  primary: {
    background: "var(--color-accent)",
    color: "#141410",
    border: "1px solid var(--color-accent)",
  },
  neutral: {
    background: "var(--color-text-primary)",
    color: "var(--color-background-primary)",
    border: "1px solid var(--color-text-primary)",
  },
  outline: {
    background: "transparent",
    color: "var(--color-text-primary)",
    border: "1px solid var(--color-border-secondary)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--color-text-danger)",
    color: "#1a0508",
    border: "1px solid var(--color-text-danger)",
  },
};

export const Button = forwardRef(function Button(
  { children, variant = "primary", size = "md", style, disabled, to, ...rest },
  ref
) {
  const palette = buttonVariants[variant] || buttonVariants.primary;
  const padding = size === "sm" ? "0.45rem 0.9rem" : size === "lg" ? "0.8rem 1.75rem" : "0.65rem 1.4rem";
  const fontSize = size === "sm" ? 12.5 : 14;
  const Comp = to ? MotionLink : motion.button;

  return (
    <Comp
      ref={ref}
      to={to}
      disabled={to ? undefined : disabled}
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        ...palette,
        padding,
        fontSize,
        borderRadius: 9,
        fontWeight: 600,
        letterSpacing: "0.02em",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
});

/* ------------------------------------------------------------------ form */

export const inputBaseStyle = {
  display: "block",
  width: "100%",
  padding: "0.62rem 0.8rem",
  borderRadius: 9,
  border: "1px solid var(--color-border-secondary)",
  background: "var(--color-background-primary)",
  fontSize: 14,
  color: "var(--color-text-primary)",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

export function Label({ children, style }) {
  return (
    <label
      style={{
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--color-text-secondary)",
        display: "block",
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </label>
  );
}

export const Input = forwardRef(function Input({ style, ...rest }, ref) {
  return <input ref={ref} style={{ ...inputBaseStyle, ...style }} {...rest} />;
});

export const TextArea = forwardRef(function TextArea({ style, ...rest }, ref) {
  return <textarea ref={ref} style={{ ...inputBaseStyle, ...style }} {...rest} />;
});

export const Select = forwardRef(function Select({ style, children, ...rest }, ref) {
  return (
    <select ref={ref} style={{ ...inputBaseStyle, cursor: "pointer", ...style }} {...rest}>
      {children}
    </select>
  );
});

/* ----------------------------------------------------------------- badge */

export function Badge({ children, tone = "info", style }) {
  const tones = {
    info: { color: "var(--color-accent)", background: "var(--color-background-info)", border: "var(--color-border-info)" },
    success: { color: "var(--color-text-success)", background: "var(--color-background-success)", border: "rgba(51,232,148,0.32)" },
    danger: { color: "var(--color-text-danger)", background: "var(--color-background-error)", border: "var(--color-border-error)" },
    neutral: { color: "var(--color-text-secondary)", background: "var(--color-background-elevated)", border: "var(--color-border-tertiary)" },
  };
  const t = tones[tone] || tones.info;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: "0.03em",
        padding: "2px 7px",
        borderRadius: 6,
        color: t.color,
        background: t.background,
        border: `1px solid ${t.border}`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- empty state */

export function EmptyState({ children, style }) {
  return (
    <Card style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 14, ...style }}>
      {children}
    </Card>
  );
}

/* ------------------------------------------------------------- stat number
   Signature motion moment (animejs): big numeric stats count up from their
   previous value with a fast-out ease, like a plate settling into place.
   Purely presentational — callers just pass the already-computed number. */

export function StatNumber({ value, decimals = 0, suffix = "", prefix = "", style }) {
  const ref = useRef(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = typeof value === "number" && Number.isFinite(value) ? value : 0;
    const tween = { n: prevValue.current };

    const render = () => {
      const shown = decimals > 0 ? tween.n.toFixed(decimals) : Math.round(tween.n).toLocaleString();
      el.textContent = `${prefix}${shown}${suffix}`;
    };

    render();
    const anim = animate(tween, {
      n: target,
      duration: 850,
      ease: "outExpo",
      onUpdate: render,
    });

    prevValue.current = target;
    return () => anim.pause && anim.pause();
  }, [value, decimals, suffix, prefix]);

  return (
    <span
      ref={ref}
      style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", ...style }}
    >
      {prefix}0{suffix}
    </span>
  );
}

/* ----------------------------------------------------------------- divider */

export function SectionLabel({ children }) {
  return (
    <h2
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        margin: "0 0 0.75rem",
      }}
    >
      {children}
    </h2>
  );
}
