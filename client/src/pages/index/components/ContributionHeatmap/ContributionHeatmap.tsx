import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import dayjs from 'dayjs';
import './ContributionHeatmap.scss';

export interface HeatmapItem {
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}

interface Props {
  data: HeatmapItem[];
  endDate?: string;
  weeks?: number;
  blockSize?: number; // 新增：格子大小 (单位 rpx)，默认 30
  gap?: number;       // 新增：间距 (单位 rpx)，默认 6
  align?: 'start' | 'center'; // 新增：对齐方式，数据少时可居中
}

const ContributionHeatmap: React.FC<Props> = ({ 
  data, 
  endDate = dayjs().format('YYYY-MM-DD'), 
  weeks = 52,
  blockSize = 32, // 默认加大到 32rpx
  gap = 6,
  align = 'start'
}) => {
  
  const { gridData } = useMemo(() => {
    const dataMap = new Map(data.map(item => [item.date, item.level]));
    const end = dayjs(endDate);
    let current = end.subtract(weeks, 'week').startOf('week'); 
    
    const grid: any[] = [];
    
    for (let w = 0; w <= weeks; w++) {
      const weekDays: any[] = [];
      let monthLabel = '';

      for (let d = 0; d < 7; d++) {
        const dateStr = current.format('YYYY-MM-DD');
        const level = dataMap.get(dateStr) || 0;
        
        // 简化的月份显示逻辑
        if (d === 0) {
           const prevWeekMonth = current.subtract(1, 'week').month();
           const currentMonth = current.month();
           if (prevWeekMonth !== currentMonth || w === 0) {
             monthLabel = current.format('MMM');
           }
        }

        weekDays.push({ date: dateStr, level });
        current = current.add(1, 'day');
      }
      
      grid.push({ weekIndex: w, monthLabel, days: weekDays });
    }

    return { gridData: grid };
  }, [data, endDate, weeks]);

  // 动态计算样式
  const cellStyle = { width: `${blockSize}rpx`, height: `${blockSize}rpx` };
  const colStyle = { gap: `${gap}rpx` };
  const gridStyle = { gap: `${gap}rpx` };
  
  // 计算左侧标尺的行高间距，确保对齐
  // 标尺文字高度 = blockSize，间距 = gap
  // Mon(index 1) 顶部距离 = (blockSize + gap) * 1
  const labelStyle = (rowIndex: number) => ({
    height: `${blockSize}rpx`,
    lineHeight: `${blockSize}rpx`,
    marginTop: rowIndex === 0 
      ? `${blockSize + gap}rpx` // Mon
      : `${blockSize + gap}rpx` // Wed, Fri 之间的间距
  });

  return (
    <View className="heatmap-wrapper">
      {/* 左侧：星期标尺 */}
      <View className="heatmap-y-axis" style={{ paddingRight: `${gap}rpx` }}>
        {/* 占位，为了对齐顶部的月份文字高度 */}
        <View className="y-axis-placeholder" /> 
        <Text className="week-label" style={labelStyle(0)}>Mon</Text>
        <Text className="week-label" style={labelStyle(1)}>Wed</Text>
        <Text className="week-label" style={labelStyle(2)}>Fri</Text>
      </View>

      {/* 右侧：滑动区域 */}
      <ScrollView 
        className="heatmap-scroll" 
        scrollX 
        scrollLeft={weeks > 20 ? 9999 : 0} // 周数多时滚到最右，少时靠左
        enableFlex
      >
        <View 
          className={`heatmap-grid ${align === 'center' ? 'grid-center' : ''}`} 
          style={gridStyle}
        >
          {gridData.map((week, wIndex) => (
            <View key={wIndex} className="heatmap-column" style={colStyle}>
              {/* 月份标签 */}
              <Text className="month-label">{week.monthLabel}</Text>
              
              {/* 一周的7个格子 */}
              {week.days.map((day) => (
                <View 
                  key={day.date}
                  className={`heatmap-cell level-${day.level}`}
                  style={cellStyle}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ContributionHeatmap;