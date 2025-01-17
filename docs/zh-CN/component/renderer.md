# 渲染器 Renderer

当你想要在 `<template>` 里使用渲染函数，你可能需要它。

## 代码示例

:::demo renderer/basis

### 简单例子

辅助在模版中使用渲染函数进行内容渲染。

配合 `tsx` 语法一起使用效果会更好。

:::

:::demo renderer/slot

### 插槽用法

有些时候，你希望在模版中能够定义变量并进行多次使用，很遗憾目前 Vue 还未有正式的特性支持。

这个示例演示了如何借助 Renderer 组件在模版中储存变量并复用。

:::

## API

### Renderer 属性

| 名称     | 类型                      | 说明                       | 默认值      | 始于 |
| -------- | ------------------------- | -------------------------- | ----------- | ---- |
| renderer | `(...args: any[]) => any` | 设置渲染函数               | `null`      | -    |
| data     | `Record<string, any>`     | 设置需要传给渲染函数的参数 | `undefined` | -    |
