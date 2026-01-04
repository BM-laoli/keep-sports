import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import './TrainingChart.scss';
import { useDeepCompareEffect } from 'ahooks';
import { useDeepMemo } from 'src/core/hooks/useDeepMemo';
import { cloneDeep } from 'lodash';
import dayjs from 'dayjs';

// 定义接口
export interface HeatmapItem {
  date: string;
  isDone: boolean;
}

export interface WeeklyItem {
  day: string; // "Mon", "Tue" or "周一"
  value: number; // 0 - 100 (百分比)
  isToday?: boolean;
}

interface Props {
  heatmapData: HeatmapItem[];
  weeklyData: WeeklyItem[];
}

const TrainingChart: React.FC<Props> = ({ heatmapData, weeklyData }) => {
  const [viewMode, setViewMode] = useState<'year' | 'week'>('year');
  const [scrollLeft, setScrollLeft] = useState(0);

  // 1. 热力图优化：只取最近 112 天 (16周) 的数据，避免手机上太长
  // 注意：假设 heatmapData 是按时间顺序排列的
  const recentHeatmapData = useDeepMemo(() => {
    const today = dayjs();
    const startDate = today.subtract(1, 'month').startOf('day');  // 1 个月前
    const endDate   = today.add(3, 'month').endOf('day');         // 2 个月后
    let startIndex = heatmapData.findIndex(
        (item) => dayjs(item.date).isSame(startDate, 'day')
      );
    let endIndex = heatmapData.findIndex(
      (item) => dayjs(item.date).isSame(endDate, 'day')
    );
    if(startIndex == -1) startIndex = 0 // 说明是跨年了 跨年就取 1月1号
    if(endIndex == -1) endIndex = heatmapData.length  // 说明是跨年了 跨年就取 最后一天！

    const DAYS_TO_SHOW = 16 * 7; 
    if (heatmapData.length <= DAYS_TO_SHOW) return heatmapData;
    return cloneDeep(heatmapData).slice(startIndex, endIndex + 1);
  }, [heatmapData]);

  // 2. 自动滚动到最右侧
  useDeepCompareEffect(() => {
    if (viewMode === 'year') {
      // 延时一下确保渲染完成，设置一个足够大的值让它滚到最右边
      setTimeout(() => {
        setScrollLeft(9999);
      }, 100);
    }
  }, [viewMode, recentHeatmapData]);

  return (
    <View className="chart-card">
      {/* 头部：标题 + 切换器 */}
      <View className="chart-header">
        <View>
            <Text className="chart-title">训练趋势</Text>
            <Text className="chart-subtitle">
                {viewMode === 'year' ? '最近 3 个月' : '本周表现'}
            </Text>
        </View>
        
        <View className="toggle-switch">
          <View 
            className={`toggle-item ${viewMode === 'year' ? 'active' : ''}`}
            onClick={() => setViewMode('year')}
          >
            年
          </View>
          <View 
            className={`toggle-item ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            周
          </View>
        </View>
      </View>

      {/* 内容区域 */}
      <View className="chart-content">
        {viewMode === 'year' ? (
          <ScrollView 
            scrollX 
            className="heatmap-scroll" 
            scrollLeft={scrollLeft}
            scrollWithAnimation
          >
            <View className="heatmap-container">
                <View className="heatmap-grid">
                {recentHeatmapData.map((item, index) => (
                    <View 
                    key={index} 
                    className={`heatmap-cell ${item.isDone ? 'active' : ''}`}
                    />
                ))}
                </View>
            </View>
          </ScrollView>
        ) : (
          <View className="bar-chart">
            {weeklyData.map((item, index) => (
              <View key={index} className={`bar-col ${item.isToday ? 'today' : ''}`}>
                <View className="bar-track">
                    <View 
                    className="bar-fill" 
                    style={{ height: `${item.value}%` }} 
                    />
                </View>
                <Text className="bar-label">{item.day}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default TrainingChart;