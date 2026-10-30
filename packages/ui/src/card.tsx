import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  const classes = ["syn-card", className].filter(Boolean).join(" ");

  return (
    <article className={classes} {...props}>
      {children}
    </article>
  );
}
