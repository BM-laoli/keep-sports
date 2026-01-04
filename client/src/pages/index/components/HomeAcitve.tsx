import { View,Text,ScrollView, Button } from "@tarojs/components";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { transformJsonToUiData } from "src/core/utils/planAdapter";
import { PlanEditor } from "./PlanEditor/PlanEditor";
import { usePlan } from "src/core/business/mine/usePlane";
import { useUser } from "src/core/business/mine";
import { PlanTabs } from "./PlanTabs/PlanTabs";

import './HomeActive.scss'
import dayjs from "dayjs";
import Taro from "@tarojs/taro";
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


const HomeActive = () => {
  const {
    activePlanId,
    setActivePlanId,
    tabs,
    currentUIPlan: currentPlan,
    initPlans,
    deleteCurrentPlan,
    jump2Edit
  } = usePlan();
  const { userInfo } = useUser();

  useEffect(() => {
    if (userInfo._openid) {
      initPlans();
    }
  }, [userInfo._openid]);

  return (
    <View className="training-plan-page-home">
      {/* 1. 顶部固定 Tabs */}
      <View className="sticky-header-x">
        <PlanTabs
          tabs={tabs}
          activeKey={activePlanId}
          onChange={setActivePlanId}
        />
      </View>

      <ScrollView scrollY className="page-content-container">
        {/* 2. 计划标题信息 */}
            <View className="plan-header">
              <View className="main-title">{currentPlan?.meta?.title}</View>
              {(activePlanId != '00011' && activePlanId != '00001' ) && (
                <>
                <View className="meta">创建于: { dayjs(currentPlan?.meta?.date).format('YYYY-MM-DD') }</View>
                {/* 删除和编辑按钮 */}
                <View className="action-container">
                  <Button className="btn btn-success" onClick={() => {
                    
                    jump2Edit(activePlanId)
                    
                  }}>编辑</Button>
                  <Button className="btn btn-primary" onClick={deleteCurrentPlan}>删除</Button>
                </View>
                </>
              )}
              
            </View>

            {/* 3. 计划列表内容 */}
            <View className="plan-content">
              {Number(currentPlan?.phases?.length) > 0 ? (
                currentPlan?.phases?.map((phase) => (
                  // 这里使用之前定义的 PhaseCard 组件
                  <PhaseCard key={phase.id} phase={phase} />
                ))
              ) : (
                // 空状态展示
                // <View className="empty-state">
                //   <View className="empty-icon">📝</View>
                //   <View className="empty-text">暂无自定义计划，去创建一个吧！(施工中)</View>
                // </View>
                <PlanEditor></PlanEditor> // 最好还是单独一个页面好啦 很强大
              )}
            </View>
      </ScrollView>

    </View>
  );
};

export {
  HomeActive
}