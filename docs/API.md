# 八字排盘库 API 文档

## 概述

本库是一个模块化的八字排盘计算库，提供以下功能：

- 四柱八字计算
- 五行分析（含分数和占比）
- 十神计算
- 刑冲合害关系分析
- 三会、三合、六合等格局检测
- 大运流年计算
- 公历农历转换
- 真太阳时计算

## 设计原则

1. **只计算确定的、客观的数据**，不进行主观解读
2. **性别参数**：`1 = 男`，`0 = 女`
3. **输出纯净简洁**：四柱只输出8个汉字

## 快速开始

### ES Modules 方式

```javascript
import { BaZi } from './src/index.js';

const bazi = new BaZi({
  useTrueSolarTime: true,
  longitude: 116.4,
  latitude: 39.9
});

const result = bazi.calculate({
  gender: 1,      // 1=男, 0=女
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30
});

console.log(result.bazi);           // 庚午辛巳丙寅乙未
console.log(result.wuXing.percent); // {金: 15, 水: 10, 木: 25, 火: 30, 土: 20}
console.log(result.daYun.cycles);   // 大运周期数组
```

### 单独使用各模块

```javascript
import {
  Calendar,
  DateConverter,
  BaZiCalculator,
  WuXingCalculator,
  RelationshipAnalyzer
} from './src/index.js';

// 儒略日转换
const jd = Calendar.toJulianDay(2024, 6, 15, 14, 30, 0);

// 公农历转换
const lunar = DateConverter.solarToLunar(2024, 6, 15);

// 单独计算四柱
const pillars = BaZiCalculator.calculate(2024, 6, 15, 14, 30, 0);

// 五行分析
const wuXing = WuXingCalculator.calculate(pillars.ganIndices, pillars.zhiIndices);

// 关系分析
const relations = RelationshipAnalyzer.analyze(pillars.ganIndices, pillars.zhiIndices);
```

---

## 主类 BaZi

### 构造函数

```javascript
new BaZi(options)
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| useTrueSolarTime | boolean | false | 是否使用真太阳时 |
| longitude | number | 120 | 经度 |
| latitude | number | 35 | 纬度 |
| useEarlyZi | boolean | true | 是否区分早晚子时 |
| preciseDaYun | boolean | true | 是否精确计算大运 |

### calculate(params)

计算完整八字盘。

**参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| gender | number | 是 | 性别（1=男, 0=女） |
| year | number | 是 | 公历年 |
| month | number | 是 | 公历月（1-12） |
| day | number | 是 | 公历日（1-31） |
| hour | number | 是 | 小时（0-23） |
| minute | number | 否 | 分钟（默认0） |
| second | number | 否 | 秒（默认0） |

**返回值**

```javascript
{
  // 输入信息
  input: {
    gender: 1,
    datetime: '1990-5-15 14:30:0',
    location: { longitude: 116.4, latitude: 39.9 }
  },

  // 时间
  time: {
    standard: [1990, 5, 15, 14, 30, 0],
    trueSolar: [1990, 5, 15, 14, 22, 35]  // 若启用
  },

  // 四柱八字
  bazi: '庚午辛巳丙寅乙未',
  pillars: {
    year:  { gan: '庚', zhi: '午', ganZhi: '庚午' },
    month: { gan: '辛', zhi: '巳', ganZhi: '辛巳' },
    day:   { gan: '丙', zhi: '寅', ganZhi: '丙寅' },
    hour:  { gan: '乙', zhi: '未', ganZhi: '乙未' }
  },

  // 藏干
  cangGan: {
    year:  ['丁', '己'],
    month: ['丙', '庚', '戊'],
    day:   ['甲', '丙', '戊'],
    hour:  ['乙', '己', '丁']
  },

  // 十神
  shiShen: {
    year:  { gan: '偏财', zhi: '劫财', cangGan: [...] },
    month: { gan: '正财', zhi: '比肩', cangGan: [...] },
    day:   { gan: '日主', zhi: '偏印', cangGan: [...] },
    hour:  { gan: '正印', zhi: '正官', cangGan: [...] }
  },

  // 五行
  wuXing: {
    count: { 金: 2, 水: 0, 木: 2, 火: 3, 土: 1 },
    score: { 金: 15.0, 水: 3.0, 木: 18.0, 火: 27.0, 土: 17.0 },
    percent: { 金: 19, 水: 4, 木: 22, 火: 34, 土: 21 }
  },

  // 阴阳
  yinYang: { yang: 4, yin: 4 },

  // 刑冲合害
  relations: {
    gan: [{ type: '合', items: ['甲', '己'], result: '土' }],
    zhi: [{ type: '六合', items: ['寅', '亥'], result: '木' }]
  },

  // 格局
  formations: {
    sanHui: [],
    sanHe: [{ zhi: ['申','子','辰'], element: '水', ... }],
    liuHe: [{ zhi: ['寅','亥'], element: '木', ... }],
    banHe: [],
    gongHe: [],
    gongHui: []
  },

  // 大运
  daYun: {
    direction: '顺',
    startAge: 3,
    startYear: 1993,
    startDesc: '出生后3年6个月20天起运',
    jiaoyunDesc: '每逢 癸、戊 年5月15日14时交脱大运',
    cycles: [
      {
        index: 1,
        ganZhi: '壬午',
        ageRange: [4, 13],
        yearRange: [1994, 2003],
        zhangSheng: '长生',
        liuNian: [
          { year: 1994, age: 4, ganZhi: '甲戌' },
          ...
        ]
      },
      ...
    ]
  },

  // 农历
  lunar: {
    year: 1990,
    month: 4,
    day: 21,
    isLeap: false,
    monthName: '四月',
    dayName: '廿一',
    yearGanZhi: '庚午'
  },

  // 生肖与星座
  shengXiao: '马',
  xingZuo: '金牛'
}
```

---

## 子模块

### Calendar - 儒略日历

```javascript
import { Calendar } from './src/core/Calendar.js';

// 公历转儒略日
Calendar.toJulianDay(year, month, day, hour, minute, second)

// 儒略日转公历
Calendar.fromJulianDay(jd)  // 返回 [年, 月, 日, 时, 分, 秒]

// 验证日期
Calendar.isValidDate(year, month, day)

// 获取星期
Calendar.getDayOfWeek(year, month, day)  // 0=周日, 1=周一, ...
```

### DateConverter - 公农历转换

```javascript
import { DateConverter } from './src/converter/DateConverter.js';

// 公历转农历
DateConverter.solarToLunar(year, month, day)
// 返回: { year, month, day, isLeap, monthName, dayName, yearGanZhi }

// 农历转公历
DateConverter.lunarToSolar(year, month, day, isLeap)
// 返回: { year, month, day }

// 获取闰月
DateConverter.getLeapMonth(year)  // 返回闰几月，0表示无闰月
```

### Astronomy - 天文计算

```javascript
import { Astronomy } from './src/core/Astronomy.js';

// 获取24节气
Astronomy.getAdjustedSolarTerms(year, useCorrection)
// 返回: 节气儒略日数组（从春分开始）

// 真太阳时转换
Astronomy.toTrueSolarTime(jd, longitude, latitude)

// 日期转真太阳时
Astronomy.dateToTrueSolarTime(year, month, day, hour, minute, second, longitude, latitude)

// 获取星座
Astronomy.getZodiacSign(year, month, day, hour, minute, second)

// 获取节气表
Astronomy.getSolarTermsTable(year)
// 返回: [{ name: '立春', jd, date: [年,月,日,时,分,秒] }, ...]
```

### BaZiCalculator - 四柱计算

```javascript
import { BaZiCalculator } from './src/calculator/BaZiCalculator.js';

// 计算四柱
BaZiCalculator.calculate(year, month, day, hour, minute, second, options)
// options: { useEarlyZi, useTrueSolarTime, longitude, latitude }

// 从日期对象计算
BaZiCalculator.fromDatetime(datetime, options)

// 获取立春时刻
BaZiCalculator.getLiChunTime(year)
```

### WuXingCalculator - 五行分析

```javascript
import { WuXingCalculator } from './src/calculator/WuXingCalculator.js';

// 完整计算
WuXingCalculator.calculate(ganIndices, zhiIndices, options)
// options: { includeCangGan: true, pillarWeights: {...} }
// 返回: { count, score, percent, totalScore, details }

// 简化计算
WuXingCalculator.calculateSimple(ganIndices, zhiIndices)

// 阴阳统计
WuXingCalculator.calculateYinYang(ganIndices, zhiIndices)

// 五行强弱分析
WuXingCalculator.analyzeStrength(wuXingResult, dayGanIndex)

// 获取缺失五行
WuXingCalculator.getMissing(countOrGanZhi)
```

### ShiShenCalculator - 十神计算

```javascript
import { ShiShenCalculator } from './src/calculator/ShiShenCalculator.js';

// 天干十神
ShiShenCalculator.getShiShenForGan(dayGanIndex, targetGanIndex)

// 地支十神（基于本气）
ShiShenCalculator.getShiShenForZhi(dayGanIndex, targetZhiIndex)

// 藏干十神
ShiShenCalculator.getCangGanShiShen(dayGanIndex, zhiIndex)

// 完整计算
ShiShenCalculator.calculate(ganIndices, zhiIndices)

// 十神统计
ShiShenCalculator.countShiShen(ganIndices, zhiIndices, options)
```

### RelationshipAnalyzer - 刑冲合害分析

```javascript
import { RelationshipAnalyzer } from './src/analysis/RelationshipAnalyzer.js';

// 完整分析
RelationshipAnalyzer.analyze(ganIndices, zhiIndices)
// 返回: { gan: [...], zhi: [...] }

// 简化分析
RelationshipAnalyzer.analyzeSimple(ganIndices, zhiIndices)

// 按类型分组
RelationshipAnalyzer.groupByType(analysisResult)

// 统计关系数量
RelationshipAnalyzer.countRelations(analysisResult)

// 检查是否存在某种关系
RelationshipAnalyzer.hasRelationType(analysisResult, typeName)

// 提取格局（三会三合六合等）
RelationshipAnalyzer.extractFormations(zhiIndices)
// 返回: { sanHui, sanHe, liuHe, banHe, gongHe, gongHui }
```

### DaYunAnalyzer - 大运分析

```javascript
import { DaYunAnalyzer } from './src/analysis/DaYunAnalyzer.js';

// 计算大运
DaYunAnalyzer.calculate(params, options)
// params: { gender, year, month, day, hour, minute, second,
//           ganIndices, zhiIndices, jqYear, solarTerms }
// options: { cycleCount: 9, preciseDaYun: true }

// 从八字结果计算
DaYunAnalyzer.fromBaZi(baziResult, gender, options)

// 获取指定年龄的运势
DaYunAnalyzer.getAtAge(daYunResult, age)

// 获取指定年份的运势
DaYunAnalyzer.getAtYear(daYunResult, year)

// 获取大运列表
DaYunAnalyzer.getDaYunList(daYunResult)

// 格式化表格
DaYunAnalyzer.formatTable(daYunResult)
```

### SexagenaryConverter - 干支转换

```javascript
import { SexagenaryConverter } from './src/converter/SexagenaryConverter.js';

// 获取天干
SexagenaryConverter.getGan(index)

// 获取地支
SexagenaryConverter.getZhi(index)

// 获取干支
SexagenaryConverter.getGanZhi(ganIndex, zhiIndex)

// 获取藏干
SexagenaryConverter.getCangGan(zhiIndex)

// 获取生肖
SexagenaryConverter.getShengXiao(zhiIndex)

// 格式化八字
SexagenaryConverter.formatBaZi(ganIndices, zhiIndices)

// 解析八字
SexagenaryConverter.parseBaZi(baziStr)
```

---

## 常量

```javascript
import * as Constants from './src/core/Constants.js';

Constants.TIAN_GAN      // ['甲', '乙', '丙', ...]
Constants.DI_ZHI        // ['子', '丑', '寅', ...]
Constants.WU_XING       // ['金', '水', '木', '火', '土']
Constants.GAN_ZHI       // ['甲子', '乙丑', ...]（60甲子）
Constants.SHENG_XIAO    // ['鼠', '牛', '虎', ...]
Constants.XING_ZUO      // ['摩羯', '水瓶', ...]
Constants.JIE_QI        // ['春分', '清明', ...]
Constants.ZHANG_SHENG   // ['长生', '沐浴', ...]
Constants.SHI_SHEN_FULL // ['正印', '偏印', ...]
Constants.LUNAR_MONTH   // ['正月', '二月', ...]
Constants.LUNAR_DAY     // ['初一', '初二', ...]
Constants.CANG_GAN      // 地支藏干表
```

---

## 日期范围

| 功能 | 范围 |
|------|------|
| 公历儒略日转换 | -1000 ~ 3000 年 |
| 农历转换 | -104 ~ 2300 年 |
| 四柱八字 | -720 ~ 2300 年 |
| 与寿星万年历一致 | -721 ~ 2300 年 |

---

## 精确度

- 节气计算误差：±20秒
- 真太阳时误差：±20秒
- 农历计算：与寿星万年历完全一致（-721至2300年）
