/**
 * 十神计算模块
 * @module calculator/ShiShenCalculator
 */

import {
  TIAN_GAN,
  DI_ZHI,
  SHI_SHEN_FULL,
  SHI_SHEN_SHORT,
  SHI_SHEN_CATEGORY,
  DAY_GAN_SHI_SHEN,
  DAY_ZHI_SHI_SHEN,
  CANG_GAN
} from '../core/Constants.js';

/**
 * 十神计算器
 */
export class ShiShenCalculator {
  /**
   * 根据日干和目标天干计算十神
   * @param {number} dayGanIndex - 日干索引（0-9）
   * @param {number} targetGanIndex - 目标天干索引（0-9）
   * @returns {Object} {index: 十神索引, name: 十神全称, short: 十神简称}
   */
  static getShiShenForGan(dayGanIndex, targetGanIndex) {
    dayGanIndex = ((Math.floor(Number(dayGanIndex) || 0) % 10) + 10) % 10;
    targetGanIndex = ((Math.floor(Number(targetGanIndex) || 0) % 10) + 10) % 10;

    const shiShenIndex = DAY_GAN_SHI_SHEN[dayGanIndex][targetGanIndex];

    return {
      index: shiShenIndex,
      name: SHI_SHEN_FULL[shiShenIndex],
      short: SHI_SHEN_SHORT[shiShenIndex],
      category: SHI_SHEN_CATEGORY[Math.floor(shiShenIndex / 2)]
    };
  }

  /**
   * 根据日干和目标地支计算十神（基于地支本气）
   * @param {number} dayGanIndex - 日干索引（0-9）
   * @param {number} targetZhiIndex - 目标地支索引（0-11）
   * @returns {Object} {index: 十神索引, name: 十神全称, short: 十神简称}
   */
  static getShiShenForZhi(dayGanIndex, targetZhiIndex) {
    dayGanIndex = ((Math.floor(Number(dayGanIndex) || 0) % 10) + 10) % 10;
    targetZhiIndex = ((Math.floor(Number(targetZhiIndex) || 0) % 12) + 12) % 12;

    const shiShenIndex = DAY_ZHI_SHI_SHEN[targetZhiIndex][dayGanIndex];

    return {
      index: shiShenIndex,
      name: SHI_SHEN_FULL[shiShenIndex],
      short: SHI_SHEN_SHORT[shiShenIndex],
      category: SHI_SHEN_CATEGORY[Math.floor(shiShenIndex / 2)]
    };
  }

  /**
   * 获取地支藏干的十神
   * @param {number} dayGanIndex - 日干索引
   * @param {number} zhiIndex - 地支索引
   * @returns {Object[]} 藏干十神数组 [{gan, type, shiShen}]
   */
  static getCangGanShiShen(dayGanIndex, zhiIndex) {
    dayGanIndex = ((Math.floor(Number(dayGanIndex) || 0) % 10) + 10) % 10;
    zhiIndex = ((Math.floor(Number(zhiIndex) || 0) % 12) + 12) % 12;

    const cangGan = CANG_GAN[zhiIndex];
    const result = [];

    const types = ['main', 'middle', 'residual'];
    const typeNames = ['本气', '中气', '余气'];

    for (let i = 0; i < 3; i++) {
      if (cangGan[i] >= 0) {
        const shiShen = ShiShenCalculator.getShiShenForGan(dayGanIndex, cangGan[i]);
        result.push({
          gan: TIAN_GAN[cangGan[i]],
          ganIndex: cangGan[i],
          type: types[i],
          typeName: typeNames[i],
          shiShen: shiShen
        });
      }
    }

    return result;
  }

  /**
   * 计算八字四柱的完整十神
   * @param {number[]} ganIndices - 四柱天干索引 [年, 月, 日, 时]
   * @param {number[]} zhiIndices - 四柱地支索引 [年, 月, 日, 时]
   * @returns {Object} 四柱十神信息
   */
  static calculate(ganIndices, zhiIndices) {
    const dayGanIndex = ganIndices[2]; // 日干
    const pillars = ['year', 'month', 'day', 'hour'];
    const result = {};

    for (let i = 0; i < 4; i++) {
      const pillar = pillars[i];

      // 天干十神
      let ganShiShen;
      if (i === 2) {
        // 日干本身为日主
        ganShiShen = {
          index: -1,
          name: '日主',
          short: '主',
          category: '日主'
        };
      } else {
        ganShiShen = ShiShenCalculator.getShiShenForGan(dayGanIndex, ganIndices[i]);
      }

      // 地支十神（基于本气）
      const zhiShiShen = ShiShenCalculator.getShiShenForZhi(dayGanIndex, zhiIndices[i]);

      // 藏干十神
      const cangGanShiShen = ShiShenCalculator.getCangGanShiShen(dayGanIndex, zhiIndices[i]);

      result[pillar] = {
        gan: {
          char: TIAN_GAN[ganIndices[i]],
          shiShen: ganShiShen.name,
          shiShenShort: ganShiShen.short,
          category: ganShiShen.category
        },
        zhi: {
          char: DI_ZHI[zhiIndices[i]],
          shiShen: zhiShiShen.name,
          shiShenShort: zhiShiShen.short,
          category: zhiShiShen.category,
          cangGan: cangGanShiShen
        }
      };
    }

    return result;
  }

  /**
   * 统计十神数量
   * @param {number[]} ganIndices - 四柱天干索引
   * @param {number[]} zhiIndices - 四柱地支索引
   * @param {Object} [options={}] - 选项
   * @param {boolean} [options.includeZhiMain=true] - 是否包含地支本气
   * @param {boolean} [options.includeCangGan=false] - 是否包含所有藏干
   * @returns {Object} 十神统计 {name: count}
   */
  static countShiShen(ganIndices, zhiIndices, options = {}) {
    const {
      includeZhiMain = true,
      includeCangGan = false
    } = options;

    const dayGanIndex = ganIndices[2];
    const count = {};

    // 初始化计数
    for (const name of SHI_SHEN_FULL) {
      count[name] = 0;
    }

    // 统计天干十神（排除日主）
    for (let i = 0; i < 4; i++) {
      if (i === 2) continue; // 跳过日干

      const shiShen = ShiShenCalculator.getShiShenForGan(dayGanIndex, ganIndices[i]);
      count[shiShen.name]++;
    }

    // 统计地支十神
    if (includeZhiMain || includeCangGan) {
      for (let i = 0; i < 4; i++) {
        if (includeCangGan) {
          // 包含所有藏干
          const cangGanList = ShiShenCalculator.getCangGanShiShen(dayGanIndex, zhiIndices[i]);
          for (const cg of cangGanList) {
            count[cg.shiShen.name]++;
          }
        } else if (includeZhiMain) {
          // 仅包含本气
          const shiShen = ShiShenCalculator.getShiShenForZhi(dayGanIndex, zhiIndices[i]);
          count[shiShen.name]++;
        }
      }
    }

    return count;
  }

  /**
   * 按类别统计十神
   * @param {Object} shiShenCount - countShiShen的返回结果
   * @returns {Object} 按类别分组的统计
   */
  static countByCategory(shiShenCount) {
    const categoryCount = {};

    for (const cat of SHI_SHEN_CATEGORY) {
      categoryCount[cat] = 0;
    }

    for (let i = 0; i < SHI_SHEN_FULL.length; i++) {
      const name = SHI_SHEN_FULL[i];
      const category = SHI_SHEN_CATEGORY[Math.floor(i / 2)];
      categoryCount[category] += shiShenCount[name] || 0;
    }

    return categoryCount;
  }

  /**
   * 获取十神名称
   * @param {number} index - 十神索引（0-9）
   * @param {boolean} [useShort=false] - 是否使用简称
   * @returns {string} 十神名称
   */
  static getName(index, useShort = false) {
    index = ((Math.floor(Number(index) || 0) % 10) + 10) % 10;
    return useShort ? SHI_SHEN_SHORT[index] : SHI_SHEN_FULL[index];
  }

  /**
   * 根据十神名称获取索引
   * @param {string} name - 十神名称（全称或简称）
   * @returns {number} 索引，未找到返回-1
   */
  static getIndex(name) {
    let index = SHI_SHEN_FULL.indexOf(name);
    if (index === -1) {
      index = SHI_SHEN_SHORT.indexOf(name);
    }
    return index;
  }

  /**
   * 获取十神的类别
   * @param {number|string} shiShen - 十神索引或名称
   * @returns {string} 类别名称
   */
  static getCategory(shiShen) {
    let index;
    if (typeof shiShen === 'string') {
      index = ShiShenCalculator.getIndex(shiShen);
    } else {
      index = Math.floor(Number(shiShen) || 0);
    }

    if (index < 0 || index > 9) return '';
    return SHI_SHEN_CATEGORY[Math.floor(index / 2)];
  }

  /**
   * 判断两个十神是否为同类
   * @param {number|string} ss1 - 十神1
   * @param {number|string} ss2 - 十神2
   * @returns {boolean}
   */
  static isSameCategory(ss1, ss2) {
    return ShiShenCalculator.getCategory(ss1) === ShiShenCalculator.getCategory(ss2);
  }

  /**
   * 获取十神的阴阳属性
   * @param {number|string} shiShen - 十神索引或名称
   * @returns {string} '阳'或'阴'
   */
  static getYinYang(shiShen) {
    let index;
    if (typeof shiShen === 'string') {
      index = ShiShenCalculator.getIndex(shiShen);
    } else {
      index = Math.floor(Number(shiShen) || 0);
    }

    if (index < 0 || index > 9) return '';
    // 偶数索引为阳，奇数索引为阴
    // 正印(0)阳, 偏印(1)阴, 比肩(2)阳, 劫财(3)阴...
    return index % 2 === 0 ? '正' : '偏';
  }

  /**
   * 获取格式化的十神表格
   * @param {Object} shiShenResult - calculate()的返回结果
   * @returns {string[][]} 表格数据，每行为[柱名, 天干, 天干十神, 地支, 地支十神, 藏干...]
   */
  static formatTable(shiShenResult) {
    const table = [];
    const pillars = ['year', 'month', 'day', 'hour'];
    const pillarNames = ['年柱', '月柱', '日柱', '时柱'];

    for (let i = 0; i < 4; i++) {
      const pillar = pillars[i];
      const data = shiShenResult[pillar];

      const row = [
        pillarNames[i],
        data.gan.char,
        data.gan.shiShen,
        data.zhi.char,
        data.zhi.shiShen
      ];

      // 添加藏干
      for (const cg of data.zhi.cangGan) {
        row.push(`${cg.gan}(${cg.shiShen.short})`);
      }

      table.push(row);
    }

    return table;
  }
}

export default ShiShenCalculator;
