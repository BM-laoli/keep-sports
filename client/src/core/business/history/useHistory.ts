import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek"; // 建议引入以便处理周一为一周开始
import Taro from "@tarojs/taro";
import { setter } from "src/core/store/utils";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { getHistory, PKDay } from "src/core/http/history";
import { useDeepMemo } from "src/core/hooks/useDeepMemo";

// 注册 dayjs 插件 (可选，为了更好的周处理)
dayjs.extend(isoWeek);

// ---------------------------------------------------------
// 1. 接口定义 (Interface)
// ---------------------------------------------------------

// 单条打卡记录结构 (对应数据库)
export interface TrainingRecord {
  _id: string;
  _openid: string;
  dateStr: string; // "2025-02-20"
  createTime: number;
  duration: number;
  comment: string;
  isDone: boolean;
}

// 热力图单元格数据
export interface HeatmapItem {
  date: string;
  isDone: boolean;
}

// 周统计图表数据
export interface WeeklyChartItem {
  day: string;
  value: number;
}

// Store 状态接口
interface ITrainingState {
  rawList: TrainingRecord[]; // 原始数据（用于列表展示）
  heatmapData: HeatmapItem[]; // 热力图数据（预处理后）
  weeklyData: WeeklyChartItem[]; // 本周柱状图数据（预处理后）
}

// ---------------------------------------------------------
// 2. 工具函数 (Utils)
// ---------------------------------------------------------

/**
 * 获取指定年份的所有日期
 */
const getAllDaysInYear = (year: number | string) => {
  const startDate = dayjs(`${year}-01-01`);
  const dates: string[] = [];
  let current = startDate;

  // 循环直到年份变更
  while (current.year() == year) {
    dates.push(current.format("YYYY-MM-DD"));
    current = current.add(1, "day");
  }
  return dates;
};

/**
 * 处理热力图数据：将服务端记录映射到全年的日历中
 */
const processHeatmapData = (serverData: TrainingRecord[]): HeatmapItem[] => {
  // 1. 创建查找 Map，O(1) 复杂度
  const doneMap: Record<string, boolean> = {};
  serverData.forEach((item) => {
    doneMap[item.dateStr] = true;
  });

  // 2. 生成 2025 全年数据 (根据实际情况，这里可以用 dayjs().year() 动态获取)
  const currentYear = dayjs().year();
  const yearData = getAllDaysInYear(currentYear);

  const uiData = yearData.map((dateStr) => ({
    date: dateStr,
    isDone: !!doneMap[dateStr],
  }));

  return uiData;
};

/**
 * 处理周数据：筛选出【本周】的数据并聚合成图表格式
 */
const processWeeklyData = (serverData: TrainingRecord[]): WeeklyChartItem[] => {
  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  // 初始化 0
  const chartData = weekDays.map((day) => ({ day, value: 0 }));

  // 获取本周的开始和结束日期，用于过滤
  const startOfWeek = dayjs().startOf("isoWeek"); // 周一
  const endOfWeek = dayjs().endOf("isoWeek"); // 周日

  serverData.forEach((item) => {
    const itemDate = dayjs(item.dateStr);

    // 1. 只统计本周的数据 (如果不需要过滤，去掉这个 if 即可)
    if (
      itemDate.isAfter(startOfWeek.subtract(1, "day")) &&
      itemDate.isBefore(endOfWeek.add(1, "day"))
    ) {
      // 2. 计算周几 (isoWeekday: 1=周一 ... 7=周日)
      // 数组下标 = isoWeekday - 1
      const dayIndex = itemDate.isoWeekday() - 1;

      if (chartData[dayIndex]) {
        chartData[dayIndex].value += item.duration;
      }
    }
  });

  return chartData;
};

// ---------------------------------------------------------
// 3. Zustand Store 定义
// ---------------------------------------------------------

const trainingState = create(
  combine(
    {
      rawList: [] as TrainingRecord[],
      heatmapData: [] as HeatmapItem[],
      weeklyData: [] as WeeklyChartItem[],
    },
    (set) => ({
      // 基础 Setter
      setRawList: setter("rawList")(set),

      // 核心动作：更新所有数据（通常在网络请求回来后调用）
      setTrainingData: (list: TrainingRecord[]) => {
        set({
          rawList: list,
          heatmapData: processHeatmapData(list),
          weeklyData: processWeeklyData(list),
        });
      },

      // 乐观更新：用户点击打卡后，手动推入一条，不用等网络
      optimisticAdd: (record: TrainingRecord) => {
        set((state) => {
          const newList = [...state.rawList, record];
          return {
            rawList: newList,
            heatmapData: processHeatmapData(newList),
            weeklyData: processWeeklyData(newList),
          };
        });
      },
    })
  )
);

// ---------------------------------------------------------
// 4. Hooks & Actions (Exported)
// ---------------------------------------------------------

// 暴露给外部直接修改 Store 的方法
export const setTrainingData = (list: TrainingRecord[]) => {
  trainingState.getState().setTrainingData(list);
};

// React Hook
export const useTraining = () => {
  const store = trainingState();

  /**
   * 添加打卡 (业务逻辑封装)
   */
  const addCheckIn = async () => {
    Taro.showLoading({ title: "打卡中..." });
    try {
      // 1. 调用云函数
      await PKDay();

      // 2. 刷新列表 (或者后端直接返回最新的一条，前端做乐观更新)
      await initTraining();

      Taro.hideLoading();
      return true;
    } catch (error) {
      console.error(error);
      Taro.hideLoading();
      Taro.showToast({ title: "打卡失败", icon: "none" });
      return false;
    }
  };

  const totalDays = useDeepMemo(() => {
    return store.heatmapData.filter(item => item.isDone).length || 1
  },[store.heatmapData])

  const isCheckedIn = useDeepMemo(() => {
    // 1. 获取今天的标准日期字符串 "2025-02-20"
    const todayStr = dayjs().format("YYYY-MM-DD");

    // 2. 遍历原始列表，查找是否存在今天的记录
    // 使用 .some() 方法，找到一个即返回 true，效率较高
    return store.rawList.some((item) => item.dateStr === todayStr);
  }, [store.rawList]);

  return {
    ...store,
    // 计算属性：今日是否已打卡
    isTodayDone:
      store.heatmapData.find((h) => h.date === dayjs().format("YYYY-MM-DD"))
        ?.isDone || false,
    // 计算属性：总打卡天数
    totalDays: totalDays,
    // 动作
    addCheckIn,
    refresh: initTraining,
    isCheckedIn
  };
};

/**
 * 初始化加载数据
 */
export const initTraining = async () => {
  // 确保云能力已初始化 (虽然 initUser 可能做过了，但防守编程)
  // if (!Taro.cloud) { ... }

  try {
    // 调用云函数获取列表
    const res = await getHistory();
    setTrainingData(res.data);
  } catch (e) {
    console.error("加载训练数据失败", e);
  }
};
