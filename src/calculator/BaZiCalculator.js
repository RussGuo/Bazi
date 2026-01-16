/**
 * 八字四柱计算模块
 * @module calculator/BaZiCalculator
 */

import { Calendar } from '../core/Calendar.js';
import { Astronomy } from '../core/Astronomy.js';
import { SexagenaryConverter } from '../converter/SexagenaryConverter.js';
import { GAN_ZHI } from '../core/Constants.js';

/**
 * 八字计算配置
 * @typedef {Object} BaZiOptions
 * @property {boolean} [useEarlyZi=true] - 是否区分早晚子时（23:00-24:00算上一日）
 * @property {boolean} [useTrueSolarTime=false] - 是否使用真太阳时
 * @property {number} [longitude=120] - 经度
 * @property {number} [latitude=35] - 纬度
 */

/**
 * 八字计算结果
 * @typedef {Object} BaZiResult
 * @property {number[]} ganIndices - 四柱天干索引 [年, 月, 日, 时]
 * @property {number[]} zhiIndices - 四柱地支索引 [年, 月, 日, 时]
 * @property {number[]} ganZhiIndices - 四柱干支索引
 * @property {string} bazi - 八字字符串（8个字）
 * @property {Object} pillars - 四柱详细信息
 * @property {Object} meta - 元数据（节气年、时间等）
 */

/**
 * 八字四柱计算器
 */
export class BaZiCalculator {
  /**
   * 计算八字四柱
   * @param {number} year - 公历年
   * @param {number} month - 公历月（1-12）
   * @param {number} day - 公历日（1-31）
   * @param {number} hour - 小时（0-23）
   * @param {number} [minute=0] - 分钟（0-59）
   * @param {number} [second=0] - 秒（0-59）
   * @param {BaZiOptions} [options={}] - 计算选项
   * @returns {BaZiResult|false} 八字计算结果，无效返回false
   */
  static calculate(year, month, day, hour, minute = 0, second = 0, options = {}) {
    year = Math.floor(Number(year) || 0);
    month = Math.floor(Number(month) || 0);
    day = Math.floor(Number(day) || 0);
    hour = Math.floor(Number(hour) || 0);
    minute = Math.floor(Number(minute) || 0);
    second = Math.floor(Number(second) || 0);

    const {
      useEarlyZi = true,
      useTrueSolarTime = false,
      longitude = 120,
      latitude = 35
    } = options;

    // 避免整点模糊
    if (minute + second === 0) {
      second = 10;
    }

    // 验证日期
    if (!Calendar.isValidDate(year, month, day)) {
      return false;
    }

    // 计算儒略日
    let jd = Calendar.toJulianDay(year, month, day, hour, minute, second);
    if (jd === false) {
      return false;
    }

    // 真太阳时转换
    let trueSolarTime = null;
    if (useTrueSolarTime) {
      jd = Astronomy.toTrueSolarTime(jd, longitude, latitude);
      trueSolarTime = Calendar.fromJulianDay(jd);
    }

    // 获取节气数据
    let jqData = [];
    let jqYear = year;

    while (true) {
      const dj = Astronomy.getAdjustedSolarTerms(jqYear, false);
      jqData = dj.concat(jqData);
      if (jd >= dj[21]) { // dj[21]为立春
        jqYear++;
        break;
      }
      jqYear--;
    }

    // 计算四柱
    const ganIndices = [];
    const zhiIndices = [];

    // ========== 年柱 ==========
    // 以立春为界，立春后才算新的一年
    const yearGanZhi = ((jqYear + 4712 + 24) % 60 + 60) % 60;
    ganIndices[0] = yearGanZhi % 10;
    zhiIndices[0] = yearGanZhi % 12;

    // ========== 月柱 ==========
    // 以节气为界，找到当前所在的节气月
    let monthIndex = -1;
    for (let j = 0; ; j++) {
      if (jd < jqData[21 + 2 * j]) {
        monthIndex = j - 1;
        break;
      }
    }

    const monthGanZhi = (((jqYear + 4712) * 12 + monthIndex + 60) % 60 + 50) % 60;
    ganIndices[1] = monthGanZhi % 10;
    zhiIndices[1] = monthGanZhi % 12;

    // ========== 日柱 ==========
    // 以子时为界（或以0时为界，取决于是否区分早晚子时）
    const jda = jd + 0.5; // 起始点从正午改为0点
    const thes = ((jda - Math.floor(jda)) * 86400) + 3600; // 加1小时偏移
    const dayjd = Math.floor(jda) + thes / 86400;
    let dayGanZhi = (Math.floor(dayjd + 49) % 60 + 60) % 60;

    // 处理晚子时
    const actualHour = useTrueSolarTime && trueSolarTime ? trueSolarTime[3] : hour;
    if (useEarlyZi && actualHour >= 23) {
      dayGanZhi = (dayGanZhi + 59) % 60; // 日柱前移一柱
    }

    ganIndices[2] = dayGanZhi % 10;
    zhiIndices[2] = dayGanZhi % 12;

    // ========== 时柱 ==========
    const dh = dayjd * 12;
    let hourGanZhi = (Math.floor(dh + 48) % 60 + 60) % 60;

    ganIndices[3] = hourGanZhi % 10;
    zhiIndices[3] = hourGanZhi % 12;

    // 构建结果
    const ganZhiIndices = [];
    for (let i = 0; i < 4; i++) {
      ganZhiIndices[i] = SexagenaryConverter.toGanZhiIndex(ganIndices[i], zhiIndices[i]);
    }

    const bazi = SexagenaryConverter.formatBaZi(ganIndices, zhiIndices);
    const pillars = SexagenaryConverter.getPillarDetails(ganIndices, zhiIndices);

    return {
      ganIndices,
      zhiIndices,
      ganZhiIndices,
      bazi,
      pillars,
      meta: {
        jqYear,
        monthIndex,
        dayGanZhi,
        hourGanZhi,
        julianDay: jd,
        trueSolarTime,
        isEarlyZi: useEarlyZi && actualHour >= 23,
        solarTerms: jqData,
        standardTime: [year, month, day, hour, minute, second]
      }
    };
  }

  /**
   * 根据指定时间计算四柱（简化接口）
   * @param {Date|Object} datetime - 日期时间对象或{year, month, day, hour, minute, second}
   * @param {BaZiOptions} [options={}] - 计算选项
   * @returns {BaZiResult|false}
   */
  static fromDatetime(datetime, options = {}) {
    let year, month, day, hour, minute, second;

    if (datetime instanceof Date) {
      year = datetime.getFullYear();
      month = datetime.getMonth() + 1;
      day = datetime.getDate();
      hour = datetime.getHours();
      minute = datetime.getMinutes();
      second = datetime.getSeconds();
    } else {
      year = datetime.year;
      month = datetime.month;
      day = datetime.day;
      hour = datetime.hour || 0;
      minute = datetime.minute || 0;
      second = datetime.second || 0;
    }

    return BaZiCalculator.calculate(year, month, day, hour, minute, second, options);
  }

  /**
   * 获取指定年份的立春时刻
   * @param {number} year - 公历年份
   * @returns {number[]} [年, 月, 日, 时, 分, 秒]
   */
  static getLiChunTime(year) {
    year = Math.floor(Number(year) || 0);
    const jq = Astronomy.getAdjustedSolarTerms(year - 1, false);
    // 立春是前一年节气数组的第21个（从春分开始数）
    const lichunJd = jq[21];
    return Calendar.fromJulianDay(lichunJd);
  }

  /**
   * 获取指定年月的节气交接时刻
   * @param {number} year - 公历年份
   * @param {number} month - 公历月份（1-12）
   * @returns {Object} {jie: 节时刻, qi: 气时刻}
   */
  static getSolarTermsForMonth(year, month) {
    year = Math.floor(Number(year) || 0);
    month = Math.floor(Number(month) || 0);

    // 节气从春分开始，需要调整
    // 春分在3月，索引0
    // 清明在4月，索引1
    // ...
    const jq = Astronomy.getAdjustedSolarTerms(year, false);
    const prevJq = Astronomy.getAdjustedSolarTerms(year - 1, false);

    // 计算该月对应的节气索引
    // 1月：小寒(19)、大寒(20) - 在前一年的节气数组中
    // 2月：立春(21)、雨水(22)
    // 3月：惊蛰(23)、春分(0)
    // 4月：清明(1)、谷雨(2)
    // ...

    let jieIndex, qiIndex;
    let jieJd, qiJd;

    if (month === 1) {
      // 小寒、大寒
      jieJd = prevJq[19];
      qiJd = prevJq[20];
    } else if (month === 2) {
      // 立春、雨水
      jieJd = prevJq[21];
      qiJd = prevJq[22];
    } else if (month === 3) {
      // 惊蛰、春分
      jieJd = prevJq[23];
      qiJd = jq[0];
    } else {
      // 4月及以后
      jieIndex = (month - 4) * 2 + 1;
      qiIndex = jieIndex + 1;
      jieJd = jq[jieIndex];
      qiJd = jq[qiIndex];
    }

    return {
      jie: Calendar.fromJulianDay(jieJd),
      qi: Calendar.fromJulianDay(qiJd),
      jieJd,
      qiJd
    };
  }

  /**
   * 判断某时刻是否已过某节气
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @param {number} hour - 时
   * @param {number} minute - 分
   * @param {number} solarTermIndex - 节气索引（0=春分）
   * @returns {boolean}
   */
  static isPastSolarTerm(year, month, day, hour, minute, solarTermIndex) {
    const jd = Calendar.toJulianDay(year, month, day, hour, minute, 0);
    if (jd === false) return false;

    // 确定节气所在年份
    let jqYear = year;
    if (solarTermIndex >= 19) {
      // 小寒、大寒、立春、雨水、惊蛰在前一年的节气数组
      jqYear = year - 1;
    }

    const jq = Astronomy.getAdjustedSolarTerms(jqYear, false);
    return jd >= jq[solarTermIndex];
  }

  /**
   * 获取某时刻所在的节气月
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @param {number} hour - 时
   * @param {number} minute - 分
   * @returns {Object} {monthZhi: 月支索引, jieQiName: 节气名称, jqYear: 节气年}
   */
  static getSolarTermMonth(year, month, day, hour, minute) {
    const result = BaZiCalculator.calculate(year, month, day, hour, minute);
    if (!result) return null;

    const JIE_QI_NAMES = [
      '春分', '清明', '谷雨', '立夏', '小满', '芒种',
      '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
      '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
      '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'
    ];

    const monthIndex = result.meta.monthIndex;
    // 节气索引：monthIndex对应的节气是(21 + monthIndex*2) % 24
    const jieIndex = (21 + monthIndex * 2) % 24;

    return {
      monthZhi: result.zhiIndices[1],
      jieQiName: JIE_QI_NAMES[jieIndex],
      jqYear: result.meta.jqYear,
      monthIndex: monthIndex
    };
  }

  /**
   * 计算指定干支年份对应的公历年范围
   * @param {number|string} yearGanZhi - 年干支（索引或名称）
   * @param {number} [baseYear=2024] - 基准年份
   * @returns {number[]} 可能的公历年份数组
   */
  static getYearsForGanZhi(yearGanZhi, baseYear = 2024) {
    let targetIndex;
    if (typeof yearGanZhi === 'string') {
      targetIndex = SexagenaryConverter.ganZhiToIndex(yearGanZhi);
    } else {
      targetIndex = Math.floor(Number(yearGanZhi) || 0);
    }

    if (targetIndex < 0 || targetIndex > 59) return [];

    const baseGanZhi = ((baseYear + 4712 + 24) % 60 + 60) % 60;
    const diff = (targetIndex - baseGanZhi + 60) % 60;

    const years = [];
    // 返回基准年前后的几个周期
    for (let cycle = -2; cycle <= 2; cycle++) {
      years.push(baseYear + diff + cycle * 60);
    }

    return years.filter(y => y > -1000 && y < 3000);
  }
}

export default BaZiCalculator;
