import { useCallback, useEffect, useState } from 'react';
import {
  getReadingList,
  isOnReadingList,
  subscribeReadingList,
  toggleReadingListItem,
} from '@/utils/readingList';

export function useReadingList(slug) {
  const [items, setItems] = useState(() => getReadingList());

  useEffect(() => subscribeReadingList(setItems), []);

  const saved = Boolean(slug && items.some((item) => item.slug === slug));

  const toggle = useCallback((entry) => {
    setItems(toggleReadingListItem(entry));
  }, []);

  return {
    items,
    count: items.length,
    saved,
    isSaved: isOnReadingList,
    toggle,
  };
}
