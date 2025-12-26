"use client";

type TProps = {
  value?: string;
  className?: string;
};

export function T({ value, className }: TProps) {
  if (!value) return null;

  // Evita mostrar keys crudas como "client.subtitle"
  if (value.includes(".")) return null;

  return <span className={className}>{value}</span>;
}