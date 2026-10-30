import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: number;
}

export function Stack({
  children,
  className,
  gap = 16,
  style,
  ...props
}: StackProps) {
  const mergedStyle: CSSProperties = {
    ...style,
    display: "flex",
    flexDirection: "column",
    gap,
  };

  return (
    <div className={className} style={mergedStyle} {...props}>
      {children}
    </div>
  );
}
