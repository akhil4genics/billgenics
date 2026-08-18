'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ComponentType, ElementType, ReactNode } from 'react';

type MotionComponents = typeof motion;

/* ─── Shared animation variants ──────────────────────────────────────────── */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

/* Standard viewport config: animate once, trigger slightly before fully in view */
export const inView = { once: true, amount: 0.2, margin: '0px 0px -80px 0px' } as const;

/* ─── MotionReveal ────────────────────────────────────────────────────────
 * Drop-in scroll reveal. Honors prefers-reduced-motion (renders static).
 * ────────────────────────────────────────────────────────────────────────── */

export function MotionReveal({
  children,
  className = '',
  delay = 0,
  variants = fadeUp,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof MotionComponents] as ComponentType<Record<string, unknown>>;

  if (reduce) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

/* Container that staggers its MotionChild descendants on scroll */
export function MotionStagger({
  children,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'ul';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof MotionComponents] as ComponentType<Record<string, unknown>>;

  if (reduce) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
    >
      {children}
    </MotionTag>
  );
}

/* A single item inside MotionStagger */
export function MotionChild({
  children,
  className = '',
  variants = fadeUp,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  as?: 'div' | 'li' | 'span';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as as keyof MotionComponents] as ComponentType<Record<string, unknown>>;

  if (reduce) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
