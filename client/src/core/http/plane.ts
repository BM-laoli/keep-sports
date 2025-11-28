import Taro from "@tarojs/taro";

// ---------------------------------------------------------
// 1. 获取计划列表 (READ)
// ---------------------------------------------------------
const getPlanList = async () => {
  const result = await Taro.cloud.callFunction({
    name: "getOpenId", // 你的主入口云函数名
    data: {
      type: "GET_PLAN_LIST",
      data: {}, // 获取列表通常不需要额外参数，除非你要做分页
    },
  });
  const res = result as any;
  return res.result;
};

// ---------------------------------------------------------
// 2. 创建新计划 (CREATE)
// ---------------------------------------------------------
// planData 应该是包含了 plan_overview, phases 等完整结构的 JSON 对象
const createPlan = async (planData: any) => {
  const result = await Taro.cloud.callFunction({
    name: "getOpenId",
    data: {
      type: "CREATE_PLAN",
      data: planData, 
    },
  });
  const res = result as any;
  return res.result;
};

// ---------------------------------------------------------
// 3. 更新计划 (UPDATE)
// ---------------------------------------------------------
const updatePlan = async (id: string, planData: any) => {
  const result = await Taro.cloud.callFunction({
    name: "getOpenId",
    data: {
      type: "UPDATE_PLAN",
      data: {
        _id: id,
        ...planData, // 合并 ID 和更新的数据
      },
    },
  });
  const res = result as any;
  return res.result;
};

// ---------------------------------------------------------
// 4. 删除计划 (DELETE)
// ---------------------------------------------------------
const deletePlan = async (id: string) => {
  const result = await Taro.cloud.callFunction({
    name: "getOpenId",
    data: {
      type: "DELETE_PLAN",
      data: {
        _id: id,
      },
    },
  });
  const res = result as any;
  return res.result;
};

export { getPlanList, createPlan, updatePlan, deletePlan };