import { useRef } from 'react';
import { isEqual } from 'lodash';

/**
 * useDeepMemo
 * 使用深比较的 useMemo
 *
 * @param factory 工厂函数，返回需要缓存的值
 * @param deps 依赖数组
 */
function useDeepMemo<T>(factory: () => T, deps: any[]): T {
  // 使用 useRef 存储上一次的依赖和计算结果
  // 初始值为 undefined
  const ref = useRef<{ deps: any[]; value: T }>(undefined);

  // 如果是首次渲染（ref.current 为空），或者依赖项发生了深层变化
  if (!ref.current || !isEqual(deps, ref.current.deps)) {
    ref.current = {
      deps,
      value: factory(),
    };
  }

  return ref.current.value;
}

export {
    useDeepMemo
};