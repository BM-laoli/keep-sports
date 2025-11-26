# 设计风格
对其 Dribbble 设计风格，有一些带浮动的卡片效果 + 圆角效果

# 设计内容
1.主题是展示 健身方案

2.一级条目展示 健身方案 我们有许多方案可选， title he create_at 需要展示出来 它们是 phaplan_overview 里的 ，

3.点击一级条目展开二级内容，展示完成这个训练计划需要份几个阶段 是一个list 
展示title 和 description，它们是 phases[item].phase_name, phases[item].description
此外还需要展示 weeks 持续多少周 phases[item].weeks

4.再下一级条目 是可以展开的 面板展示，具体的训练内容包括
我们姑且用 item 表示 phases里的项, 下面的字段都是在 item下，下面都需要展示 ，具体如何展示 你可以自由发挥

```json
"schedule": { // 周程安排
  "frequency_days_per_week": 5,  // 每周训练频次 (天)
  "rest_days_per_week": 2, // 每周休息天数
  "weekly_pattern_note": "建议周三和周末休息" // 周计划备注
},
"daily_routine": { // 每日训练流程
  "aerobic": { // 有氧训练 (注意：不是强度训练，指跑步/心肺)
    "warmup": { // 热身环节
      "duration_min": 5, // 热身时长 (分钟)
      "content": "快走 or 原地踏步 + 轻度关节活动" // 热身具体内容
    },
    "variants": [ // 可选训练模式列表 (数组，包含不同的有氧方案)
      {
        "variant_name": "基础慢跑交替", // 模式名称
        "type": "interval", // 类型标识: "interval"(间歇) 或 "continuous"(连续)
        "description": "小碎步慢跑与快走交替", // 模式描述
        "params": { // 核心参数配置
          "total_duration_min": { "min": 20, "max": 25 }, // 总训练时长范围 (分钟)
          "interval_run_min": 1, // 间歇跑-跑步阶段时长 (分钟)
          "interval_walk_min": 2, // 间歇跑-走路恢复阶段时长 (分钟)
          "rounds": { "min": 6, "max": 8 }, // 循环组数范围 (跑+走算1组，共做6-8组)
          "continuous_distance_km": null // 连续跑距离 (公里，间歇模式下为null)
        },
        "note": "如果1分钟跑太吃力，改为跑0.5分钟+走2.5分钟" // 特殊注意事项
      }
    ]
  },
  "strength": { // 力量训练
    "daily_targets": { // 每日总量目标 (用于统计打卡)
      "pushups_count": { "min": 12, "max": 16 }, // 俯卧撑总次数目标
      "abs_count": { "min": 24, "max": 30 }, // 卷腹总次数目标
      "plank_sec": { "min": 40, "max": 60 } // 平板支撑总时长目标 (秒)
    },
    "variants": [ // 可选训练方案列表
      {
        "variant_name": "标准循环训练", // 方案名称
        "execution_mode": "circuit", // 执行模式: "circuit"(循环) 或 "split"(分化/拆分)
        "circuit_rounds": 2, // 大循环次数 (整个动作列表做完算1次，共做2次)
        "sessions": [ // 训练小节 (数组，用于处理早晚分练的情况)
          {
            "session_label": "Main", // 小节标签 (Main=主项, Morning=晨练, Evening=晚练)
            "exercises": [ // 动作列表
              {
                "name": "俯卧撑", // 动作名称
                "category": "push", // 动作类别 (推/拉/腿/核心)
                "sets": 1, // 单个循环内的组数
                "reps": { "min": 6, "max": 8 }, // 每组重复次数范围
                "hold_sec": null, // 静力保持时长 (秒，用于平板支撑等)
                "rest_sec": 60 // 动作结束后的休息时间 (秒)
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
                "reps": null, // 静态动作没有次数，故为 null
                "hold_sec": { "min": 20, "max": 30 }, // 保持时长范围 (秒)
                "rest_sec": 30
              }
            ]
          }
        ]
      }
    ]
  }
}
```