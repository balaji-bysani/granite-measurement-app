import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for virtual scrolling optimization
 * Helps render large lists efficiently by only rendering visible items
 */
export const useVirtualScrolling = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      ...item,
      index: visibleRange.startIndex + index
    }));
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);
  
  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  // Scroll handler
  const handleScroll = (event) => {
    setScrollTop(event.target.scrollTop);
  };
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange
  };
};

/**
 * Custom hook for debounced values
 * Useful for search inputs to avoid excessive API calls
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

/**
 * Custom hook for caching API responses
 * Provides simple in-memory caching with TTL
 */
export const useCache = (ttl = 300000) => { // 5 minutes default TTL
  const [cache, setCache] = useState(new Map());
  
  const get = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      setCache(new Map(cache));
      return null;
    }
    
    return item.data;
  };
  
  const set = (key, data) => {
    const newCache = new Map(cache);
    newCache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
    setCache(newCache);
  };
  
  const clear = () => {
    setCache(new Map());
  };
  
  const remove = (key) => {
    const newCache = new Map(cache);
    newCache.delete(key);
    setCache(newCache);
  };
  
  return { get, set, clear, remove };
};