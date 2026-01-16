# CLAUDE.md

本文件为 Claude Code 提供项目上下文。

## 项目定位

八字排盘计算库。**纯计算，不解读。**

## 核心约定

- **性别参数**: `1=男, 0=女`
- **四柱输出**: 8字连写，如 `庚午辛巳庚辰癸未`
- **日期范围**: -720年至2300年

## 目录结构

```
/
├── src/                          # 源代码
│   ├── core/                     # 核心
│   │   ├── Constants.js          # 天干地支五行十神常量
│   │   ├── Calendar.js           # 儒略日转换
│   │   └── Astronomy.js          # 节气、真太阳时
│   ├── converter/                # 转换
│   │   ├── DateConverter.js      # 公农历转换
│   │   └── SexagenaryConverter.js # 干支转换
│   ├── calculator/               # 计算
│   │   ├── BaZiCalculator.js     # 四柱计算
│   │   ├── WuXingCalculator.js   # 五行分析
│   │   └── ShiShenCalculator.js  # 十神计算
│   ├── analysis/                 # 分析
│   │   ├── RelationshipAnalyzer.js # 刑冲合害 + 格局
│   │   └── DaYunAnalyzer.js      # 大运流年
│   ├── data/                     # 数据
│   │   ├── GXData.js             # 关系定义
│   │   └── CalendarCorrections.js # 历法修正
│   ├── BaZi.js                   # 主入口
│   └── index.js                  # 导出
├── docs/API.md                   # API 文档
├── demo.html                     # 演示页面
├── package.json                  # 包配置
├── README.md                     # 说明
└── LICENSE                       # MIT
```

## 快速使用

```javascript
import { BaZi } from './src/index.js';

const bazi = new BaZi({ useTrueSolarTime: true, longitude: 116.4 });
const result = bazi.calculate({
  gender: 1,
  year: 1990, month: 5, day: 15, hour: 14
});

// result.bazi = '庚午辛巳庚辰癸未'
// result.wuXing.percent = { 金: 39, 水: 14, 木: 8, 火: 16, 土: 23 }
// result.daYun.cycles = [9个大运周期，每个含10个流年]
```

## 精确度

| 项目 | 精度 |
|------|------|
| 节气计算 | ±20秒 |
| 真太阳时 | ±20秒 |
| 农历转换 | 与寿星万年历完全一致 |

## 开发

无构建系统。浏览器直接打开 `demo.html` 测试。

```bash
python3 -m http.server 8000
# 访问 http://localhost:8000/demo.html
```

## 遗留代码

`legacy/` 目录包含旧版单体代码和参考实现，仅供参考，不再维护。
