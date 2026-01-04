import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek"; // 建议引入以便处理周一为一周开始
import Taro from "@tarojs/taro";
import { setter } from "src/core/store/utils";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { 
  getHistory, PKDay,
  getTodayProgress as apiGetTodayProgress,
  getConfig as apiGetConfig,
  setConfig as apiSetConfig,
  PKDayProgress as apiPKDayProgress
 } from "src/core/http/history";
import { useDeepMemo } from "src/core/hooks/useDeepMemo";
import { isNull } from "lodash";

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

// 配置接口
export interface TrainingConfig {
  targetCount: number;
  mode: 'simple' | 'frequency';
}

// 今日进度接口
export interface TodayProgress {
  currentCount: number;
  targetCount: number;
  isDone: boolean;
}

// Store 状态接口
interface ITrainingState {
  rawList: TrainingRecord[]; // 原始数据（用于列表展示）
  heatmapData: HeatmapItem[]; // 热力图数据（预处理后）
  weeklyData: WeeklyChartItem[]; // 本周柱状图数据（预处理后）
    // [新增] 状态字段
  config: TrainingConfig;
  todayProgress: TodayProgress;
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
      config: { targetCount: 1, mode: 'simple' } as TrainingConfig,
      todayProgress: { currentCount: 0, targetCount: 1, isDone: false } as TodayProgress,
    },
    (set) => ({
      // 基础 Setter
      setRawList: setter("rawList")(set),
      setConfig: setter("config")(set),
      setTodayProgress: setter("todayProgress")(set),
      
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

export const setTodayProgress = (progress: TrainingConfig) => {
  trainingState.getState().setTodayProgress(progress);
};


export const setConfig = (progress: TrainingConfig) => {
  trainingState.getState().setConfig(progress);
};

// React Hook
export const useTraining = () => {
  const store = trainingState();
  const {
    setTodayProgress,
    setConfig,
    config
  } = trainingState();

  // 进度模式打卡按钮
  const addCheckInWithProgress = async () => {
    Taro.showLoading({ title: "打卡中..." });
    try {
      // 1. 调用云函数 (注意：PKDay 现在返回 { code, msg, data: { isDone, currentCount... } })
      const res = await apiPKDayProgress(); 
      
      // 2. 更新今日进度 (无论是否完成，进度都会变)
      if (res && res.data) {
        setTodayProgress({
          currentCount: res.data.currentCount,
          targetCount: res.data.targetCount,
          isDone: res.data.isDone
        });

      

        // 3. 只有当目标真正达成 (isDone=true) 时，才刷新历史列表
        // 或者如果后端逻辑是每次都记录Log，也可以选择每次都刷新，取决于你是否想在列表展示每次Log
        if (res.data.isDone) {
           // 重新拉取历史记录 (全量刷新)
          //  const historyRes = await getHistory();
          //  setTrainingData(historyRes.data);
          await initTraining()
        }
      } else {
        if(res.code == 500){
           Taro.hideLoading();
           Taro.showToast({ title: res.message,icon:"error" });
        }
        // 兜底：如果没有返回详细数据，全量刷新
        await initTraining();
      }

      Taro.hideLoading();
      return true;
    } catch (error) {
      console.error(error);
      Taro.hideLoading();
      Taro.showToast({ title: "打卡失败", icon: "none" });
      return false;
    }
  };

  // 切换模式 ok
  const switchMode = async (newMode: 'simple' | 'frequency') => {
    const newTarget = newMode === 'simple' ? 1 : 2; // 简单模式默认1次，进度模式默认3次(可改)
    
    // 1. 乐观更新本地 UI
    setConfig({
      mode: newMode,
      targetCount: newTarget
    });

    // 2. 调用云函数保存配置
    try {
      await apiSetConfig(newTarget, newMode);
      // 切换模式后，最好重新拉一下进度，因为 target 变了
      const progressRes = await apiGetTodayProgress();
      if(progressRes && progressRes.data) {
        setTodayProgress(progressRes.data);
      }
    } catch (e) {
      console.error("切换模式失败", e);
      Taro.showToast({ title: "设置失败", icon: "none" });
    }
  };

  // 初始化模式 ok
  const createPKData = async  (data:{
    newMode: 'simple' | 'frequency'
  }) => {
    const {newMode} = data;
    
    // 简单模式默认1次，进度模式默认2次(可改) @TODO:其实交给用户但是简单起见先只给两个选项
    const newTarget = newMode === 'simple' ? 1 : 2; 
    
    await apiSetConfig(newTarget, newMode);
    return
  }

  // 按钮是否可点
  const isCheckedIn = useDeepMemo(() => {
    let isDone = false
    const isCheckedInProgress = store.todayProgress.isDone;
    const todayStr = dayjs().format("YYYY-MM-DD");
    const idDoneWithDay = store.rawList.some((item) => item.dateStr === todayStr);
    //如果是 progress模式
    if(store.config.mode == 'simple' ){
       isDone = idDoneWithDay
    }else{
       isDone = isCheckedInProgress
    }
    //如果是 Day模式
    return isDone
  },[store])

  // 进度模式下的 计算进度百分比 (对应你 UI 中的 progressPercent)
  const progressPercent = useDeepMemo(() => {
    const { mode } = store.config;
    const { currentCount, targetCount, isDone } = store.todayProgress;

    if (mode === 'simple') return isDone ? 100 : 0;
    
    // 防止除以0
    if (targetCount === 0) return 0;
    
    return Math.min((currentCount / targetCount) * 100, 100);
  }, [store.config, store.todayProgress]);

  //添加打卡 (业务逻辑封装)
  const addCheckIn = async () => {
    // 如果是进度式
    if(config.mode == 'frequency'){
      await addCheckInWithProgress()
      return;
    }
  
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

  return {
    ...store,
     mode: store.config.mode,
     progress: {
      current: store.todayProgress.currentCount,
      target: store.todayProgress.targetCount,
      progressPercent:progressPercent
    },
    createPKData,
    switchMode,
    addCheckInWithProgress,
    // 计算属性：今日是否已打卡
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
// export const initTraining = async () => {
//   // 确保云能力已初始化 (虽然 initUser 可能做过了，但防守编程)
//   // if (!Taro.cloud) { ... }

//   try {
//     // 调用云函数获取列表
//     const res = await getHistory();
//     setTrainingData(res.data);
//   } catch (e) {
//     console.error("加载训练数据失败", e);
//   }
// };


/**
 * [修改] 初始化加载数据
 * 并行加载：历史记录、配置、今日进度
 */
export const initTraining = async () => {
  try {
    // 使用 Promise.all 并行请求提高速度
    const [historyRes, configRes, progressRes] = await Promise.all([
      getHistory(),
      apiGetConfig(),
      apiGetTodayProgress()
    ]);

    console.log("初始化数据", historyRes)
    // 1. 设置历史记录
    if (historyRes && historyRes.data) {
      setTrainingData(historyRes.data);
    }

    // 2. 设置config 
    if (configRes && configRes.data) {
      setConfig({
        targetCount: configRes.data.targetCount,
        mode: configRes.data.mode
      });
    } else if (isNull(configRes.data)) {
      await apiSetConfig(
        1,
        'simple'
      )
      const configRes = await apiGetConfig()
      setConfig({
        targetCount: configRes.data.targetCount,
        mode: configRes.data.mode
      });
    }

    // 3. 设置今日进度
    if (progressRes && progressRes.data) {
      setTodayProgress(progressRes.data);
    }

  } catch (e) {
    console.error("加载训练数据失败", e);
  }
}