import { Component, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { View, ScrollView } from "@tarojs/components";
import { AtTabBar } from "taro-ui";

import "./index.scss";
import { PlanEditor } from "../index/components/PlanEditor/PlanEditor";
import { usePlan } from "src/core/business/mine/usePlane";

const IndexApp = () => {
  const {editTempData} = usePlan()
  
  return (
    <View className="page">
      {/* 内容区域 */}
      <ScrollView scrollY className="page-container">
        <PlanEditor 
          mode="edit"
          initialData={editTempData} 
          onAfterSave={() => console.log('更新成功，返回上一页')} 
        />
      </ScrollView>
    </View>
  );
};

export default class Index extends Component<PropsWithChildren> {
  componentDidMount() {}

  componentWillUnmount() {}

  componentDidShow() {}

  componentDidHide() {}

  render() {
    return <IndexApp />;
  }
}
