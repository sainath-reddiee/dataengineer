import React, { useState, useEffect, useRef, useMemo } from 'react';

const VirtualizedList = ({ 
  items, 
  itemHeight = 200, 
  containerHeight = 600, 
  renderItem, 
  overscan = 3 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight,
    }));
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      className="relative"
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div
            key={item.id || item.index}
            style={{
              position: 'absolute',
              top: item.top,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;