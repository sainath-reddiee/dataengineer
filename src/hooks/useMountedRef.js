import { useEffect, useRef } from 'react';

/**
 * useMountedRef — returns a ref that is `true` while the component is mounted
 * and `false` after unmount. Use it to guard `setState` after long async work
 * to avoid React's "state update on an unmounted component" leak warning.
 *
 * Example:
 *   const mounted = useMountedRef();
 *   const result = await longApi();
 *   if (!mounted.current) return;
 *   setData(result);
 */
export function useMountedRef() {
    const ref = useRef(true);
    useEffect(() => {
        ref.current = true;
        return () => { ref.current = false; };
    }, []);
    return ref;
}

export default useMountedRef;
