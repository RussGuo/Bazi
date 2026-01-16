/**
 * 五行分析模块
 * @module calculator/WuXingCalculator
 */

import {
  WU_XING,
  TIAN_GAN,
  DI_ZHI,
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  CANG_GAN
} from '../core/Constants.js';

/**
 * 五行分数权重配置
 * 本气、中气、余气的权重比例
 */
const CANG_GAN_WEIGHTS = {
  main: 0.6,     // 本气权重
  middle: 0.3,   // 中气权重
  residual: 0.1  // 余气权重
};

/**
 * 四柱基础分数
 * 年柱、月柱、日柱、时柱的基础权重
 */
const PILLAR_WEIGHTS = {
  year: 1.0,
  month: 1.0,
  day: 1.0,
  hour: 1.0
};

/**
 * 天干基础分数
 */
const GAN_SCORE = 10;

/**
 * 地支基础分数
 */
const ZHI_SCORE = 10;

/**
 * 五行计算器
 */
export class WuXingCalculator {
  /**
   * 计算八字的五行分布
   * @param {number[]} ganIndices - 四柱天干索引 [年, 月, 日, 时]
   * @param {number[]} zhiIndices - 四柱地支索引 [年, 月, 日, 时]
   * @param {Object} [options={}] - 计算选项
   * @param {boolean} [options.includeCangGan=true] - 是否包含藏干
   * @param {Object} [options.pillarWeights] - 四柱权重覆盖
   * @returns {Object} 五行分析结果
   */
  static calculate(ganIndices, zhiIndices, options = {}) {
    const {
      includeCangGan = true,
      pillarWeights = PILLAR_WEIGHTS
    } = options;

    // 初始化五行计数和分数
    const count = { 金: 0, 水: 0, 木: 0, 火: 0, 土: 0 };
    const score = { 金: 0, 水: 0, 木: 0, 火: 0, 土: 0 };
    const details = {
      gan: [],   // 天干五行详情
      zhi: [],   // 地支五行详情
      cangGan: [] // 藏干五行详情
    };

    const pillars = ['year', 'month', 'day', 'hour'];

    // 计算天干五行
    for (let i = 0; i < 4; i++) {
      const ganIndex = ganIndices[i];
      const wuXingIndex = TIAN_GAN_WU_XING[ganIndex];
      const wuXing = WU_XING[wuXingIndex];
      const weight = pillarWeights[pillars[i]] || 1.0;
      const ganScore = GAN_SCORE * weight;

      count[wuXing]++;
      score[wuXing] += ganScore;

      details.gan.push({
        pillar: pillars[i],
        gan: TIAN_GAN[ganIndex],
        wuXing: wuXing,
        score: ganScore
      });
    }

    // 计算地支五行（本气）
    for (let i = 0; i < 4; i++) {
      const zhiIndex = zhiIndices[i];
      const wuXingIndex = DI_ZHI_WU_XING[zhiIndex];
      const wuXing = WU_XING[wuXingIndex];
      const weight = pillarWeights[pillars[i]] || 1.0;

      if (!includeCangGan) {
        // 不计藏干时，地支直接计分
        const zhiScore = ZHI_SCORE * weight;
        count[wuXing]++;
        score[wuXing] += zhiScore;

        details.zhi.push({
          pillar: pillars[i],
          zhi: DI_ZHI[zhiIndex],
          wuXing: wuXing,
          score: zhiScore
        });
      } else {
        // 计藏干时，按藏干权重计分
        const cangGan = CANG_GAN[zhiIndex];
        const zhiDetail = {
          pillar: pillars[i],
          zhi: DI_ZHI[zhiIndex],
          cangGan: []
        };

        // 本气
        if (cangGan[0] >= 0) {
          const cgWuXingIndex = TIAN_GAN_WU_XING[cangGan[0]];
          const cgWuXing = WU_XING[cgWuXingIndex];
          const cgScore = ZHI_SCORE * weight * CANG_GAN_WEIGHTS.main;

          score[cgWuXing] += cgScore;
          zhiDetail.cangGan.push({
            type: 'main',
            gan: TIAN_GAN[cangGan[0]],
            wuXing: cgWuXing,
            score: cgScore
          });
        }

        // 中气
        if (cangGan[1] >= 0) {
          const cgWuXingIndex = TIAN_GAN_WU_XING[cangGan[1]];
          const cgWuXing = WU_XING[cgWuXingIndex];
          const cgScore = ZHI_SCORE * weight * CANG_GAN_WEIGHTS.middle;

          score[cgWuXing] += cgScore;
          zhiDetail.cangGan.push({
            type: 'middle',
            gan: TIAN_GAN[cangGan[1]],
            wuXing: cgWuXing,
            score: cgScore
          });
        }

        // 余气
        if (cangGan[2] >= 0) {
          const cgWuXingIndex = TIAN_GAN_WU_XING[cangGan[2]];
          const cgWuXing = WU_XING[cgWuXingIndex];
          const cgScore = ZHI_SCORE * weight * CANG_GAN_WEIGHTS.residual;

          score[cgWuXing] += cgScore;
          zhiDetail.cangGan.push({
            type: 'residual',
            gan: TIAN_GAN[cangGan[2]],
            wuXing: cgWuXing,
            score: cgScore
          });
        }

        // 地支本气计入count
        count[wuXing]++;
        details.cangGan.push(zhiDetail);
      }
    }

    // 计算总分和百分比
    const totalScore = Object.values(score).reduce((sum, s) => sum + s, 0);
    const percent = {};

    for (const wx of WU_XING) {
      percent[wx] = totalScore > 0 ? Math.round(score[wx] / totalScore * 100) : 0;
    }

    // 四舍五入分数
    for (const wx of WU_XING) {
      score[wx] = Math.round(score[wx] * 10) / 10;
    }

    return {
      count,
      score,
      percent,
      totalScore: Math.round(totalScore * 10) / 10,
      details
    };
  }

  /**
   * 简化计算（只返回核心数据）
   * @param {number[]} ganIndices - 四柱天干索引
   * @param {number[]} zhiIndices - 四柱地支索引
   * @returns {Object} {count, score, percent}
   */
  static calculateSimple(ganIndices, zhiIndices) {
    const result = WuXingCalculator.calculate(ganIndices, zhiIndices);
    return {
      count: result.count,
      score: result.score,
      percent: result.percent
    };
  }

  /**
   * 计算阴阳分布
   * @param {number[]} ganIndices - 四柱天干索引
   * @param {number[]} zhiIndices - 四柱地支索引
   * @returns {Object} {yang: 阳数量, yin: 阴数量}
   */
  static calculateYinYang(ganIndices, zhiIndices) {
    let yang = 0;
    let yin = 0;

    // 统计天干阴阳
    for (const ganIndex of ganIndices) {
      if (ganIndex % 2 === 0) {
        yang++;
      } else {
        yin++;
      }
    }

    // 统计地支阴阳
    for (const zhiIndex of zhiIndices) {
      if (zhiIndex % 2 === 0) {
        yang++;
      } else {
        yin++;
      }
    }

    return { yang, yin };
  }

  /**
   * 获取五行生克关系
   * @param {string} wuXing - 五行名称
   * @returns {Object} {sheng: 所生, keBy: 所克, shengBy: 生我, ke: 克我}
   */
  static getWuXingRelation(wuXing) {
    const relations = {
      '金': { sheng: '水', ke: '木', shengBy: '土', keBy: '火' },
      '水': { sheng: '木', ke: '火', shengBy: '金', keBy: '土' },
      '木': { sheng: '火', ke: '土', shengBy: '水', keBy: '金' },
      '火': { sheng: '土', ke: '金', shengBy: '木', keBy: '水' },
      '土': { sheng: '金', ke: '水', shengBy: '火', keBy: '木' }
    };

    return relations[wuXing] || null;
  }

  /**
   * 判断两个五行的关系
   * @param {string} wx1 - 五行1
   * @param {string} wx2 - 五行2
   * @returns {string} 关系描述：'同', '生', '被生', '克', '被克'
   */
  static getRelationBetween(wx1, wx2) {
    if (wx1 === wx2) return '同';

    const relation = WuXingCalculator.getWuXingRelation(wx1);
    if (!relation) return '';

    if (relation.sheng === wx2) return '生';
    if (relation.ke === wx2) return '克';
    if (relation.shengBy === wx2) return '被生';
    if (relation.keBy === wx2) return '被克';

    return '';
  }

  /**
   * 分析八字五行的强弱
   * @param {Object} wuXingResult - calculate()的返回结果
   * @param {number} dayGanIndex - 日干索引
   * @returns {Object} 五行强弱分析
   */
  static analyzeStrength(wuXingResult, dayGanIndex) {
    const dayWuXingIndex = TIAN_GAN_WU_XING[dayGanIndex];
    const dayWuXing = WU_XING[dayWuXingIndex];
    const relation = WuXingCalculator.getWuXingRelation(dayWuXing);

    const { score, percent } = wuXingResult;

    // 计算日主得分
    const selfScore = score[dayWuXing];
    const helpScore = score[relation.shengBy]; // 生我者
    const sameScore = selfScore + helpScore;

    // 计算消耗分
    const drainScore = score[relation.sheng] + score[relation.ke]; // 我生、我克
    const harmScore = score[relation.keBy]; // 克我

    // 判断强弱
    const totalStrength = sameScore / (drainScore + harmScore + 0.01); // 防止除零

    let strengthLevel;
    if (totalStrength > 1.5) {
      strengthLevel = '强';
    } else if (totalStrength > 1.0) {
      strengthLevel = '偏强';
    } else if (totalStrength > 0.67) {
      strengthLevel = '偏弱';
    } else {
      strengthLevel = '弱';
    }

    return {
      dayWuXing,
      selfScore,
      helpScore,
      sameScore,
      drainScore,
      harmScore,
      strengthRatio: Math.round(totalStrength * 100) / 100,
      strengthLevel,
      analysis: {
        selfElement: dayWuXing,
        helpElement: relation.shengBy,
        drainElements: [relation.sheng, relation.ke],
        harmElement: relation.keBy
      }
    };
  }

  /**
   * 获取五行缺失
   * @param {Object} countOrGanZhi - count对象或{ganIndices, zhiIndices}
   * @returns {string[]} 缺失的五行
   */
  static getMissing(countOrGanZhi) {
    let count;

    if (countOrGanZhi.ganIndices && countOrGanZhi.zhiIndices) {
      const result = WuXingCalculator.calculate(
        countOrGanZhi.ganIndices,
        countOrGanZhi.zhiIndices,
        { includeCangGan: false }
      );
      count = result.count;
    } else {
      count = countOrGanZhi;
    }

    const missing = [];
    for (const wx of WU_XING) {
      if (!count[wx] || count[wx] === 0) {
        missing.push(wx);
      }
    }

    return missing;
  }

  /**
   * 获取五行最旺和最弱
   * @param {Object} score - 五行分数对象
   * @returns {Object} {strongest: 最旺五行, weakest: 最弱五行}
   */
  static getStrongestAndWeakest(score) {
    let strongest = WU_XING[0];
    let weakest = WU_XING[0];
    let maxScore = score[WU_XING[0]];
    let minScore = score[WU_XING[0]];

    for (const wx of WU_XING) {
      if (score[wx] > maxScore) {
        maxScore = score[wx];
        strongest = wx;
      }
      if (score[wx] < minScore) {
        minScore = score[wx];
        weakest = wx;
      }
    }

    return {
      strongest,
      strongestScore: maxScore,
      weakest,
      weakestScore: minScore
    };
  }
}

export default WuXingCalculator;
