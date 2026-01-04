// 仅限两个操作 获取和打卡(新建)

import Taro from "@tarojs/taro";
import dayjs from "dayjs";

// 云函数名称常量，保持和你示例一致
const CLOUD_NAME = "getOpenId"; 
/**
 * [新增] 设置打卡配置
 * 对应云函数: SET_CONFIG
 */
const setConfig = async (targetCount, mode = 'simple') => {
  const result = await Taro.cloud.callFunction({
    name: CLOUD_NAME,
    data: {
      type: "PK_SET_CONFIG",
      data: {
        targetCount,
        mode
      },
    },
  });
  return result.result as any;
};

/**
 * [新增] 获取打卡配置
 * 对应云函数: GET_CONFIG
 */
const getConfig = async () => {
  const result = await Taro.cloud.callFunction({
    name: CLOUD_NAME,
    data: {
      type: "PK_GET_CONFIG",
      data: {},
    },
  });

  return result.result as any;
};

/**
 * [新增] 获取今日打卡进度
 * 对应云函数: GET_TODAY_PROGRESS
 * 用于前端判断显示 "进行中 (1/3)" 还是 "已完成"
 */
const getTodayProgress = async () => {
  const result = await Taro.cloud.callFunction({
    name: CLOUD_NAME,
    data: {
      type: "PK_GET_TODAY_PROGRESS",
      data: {
        dateStr: dayjs().format("YYYY-MM-DD"),
      },
    },
  });

  return result.result as any;
};

const PKDayProgress = async () => {
  const result = await Taro.cloud.callFunction({
    name: CLOUD_NAME,
    data: {
      type: "PK_ADD_LOG",
      data: {
        dateStr: dayjs().format("YYYY-MM-DD"),
        duration:45,
        comment:"状态很好"
      },
    },
  });

  return result.result as any;
};

const getHistory = async () => {
  const anchor = dayjs();
  const startDate = anchor.subtract(1, 'month').format('YYYY-MM-DD'); // 往前一个月
  const endDate = anchor.add(1, 'month').format('YYYY-MM-DD');        // 往后一个月

  const history = await Taro.cloud.callFunction({
    name: "getOpenId",
    data: {
      type: "GET_CHECK_IN_LIST",
      data: {startDate,endDate,},
    },
  });
  const res = history as any;
  return res.result;
};

const PKDay = async () => {
  const history = await Taro.cloud.callFunction({
    name: "getOpenId",
    data: {
      type: "ADD_CHECK_IN",
      data: {
        dateStr: dayjs().format("YYYY-MM-DD"),
        duration: 45,
        comment: "状态不错",
      },
    },
  });
  const res = history as any;
  return res.result;
};
//打卡系统迭代

export { getHistory, PKDay,PKDayProgress, getTodayProgress, getConfig, setConfig  };
