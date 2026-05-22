import type { ReactNode } from 'react';
import styles from './Section.module.css';

type SectionProps = {
  children: ReactNode;
  className?: string;
};

export function Section({ children, className = '' }: SectionProps) {
  return <section className={`${styles.section} ${className}`}>{children}</section>;
}