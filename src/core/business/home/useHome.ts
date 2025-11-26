import { setter } from "src/core/store/utils";
import { create } from "zustand";
import { combine } from "zustand/middleware";

interface InterTabList {
  title: string;
  iconType: string;
  key: string;
  component?: () => JSX.Element;
}
interface IHomeSate {
  active: number;
  tabList: Array<InterTabList>;
}
interface IHomeAction {
  setActive: (index: number | Function) => void;
}

const TABLIST: Array<InterTabList> = [
  {
    title: "首页",
    iconType: "bullet-list",
    key: "Home",
  },
  {
    title: "训练历史",
    iconType: "camera",
    key: "History",
  },
  { title: "我的", iconType: "folder", key: "Mime" },
];

const DEFAULT_TAB = 0; // 默认选中的tab 默认是0

const homeState = create(
  combine<IHomeSate, IHomeAction>(
    {
      active: DEFAULT_TAB,
      tabList: TABLIST,
    },
    (set) => ({
      setActive: setter("active")(set),
    })
  )
);

const useHome = () => {
  // 所有逻辑在这里聚合
  const { tabList, active, setActive } = homeState();

  const onActiveChange = (idex: number) => {
    setActive(idex);
  };

  return {
    active,
    tabList,
    onActiveChange,
  };
};

export { useHome };
