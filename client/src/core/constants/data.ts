// 1. 基础工具类型：处理 { min, max } 这种常见的范围结构
export interface RangeValue {
    min: number;
    max: number;
  }
  
  // ------------------------------------------------------
  // 2. 顶层概览
  // ------------------------------------------------------
  export interface PlanOverview {
    title: string;
    created_at: string; // ISO 日期字符串
  }
  
  // ------------------------------------------------------
  // 3. 有氧训练 (Aerobic) 相关定义
  // ------------------------------------------------------
  export interface AerobicParams {
    // 注意：JSON中有些是范围对象，有些是纯数字，有些是 null
    total_duration_min: RangeValue | null;
    interval_run_min: number | null;
    interval_walk_min: number | null;
    rounds: RangeValue | null;
    continuous_distance_km: RangeValue | null;
  }
  
  export interface AerobicVariant {
    variant_name: string;
    type: 'interval' | 'continuous'; // 枚举类型，对应 JSON 中的 type
    description: string;
    params: AerobicParams;
    note: string | null;
  }
  
  export interface AerobicRoutine {
    warmup: {
      duration_min: number;
      content: string;
    };
    variants: AerobicVariant[];
  }
  
  // ------------------------------------------------------
  // 4. 力量训练 (Strength) 相关定义
  // ------------------------------------------------------
  export interface StrengthExercise {
    name: string;
    category: 'push' | 'core' | 'core_static' | string; // 预定义一些类别，但也允许字符串
    sets: number;
    // 动态次数：可能是次数(reps)也可能是时间(hold_sec)，互斥或共存
    reps: RangeValue | null;
    hold_sec: RangeValue | null;
    rest_sec: number;
  }
  
  export interface StrengthSession {
    session_label: 'Main' | 'Morning' | 'Evening' | string;
    exercises: StrengthExercise[];
  }
  
  export interface StrengthVariant {
    variant_name: string;
    execution_mode: 'circuit' | 'split'; // 循环 vs 分化
    circuit_rounds: number;
    sessions: StrengthSession[];
  }
  
  export interface DailyTargets {
    pushups_count: RangeValue;
    abs_count: RangeValue;
    plank_sec: RangeValue;
  }
  
  export interface StrengthRoutine {
    daily_targets: DailyTargets;
    variants: StrengthVariant[];
  }
  
  // ------------------------------------------------------
  // 5. 阶段 (Phase) 定义
  // ------------------------------------------------------
  export interface PhaseSchedule {
    frequency_days_per_week: number;
    rest_days_per_week: number;
    weekly_pattern_note: string;
  }
  
  export interface DailyRoutine {
    aerobic: AerobicRoutine;
    strength: StrengthRoutine;
  }
  
  export interface TrainingPhase {
    phase_id: number;
    phase_name: string;
    weeks: number[];
    description: string;
    schedule: PhaseSchedule;
    daily_routine: DailyRoutine;
  }
  
  // ------------------------------------------------------
  // 6. 根节点 (Root)
  // ------------------------------------------------------
  export interface TrainingPlanData {
    plan_overview: PlanOverview;
    phases: TrainingPhase[];
  }

// // 强制类型断言，让 TS 知道这个 JSON 符合我们的接口
// const planData: TrainingPlanData = rawData as unknown as TrainingPlanData;

// // 现在你可以安全地访问属性，TS 会自动提示
// console.log(planData.phases[0].daily_routine.strength.variants[0].execution_mode);