/**
 * 干支转换工具模块
 * @module converter/SexagenaryConverter
 */

import {
  TIAN_GAN,
  DI_ZHI,
  GAN_ZHI,
  WU_XING,
  TIAN_GAN_WU_XING,
  DI_ZHI_WU_XING,
  YIN_YANG,
  CANG_GAN,
  SHENG_XIAO
} from '../core/Constants.js';

/**
 * 干支转换工具类
 * 处理天干地支的各种转换和计算
 */
export class SexagenaryConverter {
  // ==================== 基础转换 ====================

  /**
   * 获取天干名称
   * @param {number} index - 天干索引（0-9）
   * @returns {string} 天干名称
   */
  static getGan(index) {
    index = ((Math.floor(Number(index) || 0) % 10) + 10) % 10;
    return TIAN_GAN[index];
  }

  /**
   * 获取地支名称
   * @param {number} index - 地支索引（0-11）
   * @returns {string} 地支名称
   */
  static getZhi(index) {
    index = ((Math.floor(Number(index) || 0) % 12) + 12) % 12;
    return DI_ZHI[index];
  }

  /**
   * 获取六十甲子名称
   * @param {number} index - 干支索引（0-59）
   * @returns {string} 干支名称
   */
  static getGanZhi(index) {
    index = ((Math.floor(Number(index) || 0) % 60) + 60) % 60;
    return GAN_ZHI[index];
  }

  /**
   * 根据天干地支索引计算六十甲子索引
   * @param {number} ganIndex - 天干索引（0-9）
   * @param {number} zhiIndex - 地支索引（0-11）
   * @returns {number|false} 干支索引，阴阳不配返回false
   */
  static toGanZhiIndex(ganIndex, zhiIndex) {
    ganIndex = Math.floor(Number(ganIndex) || 0);
    zhiIndex = Math.floor(Number(zhiIndex) || 0);

    if (ganIndex < 0 || ganIndex > 9) return false;
    if (zhiIndex < 0 || zhiIndex > 11) return false;

    // 阴阳必须相配
    if ((ganIndex % 2) !== (zhiIndex % 2)) {
      return false;
    }

    return ((10 + ganIndex - zhiIndex) % 10) / 2 * 12 + zhiIndex;
  }

  /**
   * 根据天干名称获取索引
   * @param {string} gan - 天干名称
   * @returns {number} 天干索引，未找到返回-1
   */
  static ganToIndex(gan) {
    return TIAN_GAN.indexOf(gan);
  }

  /**
   * 根据地支名称获取索引
   * @param {string} zhi - 地支名称
   * @returns {number} 地支索引，未找到返回-1
   */
  static zhiToIndex(zhi) {
    return DI_ZHI.indexOf(zhi);
  }

  /**
   * 根据干支名称获取索引
   * @param {string} ganZhi - 干支名称（如"甲子"）
   * @returns {number} 干支索引，未找到返回-1
   */
  static ganZhiToIndex(ganZhi) {
    return GAN_ZHI.indexOf(ganZhi);
  }

  /**
   * 解析干支字符串为天干地支索引
   * @param {string} ganZhi - 干支名称
   * @returns {Object|false} {ganIndex, zhiIndex}，无效返回false
   */
  static parseGanZhi(ganZhi) {
    if (!ganZhi || ganZhi.length !== 2) return false;

    const ganIndex = SexagenaryConverter.ganToIndex(ganZhi[0]);
    const zhiIndex = SexagenaryConverter.zhiToIndex(ganZhi[1]);

    if (ganIndex === -1 || zhiIndex === -1) return false;

    return { ganIndex, zhiIndex };
  }

  // ==================== 五行阴阳 ====================

  /**
   * 获取天干的五行
   * @param {number|string} gan - 天干索引或名称
   * @returns {string} 五行名称
   */
  static getGanWuXing(gan) {
    let index;
    if (typeof gan === 'string') {
      index = SexagenaryConverter.ganToIndex(gan);
    } else {
      index = Math.floor(Number(gan) || 0);
    }
    if (index < 0 || index > 9) return '';
    return WU_XING[TIAN_GAN_WU_XING[index]];
  }

  /**
   * 获取地支的五行
   * @param {number|string} zhi - 地支索引或名称
   * @returns {string} 五行名称
   */
  static getZhiWuXing(zhi) {
    let index;
    if (typeof zhi === 'string') {
      index = SexagenaryConverter.zhiToIndex(zhi);
    } else {
      index = Math.floor(Number(zhi) || 0);
    }
    if (index < 0 || index > 11) return '';
    return WU_XING[DI_ZHI_WU_XING[index]];
  }

  /**
   * 获取天干的阴阳
   * @param {number|string} gan - 天干索引或名称
   * @returns {string} 阴或阳
   */
  static getGanYinYang(gan) {
    let index;
    if (typeof gan === 'string') {
      index = SexagenaryConverter.ganToIndex(gan);
    } else {
      index = Math.floor(Number(gan) || 0);
    }
    if (index < 0 || index > 9) return '';
    return YIN_YANG[index % 2];
  }

  /**
   * 获取地支的阴阳
   * @param {number|string} zhi - 地支索引或名称
   * @returns {string} 阴或阳
   */
  static getZhiYinYang(zhi) {
    let index;
    if (typeof zhi === 'string') {
      index = SexagenaryConverter.zhiToIndex(zhi);
    } else {
      index = Math.floor(Number(zhi) || 0);
    }
    if (index < 0 || index > 11) return '';
    return YIN_YANG[index % 2];
  }

  /**
   * 判断天干是否为阳
   * @param {number|string} gan - 天干索引或名称
   * @returns {boolean}
   */
  static isGanYang(gan) {
    return SexagenaryConverter.getGanYinYang(gan) === '阳';
  }

  /**
   * 判断地支是否为阳
   * @param {number|string} zhi - 地支索引或名称
   * @returns {boolean}
   */
  static isZhiYang(zhi) {
    return SexagenaryConverter.getZhiYinYang(zhi) === '阳';
  }

  // ==================== 藏干 ====================

  /**
   * 获取地支的藏干
   * @param {number|string} zhi - 地支索引或名称
   * @returns {Object} {main: 本气, middle: 中气, residual: 余气}
   */
  static getCangGan(zhi) {
    let index;
    if (typeof zhi === 'string') {
      index = SexagenaryConverter.zhiToIndex(zhi);
    } else {
      index = Math.floor(Number(zhi) || 0);
    }

    if (index < 0 || index > 11) {
      return { main: '', middle: '', residual: '' };
    }

    const cg = CANG_GAN[index];
    return {
      main: cg[0] >= 0 ? TIAN_GAN[cg[0]] : '',
      middle: cg[1] >= 0 ? TIAN_GAN[cg[1]] : '',
      residual: cg[2] >= 0 ? TIAN_GAN[cg[2]] : ''
    };
  }

  /**
   * 获取地支藏干数组
   * @param {number|string} zhi - 地支索引或名称
   * @returns {string[]} 藏干数组
   */
  static getCangGanArray(zhi) {
    const cg = SexagenaryConverter.getCangGan(zhi);
    const result = [];
    if (cg.main) result.push(cg.main);
    if (cg.middle) result.push(cg.middle);
    if (cg.residual) result.push(cg.residual);
    return result;
  }

  // ==================== 生肖 ====================

  /**
   * 根据地支获取生肖
   * @param {number|string} zhi - 地支索引或名称
   * @returns {string} 生肖名称
   */
  static getShengXiao(zhi) {
    let index;
    if (typeof zhi === 'string') {
      index = SexagenaryConverter.zhiToIndex(zhi);
    } else {
      index = Math.floor(Number(zhi) || 0);
    }

    if (index < 0 || index > 11) return '';
    return SHENG_XIAO[index];
  }

  /**
   * 根据年份获取生肖（以立春为界）
   * @param {number} yearGanZhiIndex - 年干支索引
   * @returns {string} 生肖名称
   */
  static getShengXiaoByYear(yearGanZhiIndex) {
    const zhiIndex = yearGanZhiIndex % 12;
    return SHENG_XIAO[zhiIndex];
  }

  /**
   * 获取农历年的干支（以正月初一为界）
   * @param {number} lunarYear - 农历年份
   * @returns {string} 年干支
   */
  static getLunarYearGanZhi(lunarYear) {
    lunarYear = Math.floor(Number(lunarYear) || 0);
    const index = ((lunarYear + 4712 + 24) % 60 + 60) % 60;
    return GAN_ZHI[index];
  }

  // ==================== 干支运算 ====================

  /**
   * 干支向前或向后推算
   * @param {number} ganZhiIndex - 起始干支索引
   * @param {number} steps - 步数（正数向前，负数向后）
   * @returns {number} 新的干支索引
   */
  static advanceGanZhi(ganZhiIndex, steps) {
    ganZhiIndex = Math.floor(Number(ganZhiIndex) || 0);
    steps = Math.floor(Number(steps) || 0);
    return ((ganZhiIndex + steps) % 60 + 60) % 60;
  }

  /**
   * 天干向前或向后推算
   * @param {number} ganIndex - 起始天干索引
   * @param {number} steps - 步数
   * @returns {number} 新的天干索引
   */
  static advanceGan(ganIndex, steps) {
    ganIndex = Math.floor(Number(ganIndex) || 0);
    steps = Math.floor(Number(steps) || 0);
    return ((ganIndex + steps) % 10 + 10) % 10;
  }

  /**
   * 地支向前或向后推算
   * @param {number} zhiIndex - 起始地支索引
   * @param {number} steps - 步数
   * @returns {number} 新的地支索引
   */
  static advanceZhi(zhiIndex, steps) {
    zhiIndex = Math.floor(Number(zhiIndex) || 0);
    steps = Math.floor(Number(steps) || 0);
    return ((zhiIndex + steps) % 12 + 12) % 12;
  }

  /**
   * 计算两个干支之间的距离
   * @param {number} from - 起始干支索引
   * @param {number} to - 目标干支索引
   * @param {boolean} [forward=true] - 是否向前计算
   * @returns {number} 步数
   */
  static ganZhiDistance(from, to, forward = true) {
    from = ((Math.floor(Number(from) || 0) % 60) + 60) % 60;
    to = ((Math.floor(Number(to) || 0) % 60) + 60) % 60;

    if (forward) {
      return (to - from + 60) % 60;
    } else {
      return (from - to + 60) % 60;
    }
  }

  // ==================== 年干支推算月时干支 ====================

  /**
   * 根据年干计算月干起点
   * 甲己之年丙作首，乙庚之岁戊为头
   * 丙辛之年寻庚上，丁壬壬寅顺行流
   * 戊癸之年何处起，甲寅之上好追求
   * @param {number} yearGanIndex - 年干索引
   * @returns {number} 正月（寅月）的天干索引
   */
  static getMonthGanStart(yearGanIndex) {
    yearGanIndex = ((Math.floor(Number(yearGanIndex) || 0) % 10) + 10) % 10;
    // 甲己起丙，乙庚起戊，丙辛起庚，丁壬起壬，戊癸起甲
    const starts = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
    return starts[yearGanIndex];
  }

  /**
   * 根据日干计算时干起点
   * 甲己还加甲，乙庚丙作初
   * 丙辛从戊起，丁壬庚子居
   * 戊癸何方发，壬子是真途
   * @param {number} dayGanIndex - 日干索引
   * @returns {number} 子时的天干索引
   */
  static getHourGanStart(dayGanIndex) {
    dayGanIndex = ((Math.floor(Number(dayGanIndex) || 0) % 10) + 10) % 10;
    // 甲己起甲，乙庚起丙，丙辛起戊，丁壬起庚，戊癸起壬
    const starts = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
    return starts[dayGanIndex];
  }

  /**
   * 根据年干支计算有效的月干支列表
   * @param {number} yearGanZhiIndex - 年干支索引
   * @returns {Object[]} 月干支列表，每项包含 {index, ganZhi, month}
   */
  static getValidMonthGanZhi(yearGanZhiIndex) {
    const yearGanIndex = yearGanZhiIndex % 10;
    const monthGanStart = SexagenaryConverter.getMonthGanStart(yearGanIndex);

    const result = [];
    // 正月对应寅月（地支索引2）
    for (let i = 0; i < 12; i++) {
      const zhiIndex = (i + 2) % 12; // 从寅开始
      const ganIndex = (monthGanStart + i) % 10;
      const ganZhiIndex = SexagenaryConverter.toGanZhiIndex(ganIndex, zhiIndex);

      result.push({
        index: ganZhiIndex,
        ganZhi: GAN_ZHI[ganZhiIndex],
        month: i + 1, // 农历月份
        zhiIndex: zhiIndex
      });
    }

    return result;
  }

  /**
   * 根据日干支计算有效的时干支列表
   * @param {number} dayGanZhiIndex - 日干支索引
   * @param {boolean} [includeNightZi=true] - 是否包含晚子时
   * @returns {Object[]} 时干支列表，每项包含 {index, ganZhi, hour, isNightZi}
   */
  static getValidHourGanZhi(dayGanZhiIndex, includeNightZi = true) {
    const dayGanIndex = dayGanZhiIndex % 10;
    const hourGanStart = SexagenaryConverter.getHourGanStart(dayGanIndex);

    const result = [];

    for (let i = 0; i < 12; i++) {
      const zhiIndex = i;
      const ganIndex = (hourGanStart + i) % 10;
      const ganZhiIndex = SexagenaryConverter.toGanZhiIndex(ganIndex, zhiIndex);

      result.push({
        index: ganZhiIndex,
        ganZhi: GAN_ZHI[ganZhiIndex],
        hour: i * 2 - 1, // 时辰对应的小时起点（-1为23时）
        zhiIndex: zhiIndex,
        isNightZi: false
      });
    }

    // 晚子时（23:00-24:00，算作当天的子时，但日柱不变）
    if (includeNightZi) {
      // 晚子时的日柱是前一天的日柱，所以时柱也要相应调整
      const prevDayGanIndex = (dayGanIndex + 9) % 10; // 前一天
      const nightZiGanStart = SexagenaryConverter.getHourGanStart(prevDayGanIndex);
      const nightZiGanZhiIndex = SexagenaryConverter.toGanZhiIndex(nightZiGanStart, 0);

      result.push({
        index: nightZiGanZhiIndex,
        ganZhi: GAN_ZHI[nightZiGanZhiIndex] + '*',
        hour: 23,
        zhiIndex: 0,
        isNightZi: true
      });
    }

    return result;
  }

  // ==================== 格式化输出 ====================

  /**
   * 将四柱干支索引转换为完整字符串
   * @param {number[]} ganIndices - 四柱天干索引 [年干, 月干, 日干, 时干]
   * @param {number[]} zhiIndices - 四柱地支索引 [年支, 月支, 日支, 时支]
   * @returns {string} 八字字符串（8个字连写）
   */
  static formatBaZi(ganIndices, zhiIndices) {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += SexagenaryConverter.getGan(ganIndices[i]);
      result += SexagenaryConverter.getZhi(zhiIndices[i]);
    }
    return result;
  }

  /**
   * 解析八字字符串为四柱索引
   * @param {string} baZi - 八字字符串（8个字）
   * @returns {Object|false} {ganIndices, zhiIndices}，无效返回false
   */
  static parseBaZi(baZi) {
    if (!baZi || baZi.length !== 8) return false;

    const ganIndices = [];
    const zhiIndices = [];

    for (let i = 0; i < 4; i++) {
      const gan = baZi[i * 2];
      const zhi = baZi[i * 2 + 1];

      const ganIndex = SexagenaryConverter.ganToIndex(gan);
      const zhiIndex = SexagenaryConverter.zhiToIndex(zhi);

      if (ganIndex === -1 || zhiIndex === -1) return false;

      ganIndices.push(ganIndex);
      zhiIndices.push(zhiIndex);
    }

    return { ganIndices, zhiIndices };
  }

  /**
   * 获取四柱的完整信息
   * @param {number[]} ganIndices - 四柱天干索引
   * @param {number[]} zhiIndices - 四柱地支索引
   * @returns {Object} 四柱详细信息
   */
  static getPillarDetails(ganIndices, zhiIndices) {
    const pillars = ['year', 'month', 'day', 'hour'];
    const result = {};

    for (let i = 0; i < 4; i++) {
      const gan = SexagenaryConverter.getGan(ganIndices[i]);
      const zhi = SexagenaryConverter.getZhi(zhiIndices[i]);

      result[pillars[i]] = {
        gan: gan,
        zhi: zhi,
        ganZhi: gan + zhi,
        ganIndex: ganIndices[i],
        zhiIndex: zhiIndices[i],
        ganZhiIndex: SexagenaryConverter.toGanZhiIndex(ganIndices[i], zhiIndices[i]),
        ganWuXing: SexagenaryConverter.getGanWuXing(ganIndices[i]),
        zhiWuXing: SexagenaryConverter.getZhiWuXing(zhiIndices[i]),
        ganYinYang: SexagenaryConverter.getGanYinYang(ganIndices[i]),
        zhiYinYang: SexagenaryConverter.getZhiYinYang(zhiIndices[i]),
        cangGan: SexagenaryConverter.getCangGanArray(zhiIndices[i])
      };
    }

    return result;
  }
}

export default SexagenaryConverter;
