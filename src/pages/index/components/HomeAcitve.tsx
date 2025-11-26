import { View,Text } from "@tarojs/components";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { transformJsonToUiData } from "src/core/utils/planAdapter";
import { PlanEditor } from "./PlanEditor/PlanEditor";

interface Exercise {
  name: string;
  meta: string;
}

interface Session {
  label?: string;
  exercises: Exercise[];
}

interface Param {
  icon: string;
  text: string;
}

interface Variant {
  tag: string;
  title: string;
  desc?: string;
  params?: Param[];
  note?: string;
  sessions?: Session[];
}

interface Target {
  value: string;
  label: string;
}

interface Routine {
  type: 'aerobic' | 'strength';
  title: string;
  icon: string;
  warmup?: { title: string; content: string };
  targets?: Target[];
  variants: Variant[];
}

interface Schedule {
  trainDays: number;
  restDays: number;
  note: string;
}

interface PhaseData {
  id: string;
  phaseNum: string;
  title: string;
  desc: string;
  isOpen?: boolean;
  schedule: Schedule;
  routines: Routine[];
}

// 2. 静态数据 (Data)
const PLAN_DATA: PhaseData[] = [
  {
    id: 'p1',
    phaseNum: 'Phase 1',
    title: '新手适应期',
    desc: '建立习惯，保护关节 (第 1,2 周)',
    isOpen: true,
    schedule: {
      trainDays: 5,
      restDays: 2,
      note: '📅 建议周三和周末休息',
    },
    routines: [
      {
        type: 'aerobic',
        title: '有氧训练',
        icon: '❤️',
        warmup: { title: '🔥 热身 (5分钟)', content: '快走 or 原地踏步 + 轻度关节活动' },
        variants: [
          {
            tag: '间歇跑',
            title: '基础慢跑交替',
            desc: '小碎步慢跑与快走交替',
            params: [
              { icon: '⏱', text: '20-25分' },
              { icon: '🏃', text: '跑1分' },
              { icon: '🚶', text: '走2分' },
              { icon: '🔄', text: '6-8组' },
            ],
            note: '💡 如果1分钟跑太吃力，改为跑0.5分钟+走2.5分钟',
          },
        ],
      },
      {
        type: 'strength',
        title: '力量训练',
        icon: '💪',
        targets: [
          { value: '12-16', label: '俯卧撑' },
          { value: '24-30', label: '卷腹' },
          { value: '40-60s', label: '平板' },
        ],
        variants: [
          {
            tag: '循环',
            title: '标准循环训练',
            desc: '大循环: 2 轮',
            sessions: [
              {
                label: '主训练',
                exercises: [
                  { name: '俯卧撑', meta: '1组 × 6-8次 (休60s)' },
                  { name: '卷腹', meta: '1组 × 12-15次 (休30s)' },
                  { name: '平板支撑', meta: '1组 × 20-30秒 (休30s)' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p2',
    phaseNum: 'Phase 2',
    title: '提高期',
    desc: '逐步增加强度 (第 3,4 周)',
    isOpen: false,
    schedule: {
      trainDays: 5,
      restDays: 2,
      note: '📅 有氧模式可根据体能二选一',
    },
    routines: [
      {
        type: 'aerobic',
        title: '有氧训练',
        icon: '❤️',
        warmup: { title: '🔥 热身 (5分钟)', content: '快速走路 + 关节活动' },
        variants: [
          {
            tag: '间歇跑',
            title: '进阶交替跑 (模式A)',
            params: [
              { icon: '⏱', text: '25-30分' },
              { icon: '🏃', text: '跑2分' },
              { icon: '🚶', text: '走2分' },
            ],
          },
          {
            tag: '连续跑',
            title: '连续慢跑尝试 (模式B)',
            params: [{ icon: '📍', text: '1.5-2.0km' }],
            note: '💡 速度放慢，能坚持为主',
          },
        ],
      },
      {
        type: 'strength',
        title: '力量训练',
        icon: '💪',
        targets: [
          { value: '40-60', label: '俯卧撑' },
          { value: '30-45', label: '卷腹' },
          { value: '90-120s', label: '平板' },
        ],
        variants: [
          {
            tag: '循环',
            title: '一次性完成 (方案A)',
            desc: '大循环: 3 轮',
            sessions: [
              {
                exercises: [
                  { name: '俯卧撑', meta: '1组 × 10-12次' },
                  { name: '卷腹', meta: '1组 × 15次' },
                  { name: '平板', meta: '1组 × 30-40秒' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p3',
    phaseNum: 'Phase 3',
    title: '强化期',
    desc: '接近目标强度 (第 6,7,8 周)',
    isOpen: false,
    schedule: {
      trainDays: 5,
      restDays: 2,
      note: '📅 周一/四间歇跑，周二/五持续跑',
    },
    routines: [
      {
        type: 'aerobic',
        title: '有氧训练',
        icon: '❤️',
        warmup: { title: '🔥 热身 (5分钟)', content: '快走 + 简单动态拉伸' },
        variants: [
          {
            tag: '间歇跑',
            title: '高强度间歇 (模式A)',
            params: [
              { icon: '⏱', text: '25-30分' },
              { icon: '🏃', text: '跑3分' },
              { icon: '🚶', text: '走2分' },
              { icon: '🔄', text: '5-6组' },
            ],
          },
          {
            tag: '连续跑',
            title: '长距离慢跑 (模式B)',
            params: [{ icon: '📍', text: '2.0-3.0km' }],
            note: '💡 尽量连续跑完，中间可走路恢复',
          },
        ],
      },
      {
        type: 'strength',
        title: '力量训练',
        icon: '💪',
        targets: [
          { value: '60-100', label: '俯卧撑' },
          { value: '45-80', label: '卷腹' },
          { value: '120-240s', label: '平板' },
        ],
        variants: [
          {
            tag: '循环',
            title: '一次性完成 (方案A)',
            desc: '大循环: 3 轮',
            sessions: [
              {
                exercises: [
                  { name: '俯卧撑', meta: '1组 × 15-20次' },
                  { name: '卷腹', meta: '1组 × 15-20次' },
                  { name: '平板', meta: '1组 × 40-60秒' },
                ],
              },
            ],
          },
          {
            tag: '分化',
            title: '早晚拆分 (方案B)',
            desc: '早晚各练',
            sessions: [
              {
                label: 'Morning',
                exercises: [
                  { name: '俯卧撑', meta: '3组 × 15次' },
                  { name: '卷腹', meta: '2组 × 20次' },
                ],
              },
              {
                label: 'Evening',
                exercises: [
                  { name: '俯卧撑', meta: '2组 × 15次' },
                  { name: '平板', meta: '3组 × 40-60秒' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// 3. 组件 (Components)
export const Badge: React.FC<{ text: string; type?: 'blue' }> = ({ text, type = 'blue' }) => (
  // span -> View (为了更好的控制 padding 和圆角，View 比 Text 更稳)
  <View className={`badge badge-${type}`}>
    <Text>{text}</Text>
  </View>
);

export const StatBox: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <View className="stat-box">
    <View className="stat-value">{value}</View>
    <View className="stat-label">{label}</View>
  </View>
);

export const WarmupBox: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <View className="warmup-box">
    {/* 这里的 title 和 content 建议用 Text 包裹，或者 View 也可以，取决于 CSS 是否是 block */}
    <View className="warmup-title">{title}</View>
    <View className="warmup-content">{content}</View>
  </View>
);

export const TargetGrid: React.FC<{ targets: Target[] }> = ({ targets }) => (
  <View className="targets-grid">
    {targets.map((t, i) => (
      <View key={i} className="target-item">
        <View className="target-val">{t.value}</View>
        <View className="target-lbl">{t.label}</View>
      </View>
    ))}
  </View>
);

export const SessionBlock: React.FC<{ session: Session }> = ({ session }) => (
  <View className="session-block">
    {session.label && <View className="session-label">{session.label}</View>}
    {session.exercises.map((ex, i) => (
      <View key={i} className="exercise-row">
        <Text className="ex-name">{ex.name}</Text>
        <Text className="ex-meta">{ex.meta}</Text>
      </View>
    ))}
  </View>
);

export const VariantItem: React.FC<{ variant: Variant }> = ({ variant }) => (
  <View className="variant-item">
    <View className="variant-tag">{variant.tag}</View>
    <View className="variant-title">{variant.title}</View>
    
    {variant.desc && <View className="variant-desc">{variant.desc}</View>}
    
    {variant.params && (
      <View className="params-list">
        {variant.params.map((p, i) => (
          <View key={i} className="param-pill">
            {/* 在 Taro 中，文本最好显式包裹在 Text 中，避免纯文本节点在某些端渲染异常 */}
            <Text>{p.icon}</Text> 
            <Text style={{ marginLeft: '4px' }}>{p.text}</Text>
          </View>
        ))}
      </View>
    )}

    {variant.sessions && variant.sessions.map((s, i) => (
      <SessionBlock key={i} session={s} />
    ))}

    {variant.note && <View className="note-box">{variant.note}</View>}
  </View>
);

// 4. 页面 (Page)

const RoutineCard: React.FC<{ routine: Routine }> = ({ routine }) => (
  <View className="routine-card">
    <View className="card-header">
      <View className="card-icon">
        <Text>{routine.icon}</Text>
      </View>
      <View className="card-title">{routine.title}</View>
    </View>
    
    {routine.warmup && <WarmupBox {...routine.warmup} />}
    {routine.targets && <TargetGrid targets={routine.targets} />}
    
    <View className="variant-container">
      {routine.variants.map((v, i) => (
        <VariantItem key={i} variant={v} />
      ))}
    </View>
  </View>
);

const PhaseCard: React.FC<{ phase: PhaseData }> = ({ phase }) => {
  // Taro 不支持 <details>，使用 State 手动控制展开/收起
  const [isOpen, setIsOpen] = useState(phase.isOpen || false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <View className={`phase-card ${isOpen ? 'is-open' : ''}`}>
      {/* 头部点击区域 */}
      <View className="phase-summary" onClick={toggleOpen}>
        <View className="phase-header-content">
          <View className="phase-title-row">
            <Badge text={phase.phaseNum} />
            <Text className="title-text">{phase.title}</Text>
          </View>
          <View className="phase-desc">{phase.desc}</View>
        </View>
        
        {/* 纯 CSS 实现的箭头，替代 SVG */}
        <View className="chevron-arrow" />
      </View>
      
      {/* 内容区域，根据 isOpen 判断渲染 */}
      {isOpen && (
        <View className="phase-body">
          <View className="section-title">日程安排</View>
          <View className="schedule-grid">
            <StatBox value={phase.schedule.trainDays} label="训练天数/周" />
            <StatBox value={phase.schedule.restDays} label="休息天数/周" />
            <View className="stat-note">{phase.schedule.note}</View>
          </View>

          <View className="section-title">每日训练内容</View>
          <View className="routine-container">
            {phase.routines.map((routine, i) => (
              <RoutineCard key={i} routine={routine} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

// 5. 主页面组件 (Main Page)

const TrainingPlan: React.FC = () => {
  return (
    <View className="training-plan-page">
      <View className="plan-header">
        <View className="main-title">8周进阶训练计划</View>
        <View className="meta">创建于: 2025-11-26</View>
      </View>

      {/* 假设 PLAN_DATA 已经定义或从 props 传入 */}
      {PLAN_DATA.map((phase) => (
        <PhaseCard key={phase.id} phase={phase} />
      ))}
    </View>
  );
};


// 切换tabe的组件
interface TabItem {
  key: string;
  label: string;
}

interface Props {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

const PlanTabs: React.FC<Props> = ({ tabs, activeKey, onChange }) => {
  return (
    <View className="plan-tabs-container">
      {tabs.map((tab) => (
        <View
          key={tab.key}
          className={`tab-item ${activeKey === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          <Text className="tab-text">{tab.label}</Text>
          {/* 激活时的底部指示条 */}
          {activeKey === tab.key && <View className="active-line" />}
        </View>
      ))}
    </View>
  );
};

const rowDataMock = {
  "plan_overview": {
    "title": "8周进阶跑步与力量训练计划",
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

const DATA_SOURCE = {
  '8week': {
    meta: { title: '8周进阶训练计划', date: '2025-11-26' },
    data: rowDataMock // 使用你提供的真实 JSON
  },
  '2week': {
    meta: { title: '2周极速减脂计划', date: '2025-12-01' },
    data: { ...rowDataMock, phases: [rowDataMock.phases[0]] } // 偷懒模拟：只取第一阶段
  },
  'custom': {
    meta: { title: '我的自定义计划', date: '2025-12-05' },
    data: {...rowDataMock, phases: [] } // 空数据，用于展示空状态
  }
};

const TABS = [
  { key: '8week', label: '8周进阶' },
  { key: '2week', label: '2周极速' },
  { key: 'custom', label: '自定义' },
];

const HomeActive = () => {
  
  const [activeTab, setActiveTab] = useState('8week');

  // 使用 useMemo 缓存转换后的数据，避免每次渲染都重新计算
  const currentPlan = useMemo(() => {
    const source = DATA_SOURCE[activeTab];
    return {
      meta: source.meta,
      phases: transformJsonToUiData(source.data)
    };
  }, [activeTab]);
  
  useEffect(()=>{
    console.log('初始化')
  },[])

  return (
    <View className="training-plan-page">
    {/* 1. 顶部固定 Tabs */}
    <View className="sticky-header">
      <PlanTabs 
        tabs={TABS} 
        activeKey={activeTab} 
        onChange={setActiveTab} 
      />
    </View>

    {/* 2. 计划标题信息 */}
    <View className="plan-header">
      <View className="main-title">{currentPlan.meta.title}</View>
      <View className="meta">创建于: {currentPlan.meta.date}</View>
    </View>

    {/* 3. 计划列表内容 */}
    <View className="plan-content">
      {currentPlan.phases.length > 0 ? (
        currentPlan.phases.map((phase) => (
          // 这里使用之前定义的 PhaseCard 组件
          <PhaseCard key={phase.id} phase={phase} />
        ))
      ) : (
        // 空状态展示
        <View className="empty-state">
          <View className="empty-icon">📝</View>
          <View className="empty-text">暂无自定义计划，去创建一个吧！(施工中)</View>
        </View>
        // <PlanEditor></PlanEditor> // 最好还是单独一个页面好啦 很强大
      )}
    </View>
  </View>
  )

    return (
      <View style={styles.homeActive}>
        <TrainingPlan />
        {/* <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View>  */}
        {/* <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View> 
        <View style={styles.viewBox}></View>  */}
      </View>
    )
}

const styles:{
  [key:string]: CSSProperties
} = {
    homeActive: {
      height: '100%', 
      // height:1024,
      // backgroundColor: 'royalblue'
      // paddingTop:20
    },
    viewBox: {
      height:100,
      width:375,
      backgroundColor: 'skyblue',
      borderBottom: '4px solid #ccc'
    }
}
export {
  HomeActive
}