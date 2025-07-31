import React, { useRef, useEffect } from 'react';

interface LogoScrollerProps {
  logos: string[];
  scrollSpeed?: number;
}

const LogoScroller: React.FC<LogoScrollerProps> = ({ logos, scrollSpeed = 0.2 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const scrollPosition = useRef(0);
  const direction = useRef(1);
  const animationFrameId = useRef<number | null>(null);

  const scroll = () => {
    if (!scrollRef.current || !containerRef.current || !isHovered.current) {
      return;
    }

    const container = containerRef.current;
    const scrollContent = scrollRef.current;

    // Check if scrolling is needed
    const contentWidth = scrollContent.scrollWidth / 2; // Half due to duplication
    const containerWidth = container.clientWidth;
    if (contentWidth <= containerWidth) {
      console.log('No scroll needed: content fits in container', { contentWidth, containerWidth });
      return;
    }

    scrollPosition.current += direction.current * scrollSpeed;
    container.scrollLeft = scrollPosition.current;

    // Seamless loop
    const maxScroll = contentWidth - containerWidth;
    if (scrollPosition.current >= maxScroll || scrollPosition.current <= 0) {
      direction.current *= -1;
    }

    // Debug log (remove after testing)
    // console.log('Scrolling:', {
    //   position: scrollPosition.current,
    //   maxScroll,
    //   direction: direction.current,
    //   contentWidth,
    //   containerWidth,
    // });

    animationFrameId.current = requestAnimationFrame(scroll);
  };

  useEffect(() => {
    // Handle image loading to update scrollPosition
    const handleImageLoad = () => {
      if (containerRef.current && scrollRef.current) {
        scrollPosition.current = containerRef.current.scrollLeft;
        console.log('Image loaded, updated scrollPosition:', scrollPosition.current);
      }
    };

    const images = scrollRef.current?.querySelectorAll('img') || [];
    images.forEach((img) => img.addEventListener('load', handleImageLoad));

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
      images.forEach((img) => img.removeEventListener('load', handleImageLoad));
    };
  }, [scrollSpeed]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden w-full"
      style={{ minWidth: '200px' }} // Ensure container has a minimum width
      onMouseEnter={() => {
        isHovered.current = true;
        if (containerRef.current) {
          scrollPosition.current = containerRef.current.scrollLeft;
        }
        if (animationFrameId.current === null) {
          // console.log('Starting scroll');
          animationFrameId.current = requestAnimationFrame(scroll);
        }
      }}
      onMouseLeave={() => {
        isHovered.current = false;
        if (animationFrameId.current !== null) {
          // console.log('Stopping scroll');
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      }}
    >
      <div ref={scrollRef} className="flex gap-4">
        {[...logos, ...logos].map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Logo ${index}`}
            className="w-12 h-12 object-contain flex-shrink-0"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
};

export default LogoScroller;