// 仅限两个操作 获取和打卡(新建)

import Taro from "@tarojs/taro";
import dayjs from "dayjs";

const getHistory = async () => {
  const history = await Taro.cloud.callFunction({
    name: "getOpenId",
    data: {
      type: "GET_CHECK_IN_LIST",
      data: {
        startDate: "2025-01-01",
        endDate: "2025-12-31",
      },
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

export { getHistory, PKDay };
