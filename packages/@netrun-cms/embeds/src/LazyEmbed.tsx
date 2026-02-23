import { type ReactNode, useRef, useState, useEffect } from 'react';

interface LazyEmbedProps {
  title: string;
  aspectRatio?: string;
  children: (isVisible: boolean) => ReactNode;
  className?: string;
}

export function LazyEmbed({ title, aspectRatio = '16/9', children, className }: LazyEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ aspectRatio, width: '100%', position: 'relative' }}
      aria-label={title}
    >
      {children(isVisible)}
    </div>
  );
}
