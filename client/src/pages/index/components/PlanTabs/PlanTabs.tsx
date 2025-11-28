import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import './PlanTabs.scss';

interface TabItem {
  key: string | number;
  label: string;
}

interface Props {
  tabs: TabItem[];
  activeKey: string | number;
  onChange: (key: string | number) => void;
}

const PlanTabs: React.FC<Props> = ({ tabs, activeKey, onChange }) => {
  // 用于控制滚动条位置，确保选中的 tab 在可视区域
  const [scrollId, setScrollId] = useState('');

  // 当 activeKey 变化时，更新 scrollId
  useEffect(() => {
    // 这里的 id 必须和下面 View 的 id 对应，且不能以数字开头
    setScrollId(`tab_${activeKey}`);
  }, [activeKey]);

  return (
    <View className="plan-tabs-wrapper">
      <ScrollView
        className="plan-tabs-scroll"
        scrollX
        scrollWithAnimation
        scrollIntoView={scrollId}
        // 增强体验：隐藏滚动条 (部分平台生效)
        showScrollbar={false} 
      >
        <View className="plan-tabs-container">
          {tabs.map((tab) => (
            <View
              key={tab.key}
              id={`tab_${tab.key}`} // 关键：用于 scrollIntoView 定位
              className={`tab-item ${activeKey === tab.key ? 'active' : ''}`}
              onClick={() => onChange(tab.key)}
            >
              <Text className="tab-text">{tab.label}</Text>
              {/* 激活时的底部指示条 */}
              {activeKey === tab.key && <View className="active-line" />}
            </View>
          ))}
          {/* 右侧占位，防止最后一个 tab 贴边太紧 */}
          <View className="tab-spacer" />
        </View>
      </ScrollView>
    </View>
  );
};

export { PlanTabs };