import React, { useState } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import { 
  TrainingPlanData, 
  TrainingPhase, 
  StrengthExercise, 
  RangeValue, 
  StrengthVariant 
} from 'src/core/constants/data'; // 请确保路径正确

import './PlanEditor.scss'; // 引入样式文件
import { usePlan } from 'src/core/business/mine/usePlane';

// 1. 工具函数：创建默认空数据

const createEmptyRange = (): RangeValue => ({ min: 0, max: 0 });

const createEmptyExercise = (): StrengthExercise => ({
  name: '',
  category: 'push',
  sets: 3,
  reps: { min: 8, max: 12 },
  hold_sec: null,
  rest_sec: 60
});

const createEmptyStrengthVariant = (): StrengthVariant => ({
  variant_name: '新变体',
  execution_mode: 'circuit',
  circuit_rounds: 3,
  sessions: [{ session_label: 'Main', exercises: [createEmptyExercise()] }]
});

const createEmptyPhase = (id: number): TrainingPhase => ({
  phase_id: id,
  phase_name: `阶段 ${id}`,
  weeks: [1, 2],
  description: '',
  schedule: { frequency_days_per_week: 3, rest_days_per_week: 4, weekly_pattern_note: '' },
  daily_routine: {
    aerobic: { warmup: { duration_min: 5, content: '' }, variants: [] },
    strength: { 
      daily_targets: { pushups_count: {min:0, max:0}, abs_count: {min:0, max:0}, plank_sec: {min:0, max:0} }, 
      variants: [createEmptyStrengthVariant()] 
    }
  }
});

// 2. 子组件定义

// --- 组件：范围输入框 (RangeInput) ---
interface RangeInputProps {
  label: string;
  value: RangeValue | null;
  onChange: (v: RangeValue) => void;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, value, onChange }) => {
  const safeValue = value || { min: 0, max: 0 };
  return (
    <View className="form-group">
      <Text className="label">{label}</Text>
      <View className="row">
        <View className="col">
          <Input 
            className="input" 
            type="number" 
            placeholder="Min"
            value={String(safeValue.min)} 
            onInput={e => onChange({ ...safeValue, min: Number(e.detail.value) })} 
          />
        </View>
        <Text className="separator">-</Text>
        <View className="col">
          <Input 
            className="input" 
            type="number" 
            placeholder="Max"
            value={String(safeValue.max)} 
            onInput={e => onChange({ ...safeValue, max: Number(e.detail.value) })} 
          />
        </View>
      </View>
    </View>
  );
};

// --- 组件：单个动作编辑器 ---
interface ExerciseEditorProps {
  exercise: StrengthExercise;
  onChange: (e: StrengthExercise) => void;
  onDelete: () => void;
}

const ExerciseEditor: React.FC<ExerciseEditorProps> = ({ exercise, onChange, onDelete }) => {
  return (
    <View className="card sub-card">
      <View className="section-header">
        <Text className="sub-title" style={{fontSize: '24rpx'}}>动作详情</Text>
        <View className="btn btn-danger-text" onClick={onDelete}>删除</View>
      </View>
      
      <View className="form-group">
        <Text className="label">动作名称</Text>
        <Input 
          className="input" 
          value={exercise.name} 
          onInput={e => onChange({...exercise, name: e.detail.value})} 
        />
      </View>
      
      <View className="row form-group">
        <View className="col">
          <Text className="label">组数</Text>
          <Input 
            className="input" 
            type="number" 
            value={String(exercise.sets)} 
            onInput={e => onChange({...exercise, sets: Number(e.detail.value)})} 
          />
        </View>
        <View className="col">
          <Text className="label">休息(秒)</Text>
          <Input 
            className="input" 
            type="number" 
            value={String(exercise.rest_sec)} 
            onInput={e => onChange({...exercise, rest_sec: Number(e.detail.value)})} 
          />
        </View>
      </View>

      <RangeInput label="次数范围 (Reps)" value={exercise.reps} onChange={v => onChange({...exercise, reps: v})} />
    </View>
  );
};

// --- 组件：力量变体编辑器 ---
interface StrengthVariantEditorProps {
  variant: StrengthVariant;
  onChange: (v: StrengthVariant) => void;
  onDelete: () => void;
}

const StrengthVariantEditor: React.FC<StrengthVariantEditorProps> = ({ variant, onChange, onDelete }) => {
  
  const updateSession = (sIndex: number, exercises: StrengthExercise[]) => {
    const newSessions = [...variant.sessions];
    newSessions[sIndex] = { ...newSessions[sIndex], exercises };
    onChange({ ...variant, sessions: newSessions });
  };

  return (
    <View className="card">
      <View className="section-header">
        <Text className="title">变体: {variant.variant_name}</Text>
        <View className="btn btn-danger-text" onClick={onDelete}>删除变体</View>
      </View>

      <View className="form-group">
        <Text className="label">变体名称</Text>
        <Input 
          className="input" 
          placeholder="例如: 循环训练A" 
          value={variant.variant_name} 
          onInput={e => onChange({...variant, variant_name: e.detail.value})} 
        />
      </View>

      {/* 遍历 Sessions */}
      {variant.sessions.map((session, sIndex) => (
        <View key={sIndex} className="session-container">
          <Text className="sub-title" style={{color: '#3b82f6', marginTop: '20rpx'}}>
            Session: {session.session_label}
          </Text>
          
          {/* 遍历 Exercises */}
          {session.exercises.map((ex, exIndex) => (
            <ExerciseEditor 
              key={exIndex} 
              exercise={ex} 
              onChange={(newEx) => {
                const newExercises = [...session.exercises];
                newExercises[exIndex] = newEx;
                updateSession(sIndex, newExercises);
              }}
              onDelete={() => {
                const newExercises = session.exercises.filter((_, i) => i !== exIndex);
                updateSession(sIndex, newExercises);
              }}
            />
          ))}
          
          <Button className="btn btn-outline btn-block" onClick={() => {
            const newExercises = [...session.exercises, createEmptyExercise()];
            updateSession(sIndex, newExercises);
          }}>+ 添加动作</Button>
        </View>
      ))}
    </View>
  );
};

// --- 组件：阶段 (Phase) 编辑器 ---
interface PhaseEditorProps {
  phase: TrainingPhase;
  onChange: (p: TrainingPhase) => void;
  onDelete: () => void;
}

const PhaseEditor: React.FC<PhaseEditorProps> = ({ phase, onChange, onDelete }) => {
  
  const updateStrengthVariants = (newVariants: StrengthVariant[]) => {
    onChange({
      ...phase,
      daily_routine: {
        ...phase.daily_routine,
        strength: {
          ...phase.daily_routine.strength,
          variants: newVariants
        }
      }
    });
  };

  return (
    <View className="card">
      <View className="section-header">
        <Text className="title">{phase.phase_name}</Text>
        <View className="btn btn-danger-text" onClick={onDelete}>删除阶段</View>
      </View>

      <View className="form-group">
        <Text className="label">阶段名称</Text>
        <Input className="input" value={phase.phase_name} onInput={e => onChange({...phase, phase_name: e.detail.value})} />
      </View>
      
      <View className="form-group">
        <Text className="label">描述</Text>
        <Input className="input" value={phase.description} onInput={e => onChange({...phase, description: e.detail.value})} />
      </View>

      {/* 力量训练部分 */}
      <View style={{marginTop: '40rpx'}}>
        <Text className="sub-title">🏋️ 力量训练配置</Text>
        
        <RangeInput 
          label="每日俯卧撑目标" 
          value={phase.daily_routine.strength.daily_targets.pushups_count} 
          onChange={v => onChange({
            ...phase,
            daily_routine: {
              ...phase.daily_routine,
              strength: {
                ...phase.daily_routine.strength,
                daily_targets: { ...phase.daily_routine.strength.daily_targets, pushups_count: v }
              }
            }
          })} 
        />

        {phase.daily_routine.strength.variants.map((variant, vIndex) => (
          <StrengthVariantEditor 
            key={vIndex}
            variant={variant}
            onChange={(newVariant) => {
              const newVariants = [...phase.daily_routine.strength.variants];
              newVariants[vIndex] = newVariant;
              updateStrengthVariants(newVariants);
            }}
            onDelete={() => {
              const newVariants = phase.daily_routine.strength.variants.filter((_, i) => i !== vIndex);
              updateStrengthVariants(newVariants);
            }}
          />
        ))}

        <Button className="btn btn-primary btn-block" onClick={() => {
          const newVariants = [...phase.daily_routine.strength.variants, createEmptyStrengthVariant()];
          updateStrengthVariants(newVariants);
        }}>+ 添加力量变体</Button>
      </View>

      {/* 有氧训练部分 (简化) */}
      <View style={{marginTop: '40rpx', paddingTop: '20rpx', borderTop: '1px solid #eee'}}>
        <Text className="sub-title">🏃 有氧训练配置</Text>
        <View className="form-group">
          <Text className="label">热身时长 (分钟)</Text>
          <Input 
            className="input" 
            type="number"
            value={String(phase.daily_routine.aerobic.warmup.duration_min)}
            onInput={e => onChange({
              ...phase,
              daily_routine: {
                ...phase.daily_routine,
                aerobic: {
                  ...phase.daily_routine.aerobic,
                  warmup: { ...phase.daily_routine.aerobic.warmup, duration_min: Number(e.detail.value) }
                }
              }
            })}
          />
        </View>
      </View>
    </View>
  );
};

// 3. 主页面组件 (入口)

export function PlanEditor() {
  const [plan, setPlan] = useState<TrainingPlanData>({
    plan_overview: { title: '我的新计划', created_at: new Date().toISOString() },
    phases: [createEmptyPhase(1)]
  });
  const {createNewPlan} = usePlan()

  const handleSave = () => {
    // console.log('最终生成的 JSON 数据:', JSON.stringify(plan, null, 2));
    // Taro.showToast({ title: '保存成功(看控制台)', icon: 'success' });
    createNewPlan(plan)
  };

  return (
    <View className="plan-editor-container">
      <Text className="page-title">训练计划编辑器</Text>

      {/* 1. 计划概览 */}
      <View className="card">
        <View className="section-header">
          <Text className="title">📝 计划概览</Text>
        </View>
        <View className="form-group">
          <Text className="label">计划标题</Text>
          <Input 
            className="input" 
            value={plan.plan_overview.title} 
            onInput={e => setPlan({...plan, plan_overview: {...plan.plan_overview, title: e.detail.value}})} 
          />
        </View>
      </View>

      {/* 2. 阶段列表 */}
      {plan.phases.map((phase, index) => (
        <PhaseEditor 
          key={phase.phase_id}
          phase={phase}
          onChange={(newPhase) => {
            const newPhases = [...plan.phases];
            newPhases[index] = newPhase;
            setPlan({ ...plan, phases: newPhases });
          }}
          onDelete={() => {
            const newPhases = plan.phases.filter((_, i) => i !== index);
            setPlan({ ...plan, phases: newPhases });
          }}
        />
      ))}

      {/* 3. 底部操作栏 */}
      <View className="footer-actions">
        <Button className="btn btn-success" style={{flex: 1}} onClick={() => {
          const nextId = plan.phases.length > 0 ? plan.phases[plan.phases.length - 1].phase_id + 1 : 1;
          setPlan({ ...plan, phases: [...plan.phases, createEmptyPhase(nextId)] });
        }}>
          + 新阶段
        </Button>

        <Button className="btn btn-primary" style={{flex: 1}} onClick={handleSave}>
          💾 保存
        </Button>
      </View>
    </View>
  );
}