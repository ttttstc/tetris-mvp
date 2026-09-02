// 单测骨架示例 · 前端工程师可参考本文件结构覆盖自己写的模块。
// 测试金字塔：本目录放 70% 的纯逻辑单测；架构 §7.2 的 7 条关键路径在 test/e2e/ 走 Playwright。

import { describe, it, expect } from 'vitest';
// 实际模块交付后 import 路径示例：
// import { createBoard } from '@core/board';
// import { tryRotate } from '@core/collision';
// import { KICKS_JLSTZ, KICKS_I } from '@core/rotation';
// import { SevenBag } from '@core/randomizer';

describe('test/core/_example.test.ts · 骨架', () => {
  it('placeholder: 验证测试可被 vitest 拾取', () => {
    // 这个最小用例先证明 vitest 通路 OK；前端交付首个模块时把这里替换成真测试。
    expect(1 + 1).toBe(2);
  });
});
