# JavaScript-For-Paipan 八字排盘库

模块化的中国传统八字排盘计算库。

- 四柱八字计算（-720 ~ 2300 年）
- 真太阳时排盘（经纬度校正）
- 五行分析（含分数和占比）
- 十神计算
- 刑冲合害关系分析（71种模式）
- 三会、三合、六合等格局检测
- 大运流年计算
- 公历农历互转（-721 ~ 2300 年与寿星万年历一致）

## 设计原则

1. **只计算确定的、客观的数据**，不进行主观解读
2. **性别参数**：`1 = 男`，`0 = 女`
3. **输出纯净简洁**：四柱只输出8个汉字

## 快速开始

```javascript
import { BaZi } from './src/index.js';

const bazi = new BaZi({
  useTrueSolarTime: true,  // 是否使用真太阳时
  longitude: 116.4,        // 经度
  latitude: 39.9           // 纬度
});

const result = bazi.calculate({
  gender: 1,      // 1=男, 0=女
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30
});

console.log(result.bazi);           // 庚午辛巳庚辰癸未
console.log(result.wuXing.percent); // {金: 39, 水: 14, 木: 8, 火: 16, 土: 23}
console.log(result.daYun.cycles);   // 大运周期数组（9个十年周期）
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

## 项目结构

```
├── src/                           # 源代码
│   ├── core/
│   │   ├── Constants.js           # 天干地支五行十神等常量
│   │   ├── Calendar.js            # 儒略日转换
│   │   └── Astronomy.js           # 节气、真太阳时、星座
│   ├── converter/
│   │   ├── DateConverter.js       # 公历农历转换
│   │   └── SexagenaryConverter.js # 干支转换
│   ├── calculator/
│   │   ├── BaZiCalculator.js      # 四柱计算
│   │   ├── WuXingCalculator.js    # 五行分析（含分数/占比）
│   │   └── ShiShenCalculator.js   # 十神计算
│   ├── analysis/
│   │   ├── RelationshipAnalyzer.js # 刑冲合害及格局检测
│   │   └── DaYunAnalyzer.js        # 大运流年
│   ├── data/
│   │   ├── GXData.js              # 关系数据（71种模式）
│   │   └── CalendarCorrections.js # 农历修正数据
│   ├── BaZi.js                    # 主入口
│   └── index.js                   # 导出
├── docs/
│   └── API.md                     # API 文档
├── legacy/                        # 遗留代码（仅供参考）
├── demo.html                      # 演示页面
└── package.json
```

## 返回数据结构

```javascript
{
  // 四柱八字
  bazi: '庚午辛巳庚辰癸未',
  pillars: {
    year:  { gan: '庚', zhi: '午', ganZhi: '庚午' },
    month: { gan: '辛', zhi: '巳', ganZhi: '辛巳' },
    day:   { gan: '庚', zhi: '辰', ganZhi: '庚辰' },
    hour:  { gan: '癸', zhi: '未', ganZhi: '癸未' }
  },

  // 十神
  shiShen: {
    year:  { gan: '比肩', zhi: '正官', cangGan: [...] },
    month: { gan: '劫财', zhi: '偏官', cangGan: [...] },
    day:   { gan: '日主', zhi: '偏印', cangGan: [...] },
    hour:  { gan: '正印', zhi: '正印', cangGan: [...] }
  },

  // 五行（含分数和占比）
  wuXing: {
    count: { 金: 3, 水: 1, 木: 0, 火: 2, 土: 2 },
    score: { 金: 31, 水: 11, 木: 6, 火: 13, 土: 18 },
    percent: { 金: 39, 水: 14, 木: 8, 火: 16, 土: 23 }
  },

  // 刑冲合害
  relations: {
    gan: [...],
    zhi: [...]
  },

  // 格局
  formations: {
    sanHui: [],   // 三会
    sanHe: [],    // 三合
    liuHe: [],    // 六合
    banHe: [],    // 半合
    gongHe: [],   // 拱合
    gongHui: []   // 拱会
  },

  // 大运（9个十年周期）
  daYun: {
    direction: '逆',
    startAge: 3,
    startYear: 1993,
    cycles: [
      {
        ganZhi: '庚辰',
        ageRange: [4, 13],
        zhangSheng: '养',
        liuNian: [...]  // 10个流年
      },
      // ... 共9个周期
    ]
  },

  // 农历
  lunar: {
    year: 1990,
    month: 4,
    day: 21,
    monthName: '四月',
    yearGanZhi: '庚午'
  },

  // 生肖与星座
  shengXiao: '马',
  xingZuo: '金牛'
}
```

## 演示

打开 `demo.html` 查看交互式演示。

## API 文档

详见 [docs/API.md](docs/API.md)

---

## 历法原理

### 1. 儒略日历

以公元前 4713 年 1 月 1 日 12 时为起点，每天加一。方便各种计算，比如已知起点日为周一可求得任一日期的星期，已知起点日的干支可求得任一日期的干支。

### 2. 公历（阳历、格里历）

以地球绕太阳公转计算。把椭圆轨道均分为 24 等分，可求得二十四节气；12 等分则为十二星座。节气计算误差在 20 秒内。

### 3. 农历（阴阳历）

以月球绕地一周为一个月，引入闰月使之与公转齐平。

### 4. 干支历

与二十四节气相关。八字组合共有 518400 种（不分早晚子时），且一个八字出现后，至少要 60 年后才会再出现。

### 5. 真太阳时

北京标准时间是东经 120 度的平太阳时。真太阳时考虑地球自转速度变化和太阳倾角，正午 12 点时日晷影子最短。

### 6. 精确度

- 节气计算：±20秒
- 真太阳时：±20秒（考虑纬度）
- 农历：-721 ~ 2300 年与寿星万年历完全一致

## 参考来源

- 算法原理：http://www.bieyu.com/
- 农历修正：寿星万年历 http://www.nongli.net/sxwnl/

## 许可证

MIT License
