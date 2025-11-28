export interface Routine {
    title: string;
    icon: string;
    warmup?: any;
    targets?: any;
    variants: any[];
  }
  
  export interface PhaseData {
    id: number;
    phaseNum: string;
    title: string;
    desc: string;
    isOpen: boolean;
    schedule: {
      trainDays: number;
      restDays: number;
      note: string;
    };
    routines: Routine[];
  }
  // utils/planAdapter.ts

// ------------------------------------------------------
// 1. 辅助函数：处理 {min, max} 这种范围对象
// ------------------------------------------------------
const formatRange = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') return `${val}`;
    if (typeof val === 'object') {
      if (val.min === val.max) return `${val.min}`;
      return `${val.min}-${val.max}`;
    }
    return `${val}`;
  };
  
  // ------------------------------------------------------
  // 2. 核心转换函数
  // ------------------------------------------------------
  export const transformJsonToUiData = (jsonData: any): any[] => {
    if (!jsonData || !jsonData.phases) return [];
  
    return jsonData.phases.map((phase: any, index: number) => {
      const routines: any[] = [];
      const dr = phase.daily_routine;
  
      // --- A. 处理有氧 (Aerobic) ---
      if (dr.aerobic) {
        const aerobic = dr.aerobic;
        
        // 转换 Variants
        const aerobicVariants = aerobic.variants.map((v: any) => {
          const paramsList: any[] = [];
          const p = v.params;
  
          // 手动映射 JSON 中的 params 对象 -> UI 需要的 Icon 数组
          if (p.total_duration_min) {
            paramsList.push({ icon: '⏱', text: `${formatRange(p.total_duration_min)}分` });
          }
          if (p.continuous_distance_km) {
            paramsList.push({ icon: '📍', text: `${formatRange(p.continuous_distance_km)}km` });
          }
          if (p.interval_run_min) {
            paramsList.push({ icon: '🏃', text: `跑${formatRange(p.interval_run_min)}分` });
          }
          if (p.interval_walk_min) {
            paramsList.push({ icon: '🚶', text: `走${formatRange(p.interval_walk_min)}分` });
          }
          if (p.rounds) {
            paramsList.push({ icon: '🔄', text: `${formatRange(p.rounds)}组` });
          }
  
          return {
            tag: v.type === 'interval' ? '间歇跑' : '连续跑',
            title: v.variant_name,
            desc: v.description,
            params: paramsList, // 这里是转换后的数组
            note: v.note
          };
        });
  
        routines.push({
          type: 'aerobic',
          title: '有氧训练',
          icon: '❤️', // 或者使用你的 SVG/Emoji
          warmup: {
            title: `🔥 热身 (${aerobic.warmup.duration_min}分钟)`,
            content: aerobic.warmup.content
          },
          variants: aerobicVariants
        });
      }
  
      // --- B. 处理力量 (Strength) ---
      if (dr.strength) {
        const strength = dr.strength;
  
        // 1. 转换 Targets (对象 -> 数组)
        const targetsList: any[] = [];
        const dt = strength.daily_targets;
        if (dt.pushups_count) targetsList.push({ value: formatRange(dt.pushups_count), label: '俯卧撑' });
        if (dt.abs_count) targetsList.push({ value: formatRange(dt.abs_count), label: '卷腹' });
        if (dt.plank_sec) targetsList.push({ value: `${formatRange(dt.plank_sec)}s`, label: '平板' });
  
        // 2. 转换 Variants & Sessions
        const strengthVariants = strength.variants.map((v: any) => {
          const sessions = v.sessions.map((s: any) => ({
            label: s.session_label === 'Main' ? '主训练' : s.session_label, // 汉化标签
            exercises: s.exercises.map((ex: any) => {
              // 生成 meta 字符串: "1组 × 6-8次 (休60s)"
              let metaStr = `${ex.sets}组 × `;
              if (ex.reps) {
                metaStr += `${formatRange(ex.reps)}次`;
              } else if (ex.hold_sec) {
                metaStr += `${formatRange(ex.hold_sec)}秒`;
              }
              if (ex.rest_sec) {
                metaStr += ` (休${ex.rest_sec}s)`;
              }
  
              return {
                name: ex.name,
                meta: metaStr
              };
            })
          }));
  
          return {
            tag: v.execution_mode === 'circuit' ? '循环' : '分化',
            title: v.variant_name,
            desc: v.execution_mode === 'circuit' 
              ? `大循环: ${v.circuit_rounds} 轮` 
              : '早晚分化训练',
            sessions: sessions
          };
        });
  
        routines.push({
          type: 'strength',
          title: '力量训练',
          icon: '💪',
          targets: targetsList,
          variants: strengthVariants
        });
      }
  
      // --- C. 组装 Phase ---
      return {
        id: `p${phase.phase_id}`,
        phaseNum: `Phase ${phase.phase_id}`,
        title: phase.phase_name,
        desc: `${phase.description} (第 ${phase.weeks.join(',')} 周)`,
        isOpen: index === 0, // 默认展开第一个
        schedule: {
          trainDays: phase.schedule.frequency_days_per_week,
          restDays: phase.schedule.rest_days_per_week,
          note: `📅 ${phase.schedule.weekly_pattern_note}`
        },
        routines: routines
      };
    });
  };