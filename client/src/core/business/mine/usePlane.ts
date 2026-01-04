import Taro from "@tarojs/taro";
import dayjs from "dayjs";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { setter } from "src/core/store/utils";
import { useDeepMemo } from "src/core/hooks/useDeepMemo";
import { 
  createPlan as apiCreatePlan, 
  getPlanList as apiGetPlanList, 
  deletePlan as apiDeletePlan, 
  updatePlan as apiUpdatePlan
} from "src/core/http"; 
import { transformJsonToUiData } from "src/core/utils/planAdapter";
import { useUser } from "./useUser";


const rowDataMock = {
    "_id":'00001',
    "plan_overview": {
      "title": "8周训练",
      "created_at": "2025-11-26"
    },
    "phases": [
      {
        "phase_id": 1,
        "phase_name": "新手适应期",
        "weeks": [1, 2],
        "description": "建立习惯，保护关节和心肺",
        "schedule": {
          "frequency_days_per_week": 5,
          "rest_days_per_week": 2,
          "weekly_pattern_note": "建议周三和周末休息"
        },
        "daily_routine": {
          "aerobic": {
            "warmup": {
              "duration_min": 5,
              "content": "快走 or 原地踏步 + 轻度关节活动"
            },
            "variants": [
              {
                "variant_name": "基础慢跑交替",
                "type": "interval",
                "description": "小碎步慢跑与快走交替",
                "params": {
                  "total_duration_min": { "min": 20, "max": 25 },
                  "interval_run_min": 1,
                  "interval_walk_min": 2,
                  "rounds": { "min": 6, "max": 8 },
                  "continuous_distance_km": null
                },
                "note": "如果1分钟跑太吃力，改为跑0.5分钟+走2.5分钟"
              }
            ]
          },
          "strength": {
            "daily_targets": {
              "pushups_count": { "min": 12, "max": 16 },
              "abs_count": { "min": 24, "max": 30 },
              "plank_sec": { "min": 40, "max": 60 }
            },
            "variants": [
              {
                "variant_name": "标准循环训练",
                "execution_mode": "circuit",
                "circuit_rounds": 2,
                "sessions": [
                  {
                    "session_label": "Main",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 1,
                        "reps": { "min": 6, "max": 8 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "卷腹",
                        "category": "core",
                        "sets": 1,
                        "reps": { "min": 12, "max": 15 },
                        "hold_sec": null,
                        "rest_sec": 30
                      },
                      {
                        "name": "平板支撑",
                        "category": "core_static",
                        "sets": 1,
                        "reps": null,
                        "hold_sec": { "min": 20, "max": 30 },
                        "rest_sec": 30
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        "phase_id": 2,
        "phase_name": "提高期",
        "weeks": [3, 4],
        "description": "逐步增加跑步时间和力量训练总量",
        "schedule": {
          "frequency_days_per_week": 5,
          "rest_days_per_week": 2,
          "weekly_pattern_note": "有氧模式可根据体能二选一"
        },
        "daily_routine": {
          "aerobic": {
            "warmup": {
              "duration_min": 5,
              "content": "快速走路 + 关节活动（踝、膝、髋、肩）"
            },
            "variants": [
              {
                "variant_name": "进阶交替跑 (模式A)",
                "type": "interval",
                "description": "增加单次跑步时长",
                "params": {
                  "total_duration_min": { "min": 25, "max": 30 },
                  "interval_run_min": 2,
                  "interval_walk_min": 2,
                  "rounds": { "min": 6, "max": 7 },
                  "continuous_distance_km": null
                },
                "note": null
              },
              {
                "variant_name": "连续慢跑尝试 (模式B)",
                "type": "continuous",
                "description": "尝试不间断慢跑",
                "params": {
                  "total_duration_min": null,
                  "interval_run_min": null,
                  "interval_walk_min": null,
                  "rounds": null,
                  "continuous_distance_km": { "min": 1.5, "max": 2.0 }
                },
                "note": "速度放慢，能坚持为主"
              }
            ]
          },
          "strength": {
            "daily_targets": {
              "pushups_count": { "min": 40, "max": 60 },
              "abs_count": { "min": 30, "max": 45 },
              "plank_sec": { "min": 90, "max": 120 }
            },
            "variants": [
              {
                "variant_name": "一次性完成 (方案A)",
                "execution_mode": "circuit",
                "circuit_rounds": 3,
                "sessions": [
                  {
                    "session_label": "Main",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 1,
                        "reps": { "min": 10, "max": 12 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "卷腹",
                        "category": "core",
                        "sets": 1,
                        "reps": { "min": 15, "max": 15 },
                        "hold_sec": null,
                        "rest_sec": 30
                      },
                      {
                        "name": "平板支撑",
                        "category": "core_static",
                        "sets": 1,
                        "reps": null,
                        "hold_sec": { "min": 30, "max": 40 },
                        "rest_sec": 30
                      }
                    ]
                  }
                ]
              },
              {
                "variant_name": "早晚拆分 (方案B)",
                "execution_mode": "split",
                "circuit_rounds": 1,
                "sessions": [
                  {
                    "session_label": "Morning",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 2,
                        "reps": { "min": 10, "max": 10 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "卷腹",
                        "category": "core",
                        "sets": 2,
                        "reps": { "min": 15, "max": 15 },
                        "hold_sec": null,
                        "rest_sec": 30
                      }
                    ]
                  },
                  {
                    "session_label": "Evening",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 2,
                        "reps": { "min": 10, "max": 10 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "平板支撑",
                        "category": "core_static",
                        "sets": 2,
                        "reps": null,
                        "hold_sec": { "min": 30, "max": 30 },
                        "rest_sec": 30
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        "phase_id": 3,
        "phase_name": "强化期",
        "weeks": [6, 7, 8],
        "description": "在不受伤的前提下接近最初的目标强度",
        "schedule": {
          "frequency_days_per_week": 5,
          "rest_days_per_week": 2,
          "weekly_pattern_note": "周一/四间歇跑，周二/五持续跑，周三休息"
        },
        "daily_routine": {
          "aerobic": {
            "warmup": {
              "duration_min": 5,
              "content": "快走 + 简单动态拉伸"
            },
            "variants": [
              {
                "variant_name": "高强度间歇 (模式A)",
                "type": "interval",
                "description": "增加跑步时长比例",
                "params": {
                  "total_duration_min": { "min": 25, "max": 30 },
                  "interval_run_min": 3,
                  "interval_walk_min": 2,
                  "rounds": { "min": 5, "max": 6 },
                  "continuous_distance_km": null
                },
                "note": null
              },
              {
                "variant_name": "长距离慢跑 (模式B)",
                "type": "continuous",
                "description": "耐力训练",
                "params": {
                  "total_duration_min": null,
                  "interval_run_min": null,
                  "interval_walk_min": null,
                  "rounds": null,
                  "continuous_distance_km": { "min": 2.0, "max": 3.0 }
                },
                "note": "尽量连续跑完，中间可走路恢复"
              }
            ]
          },
          "strength": {
            "daily_targets": {
              "pushups_count": { "min": 60, "max": 100 },
              "abs_count": { "min": 45, "max": 80 },
              "plank_sec": { "min": 120, "max": 240 }
            },
            "variants": [
              {
                "variant_name": "一次性完成 (方案A)",
                "execution_mode": "circuit",
                "circuit_rounds": 3,
                "sessions": [
                  {
                    "session_label": "Main",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 1,
                        "reps": { "min": 15, "max": 20 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "卷腹",
                        "category": "core",
                        "sets": 1,
                        "reps": { "min": 15, "max": 20 },
                        "hold_sec": null,
                        "rest_sec": 30
                      },
                      {
                        "name": "平板支撑",
                        "category": "core_static",
                        "sets": 1,
                        "reps": null,
                        "hold_sec": { "min": 40, "max": 60 },
                        "rest_sec": 30
                      }
                    ]
                  }
                ]
              },
              {
                "variant_name": "早晚拆分 (方案B)",
                "execution_mode": "split",
                "circuit_rounds": 1,
                "sessions": [
                  {
                    "session_label": "Morning",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 3,
                        "reps": { "min": 15, "max": 15 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "卷腹",
                        "category": "core",
                        "sets": 2,
                        "reps": { "min": 20, "max": 20 },
                        "hold_sec": null,
                        "rest_sec": 30
                      }
                    ]
                  },
                  {
                    "session_label": "Evening",
                    "exercises": [
                      {
                        "name": "俯卧撑",
                        "category": "push",
                        "sets": 2,
                        "reps": { "min": 15, "max": 15 },
                        "hold_sec": null,
                        "rest_sec": 60
                      },
                      {
                        "name": "平板支撑",
                        "category": "core_static",
                        "sets": 3,
                        "reps": null,
                        "hold_sec": { "min": 40, "max": 60 },
                        "rest_sec": 30
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      }
    ]
};

const custom = {
    "_id":'00011',
    "plan_overview": {
      "title": "我的自定义计划",
      "created_at": "2025-11-26"
    },
    "phases": [
    ]
};
  

// ---------------------------------------------------------
// 1. 接口定义 (Interface)
// ---------------------------------------------------------

export interface PlanOverview {
  title: string;
  created_at: string;
}

// 数据库原始结构
export interface PlanRecord {
  _id: string;
  _openid?: string;
  plan_overview: PlanOverview;
  phases: any[]; // 这里是你复杂的 JSON 结构
  createTime?: number;
}

// UI 展示用的结构 (经过 transform 后的)
export interface UIPlan {
  meta: {
    title: string;
    date: string;
  };
  phases: any[]; // 转换后的 UI Card 数据
}

// Store 状态
interface IPlanState {
  rawPlans: PlanRecord[];   // 所有的计划列表 (原始数据)
  activePlanId: string | number;     // 当前选中的 Tab ID
}

// ---------------------------------------------------------
// 2. Zustand Store
// ---------------------------------------------------------

const planState = create(
  combine(
    {
      rawPlans: [] as PlanRecord[],
      activePlanId: 0 || '00001', // 默认空，加载后选中第一个
      editTempData: {} as  any
    },
    (set, get) => ({
      // 基础 Setters
      setRawPlans: setter("rawPlans")(set),
      setActivePlanId: setter("activePlanId")(set),
      setEditTempData: setter("editTempData")(set),

      // 批量更新数据 (加载列表后调用)
      setPlanList: (list: PlanRecord[] = []) => {
        // 如果当前没有选中的 ID，且列表不为空，默认选中第一个
        const currentId = get().activePlanId;
        const defaultId = currentId && list.length > 0 ? list[0]._id : currentId;
        
        
        set({
          rawPlans: list,
          activePlanId: defaultId || ""
        });
      },

      // 乐观更新：新增
      optimisticAdd: (newPlan: PlanRecord) => {
        set((state) => ({
          rawPlans: [newPlan, ...state.rawPlans], // 新增的排前面
          activePlanId: newPlan._id // 自动切到新计划
        }));
      },

      // 乐观更新：删除
      optimisticRemove: (id: string) => {
        set((state) => {
          const newList = state.rawPlans.filter(p => p._id !== id);
          // 如果删的是当前选中的，切到列表第一个
          let newActiveId = state.activePlanId;
          if (id === state.activePlanId) {
            newActiveId = newList.length > 0 ? newList[0]._id : "";
          }
          return { rawPlans: newList, activePlanId: newActiveId };
        });
      }
    })
  )
);

// ---------------------------------------------------------
// 3. Hooks (React Component 使用)
// ---------------------------------------------------------

export const usePlan = () => {
  const {userInfo} = useUser()
  const {_openid} = userInfo
  const store = planState();

  // ---------------------------------------------
  // Computed 1: 生成 Tabs 列表
  // ---------------------------------------------
  const _rawPlans = useDeepMemo(() => {
    return  [...store.rawPlans, {...rowDataMock,_openid}, {...custom,_openid}];
  },[store.rawPlans]);

  const tabs = useDeepMemo(() => {
    return _rawPlans.map(plan => ({
      key: plan._id,
      label: plan.plan_overview?.title || "未命名计划"
    }));
  }, [_rawPlans]);

  // ---------------------------------------------
  // Computed 2: 获取当前选中的计划并转换 (核心需求)
  // ---------------------------------------------
  const currentUIPlan = useDeepMemo(() => {
    // 1. 找到当前选中的原始对象
    const rawTarget = _rawPlans.find(p => p._id === store.activePlanId);
    
    if (!rawTarget) return null;

    // 2. 执行你写好的转换逻辑
    // 注意：这里复用了 plan_overview 作为 meta
    return {
      meta: {
        title: rawTarget.plan_overview.title,
        date: rawTarget.plan_overview.created_at || "未知日期"
      },
      // 调用你的转换函数
      phases: transformJsonToUiData(rawTarget) 
    } as UIPlan;

  }, [_rawPlans, store.activePlanId]); // 只有当列表变了或切 Tab 时才重新计算

  // ---------------------------------------------
  // Actions (CRUD)
  // ---------------------------------------------

  /**
   * 初始化：获取列表
   */
  const initPlans = async () => {
    try {
      const res = await apiGetPlanList(); // 调用云函数
      // 假设回包结构: { code: 0, data: [...] }
      store.setPlanList(res.data);
    } catch (e) {
      console.error("Fetch plans failed", e);
      Taro.showToast({ title: "加载计划失败", icon: "none" });
    }
  };

  /**
   * 新增计划
   */
  const createNewPlan = async (data) => {
    Taro.showLoading({ title: "创建中..." });
    try {
      // 构造一个默认的新计划结构
      const newPlanPayload = {
        plan_overview: {
          title: `我的新计划 ${dayjs().format("MM-DD")}`,
          created_at: dayjs().format("YYYY-MM-DD")
        },
        phases: [], // 初始为空
        ...data
      };

      const res = await apiCreatePlan(newPlanPayload);
      
      // 乐观更新或重新拉取，这里演示重新拉取
      await initPlans(); 
      
      // 也可以手动构造对象调 store.optimisticAdd({...newPlanPayload, _id: res._id})
      
      Taro.hideLoading();
      Taro.showToast({ title: "创建成功", icon: "success" });
    } catch (e) {
      Taro.hideLoading();
      console.error(e);
    }
  };

  /**
   * 删除当前计划
   */
  const deleteCurrentPlan = async () => {
    if (!store.activePlanId) return;

    Taro.showModal({
      title: "确认删除",
      content: "删除后无法恢复，确定吗？",
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: "删除中" });
          try {
            const nextId = _rawPlans.findIndex((t) => t._id == store.activePlanId ) + 1
            await apiDeletePlan(store.activePlanId);
            store.optimisticRemove(store.activePlanId);
            //删除之后向后选一个ID
            store.setActivePlanId(_rawPlans[nextId]._id);
            Taro.hideLoading();
          } catch (e) {
            Taro.hideLoading();
            Taro.showToast({ title: "删除失败", icon: "none" });
          }
        }
      }
    });
  };

  /**
   * 编辑当前计划 @TODO:
   */
  const updatePlane = async (data) => {
    Taro.showLoading({ title: "编辑中..." });
    try {
      await apiUpdatePlan(data._id, data)
      await initPlans();
      Taro.navigateBack()
    } catch (error) {
      console.error('Error',error)
    } finally {
      Taro.hideLoading();
    }
  }

  /**
   * 前置的编辑计划路由 Jump
   */
  const jump2Edit = (activePlanId) => {
    const itemData = store.rawPlans.find(item => item._id == activePlanId)
    store.setEditTempData(itemData)
    
    Taro.navigateTo({
      url:"/pages/planeEdit/index"
    })
  }

  return {
    ...store,
    tabs,            // 供 Tab 组件使用
    currentUIPlan,   // 供页面渲染详情使用 (已转换)
    initPlans,
    createNewPlan,
    deleteCurrentPlan,
    updatePlane,
    jump2Edit
    // 如果需要切换 Tab，直接解构出 setActivePlanId 即可
  };
};