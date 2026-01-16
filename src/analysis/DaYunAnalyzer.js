/**
 * 大运流年分析模块
 * @module analysis/DaYunAnalyzer
 */

import { Calendar } from '../core/Calendar.js';
import { Astronomy } from '../core/Astronomy.js';
import {
  TIAN_GAN,
  DI_ZHI,
  GAN_ZHI,
  ZHANG_SHENG,
  ZHANG_SHENG_START,
  TROPICAL_YEAR
} from '../core/Constants.js';

/**
 * 大运分析器
 * 计算大运起运时间、大运周期、流年
 */
export class DaYunAnalyzer {
  /**
   * 计算大运
   * @param {Object} params - 计算参数
   * @param {number} params.gender - 性别（1=男, 0=女）
   * @param {number} params.year - 出生年（公历）
   * @param {number} params.month - 出生月（公历）
   * @param {number} params.day - 出生日（公历）
   * @param {number} params.hour - 出生时（0-23）
   * @param {number} [params.minute=0] - 出生分
   * @param {number} [params.second=0] - 出生秒
   * @param {number[]} params.ganIndices - 四柱天干索引
   * @param {number[]} params.zhiIndices - 四柱地支索引
   * @param {number} params.jqYear - 节气年
   * @param {number[]} params.solarTerms - 节气儒略日数组
   * @param {Object} [options={}] - 选项
   * @param {number} [options.cycleCount=9] - 大运周期数（默认9个）
   * @param {boolean} [options.preciseDaYun=true] - 是否精确计算起运时间
   * @returns {Object} 大运分析结果
   */
  static calculate(params, options = {}) {
    const {
      gender,
      year, month, day, hour,
      minute = 0, second = 0,
      ganIndices,
      zhiIndices,
      jqYear,
      solarTerms
    } = params;

    const {
      cycleCount = 9,
      preciseDaYun = true
    } = options;

    // 计算出生的儒略日
    const birthJd = Calendar.toJulianDay(year, month, day, hour, minute, second);

    // 年干的阴阳（0=阳, 1=阴）
    const yearGanYinYang = ganIndices[0] % 2;

    // 确定大运方向：阳男阴女顺排，阴男阳女逆排
    // gender: 1=男, 0=女
    // forward=0表示顺排，forward=1表示逆排
    let direction, forward;
    if ((gender === 0 && yearGanYinYang === 0) || (gender === 1 && yearGanYinYang === 1)) {
      // 阴年女 或 阳年男 -> 顺排
      direction = '顺';
      forward = 0;
    } else {
      // 阳年女 或 阴年男 -> 逆排
      direction = '逆';
      forward = 1;
    }

    // 计算年份所用的天数（精确或粗略）
    const yearDays = preciseDaYun ? TROPICAL_YEAR : 360;

    // 找到出生时刻所在的节气月
    let solarTermIndex = -1;
    for (let i = 0; ; i++) {
      if (birthJd < solarTerms[21 + 2 * i]) {
        solarTermIndex = i - 1;
        break;
      }
    }

    // 计算距前后节气的距离
    const prevTermJd = solarTerms[21 + 2 * solarTermIndex];     // 前一个节气（月首）
    const nextTermJd = solarTerms[21 + 2 * solarTermIndex + 2]; // 下一个节气

    const xf = birthJd - prevTermJd; // 出生到前一个节气的距离
    const yf = nextTermJd - birthJd; // 出生到下一个节气的距离

    // 计算起运时间
    let zf; // 起运所需天数
    if (forward === 0) {
      // 顺排：从出生到下一个节气的距离折算
      if (preciseDaYun) {
        zf = yearDays * 10 * (yf / (yf + xf));
      } else {
        zf = yearDays * 10 * (yf / 30); // 粗略法：一月按30天
      }
    } else {
      // 逆排：从前一个节气到出生的距离折算
      if (preciseDaYun) {
        zf = yearDays * 10 * (xf / (yf + xf));
      } else {
        zf = yearDays * 10 * (xf / 30);
      }
    }

    // 分解为年月日
    const startY = Math.floor(zf / yearDays);
    const startM = Math.floor((zf % yearDays) / (yearDays / 12));
    const startD = Math.floor((zf % yearDays) % (yearDays / 12));

    // 起运儒略日
    const startJd = birthJd + (startY + startM / 12 + startD / TROPICAL_YEAR) * TROPICAL_YEAR;
    const startDate = Calendar.fromJulianDay(startJd);
    const startYear = startDate[0];

    // 计算起运年（节气年）
    const startJqTerms = Astronomy.getAdjustedSolarTerms(startYear - 1, false);
    let startJqYear;
    if (startJd >= startJqTerms[21]) {
      startJqYear = startYear;
    } else {
      startJqYear = startYear - 1;
    }

    // 起运年龄（虚岁）
    const startAge = startJqYear - jqYear;

    // 计算月柱的六十甲子索引
    const monthGanZhiIndex = ((10 + ganIndices[1] - zhiIndices[1]) % 10) / 2 * 12 + zhiIndices[1];

    // 生成大运周期
    const cycles = [];
    for (let k = 0; k < cycleCount; k++) {
      // 计算大运干支（顺排取下一个，逆排取上一个）
      const daYunIndex = (monthGanZhiIndex + 60 + Math.pow(-1, forward) * (k + 1)) % 60;
      const daYunGanIndex = daYunIndex % 10;
      const daYunZhiIndex = daYunIndex % 12;

      // 计算十二长生
      // szs[日干] = 日干对地支"子"的长生索引
      // 阳干顺推，阴干逆推
      const dayGanIndex = ganIndices[2];
      const zhangShengBase = ZHANG_SHENG_START[dayGanIndex];
      const firstDaYunZhi = (monthGanZhiIndex + 60 + Math.pow(-1, forward)) % 12;
      const zhangShengIndex = (24 + zhangShengBase + Math.pow(-1, dayGanIndex) * (firstDaYunZhi + Math.pow(-1, forward) * k)) % 12;

      // 年龄和年份范围
      const ageStart = startAge + 1 + k * 10;
      const ageEnd = ageStart + 9;
      const yearStart = startYear + k * 10;
      const yearEnd = yearStart + 9;

      // 生成该大运周期内的流年
      const liuNian = [];
      for (let i = 0; i < 10; i++) {
        const age = ageStart + i;
        const liuNianYear = yearStart + i;

        // 流年干支
        const liuNianGanIndex = (ganIndices[0] + startAge + k * 10 + i) % 10;
        const liuNianZhiIndex = (zhiIndices[0] + startAge + k * 10 + i) % 12;
        const liuNianGanZhi = TIAN_GAN[liuNianGanIndex] + DI_ZHI[liuNianZhiIndex];

        liuNian.push({
          year: liuNianYear,
          age: age,
          ganIndex: liuNianGanIndex,
          zhiIndex: liuNianZhiIndex,
          ganZhi: liuNianGanZhi
        });
      }

      cycles.push({
        index: k + 1,
        ganIndex: daYunGanIndex,
        zhiIndex: daYunZhiIndex,
        ganZhi: TIAN_GAN[daYunGanIndex] + DI_ZHI[daYunZhiIndex],
        ageRange: [ageStart, ageEnd],
        yearRange: [yearStart, yearEnd],
        zhangSheng: ZHANG_SHENG[zhangShengIndex],
        zhangShengIndex: zhangShengIndex,
        liuNian: liuNian
      });
    }

    // 生成交运年天干描述
    const jiaoyunGan1 = TIAN_GAN[((startJqYear + 4712 + 24) % 10 + 10) % 10];
    const jiaoyunGan2 = TIAN_GAN[((startJqYear + 4712 + 24 + 5) % 10 + 10) % 10];
    const jiaoyunDesc = `每逢 ${jiaoyunGan1}、${jiaoyunGan2} 年${startDate[1]}月${startDate[2]}日${startDate[3]}时交脱大运`;

    return {
      // 基本信息
      gender: gender,
      direction: direction,

      // 起运信息
      startAge: startAge,
      startYear: startYear,
      startDesc: `出生后${startY}年${startM}个月${startD}天起运`,
      jiaoyunDesc: jiaoyunDesc,

      // 大运周期
      cycles: cycles
    };
  }

  /**
   * 简化计算接口（直接使用BaZiCalculator的结果）
   * @param {Object} baziResult - BaZiCalculator.calculate()的返回结果
   * @param {number} gender - 性别（1=男, 0=女）
   * @param {Object} [options={}] - 选项
   * @returns {Object} 大运分析结果
   */
  static fromBaZi(baziResult, gender, options = {}) {
    if (!baziResult || !baziResult.meta) {
      return null;
    }

    return DaYunAnalyzer.calculate({
      gender: gender,
      year: baziResult.meta.standardTime[0],
      month: baziResult.meta.standardTime[1],
      day: baziResult.meta.standardTime[2],
      hour: baziResult.meta.standardTime[3],
      minute: baziResult.meta.standardTime[4] || 0,
      second: baziResult.meta.standardTime[5] || 0,
      ganIndices: baziResult.ganIndices,
      zhiIndices: baziResult.zhiIndices,
      jqYear: baziResult.meta.jqYear,
      solarTerms: baziResult.meta.solarTerms
    }, options);
  }

  /**
   * 获取指定年龄的大运和流年
   * @param {Object} daYunResult - calculate()的返回结果
   * @param {number} age - 虚岁年龄
   * @returns {Object|null} {daYun: 大运信息, liuNian: 流年信息}
   */
  static getAtAge(daYunResult, age) {
    if (!daYunResult || !daYunResult.cycles) {
      return null;
    }

    for (const cycle of daYunResult.cycles) {
      if (age >= cycle.ageRange[0] && age <= cycle.ageRange[1]) {
        const liuNian = cycle.liuNian.find(ln => ln.age === age);
        return {
          daYun: {
            ganIndex: cycle.ganIndex,
            zhiIndex: cycle.zhiIndex,
            ganZhi: cycle.ganZhi,
            zhangSheng: cycle.zhangSheng,
            ageRange: cycle.ageRange,
            yearRange: cycle.yearRange
          },
          liuNian: liuNian || null
        };
      }
    }

    return null;
  }

  /**
   * 获取指定公历年的大运和流年
   * @param {Object} daYunResult - calculate()的返回结果
   * @param {number} year - 公历年
   * @returns {Object|null} {daYun: 大运信息, liuNian: 流年信息}
   */
  static getAtYear(daYunResult, year) {
    if (!daYunResult || !daYunResult.cycles) {
      return null;
    }

    for (const cycle of daYunResult.cycles) {
      if (year >= cycle.yearRange[0] && year <= cycle.yearRange[1]) {
        const liuNian = cycle.liuNian.find(ln => ln.year === year);
        return {
          daYun: {
            ganIndex: cycle.ganIndex,
            zhiIndex: cycle.zhiIndex,
            ganZhi: cycle.ganZhi,
            zhangSheng: cycle.zhangSheng,
            ageRange: cycle.ageRange,
            yearRange: cycle.yearRange
          },
          liuNian: liuNian || null
        };
      }
    }

    return null;
  }

  /**
   * 获取所有大运的干支列表
   * @param {Object} daYunResult - calculate()的返回结果
   * @returns {string[]} 大运干支数组
   */
  static getDaYunList(daYunResult) {
    if (!daYunResult || !daYunResult.cycles) {
      return [];
    }

    return daYunResult.cycles.map(c => c.ganZhi);
  }

  /**
   * 获取指定大运周期内所有流年的干支列表
   * @param {Object} daYunResult - calculate()的返回结果
   * @param {number} cycleIndex - 大运周期索引（从1开始）
   * @returns {string[]} 流年干支数组
   */
  static getLiuNianList(daYunResult, cycleIndex) {
    if (!daYunResult || !daYunResult.cycles) {
      return [];
    }

    const cycle = daYunResult.cycles.find(c => c.index === cycleIndex);
    if (!cycle) {
      return [];
    }

    return cycle.liuNian.map(ln => ln.ganZhi);
  }

  /**
   * 获取大运摘要
   * @param {Object} daYunResult - calculate()的返回结果
   * @returns {Object[]} 大运摘要数组
   */
  static getSummary(daYunResult) {
    if (!daYunResult || !daYunResult.cycles) {
      return [];
    }

    return daYunResult.cycles.map(c => ({
      ganZhi: c.ganZhi,
      ageRange: `${c.ageRange[0]}-${c.ageRange[1]}`,
      yearRange: `${c.yearRange[0]}-${c.yearRange[1]}`,
      zhangSheng: c.zhangSheng
    }));
  }

  /**
   * 格式化大运表格
   * @param {Object} daYunResult - calculate()的返回结果
   * @returns {string[][]} 表格数据
   */
  static formatTable(daYunResult) {
    if (!daYunResult || !daYunResult.cycles) {
      return [];
    }

    const table = [];

    // 表头行
    const header = ['周期', '大运', '年龄', '公历年', '长生'];
    for (let i = 0; i < 10; i++) {
      header.push(`流年${i + 1}`);
    }
    table.push(header);

    // 数据行
    for (const cycle of daYunResult.cycles) {
      const row = [
        cycle.index,
        cycle.ganZhi,
        `${cycle.ageRange[0]}-${cycle.ageRange[1]}`,
        `${cycle.yearRange[0]}-${cycle.yearRange[1]}`,
        cycle.zhangSheng
      ];

      for (const ln of cycle.liuNian) {
        row.push(ln.ganZhi);
      }

      table.push(row);
    }

    return table;
  }

  /**
   * 检查是否处于大运交接期
   * @param {Object} daYunResult - calculate()的返回结果
   * @param {number} year - 公历年
   * @param {number} month - 公历月
   * @param {number} day - 公历日
   * @returns {boolean} 是否处于交接期
   */
  static isTransitionPeriod(daYunResult, year, month, day) {
    if (!daYunResult || !daYunResult.cycles) {
      return false;
    }

    for (const cycle of daYunResult.cycles) {
      // 检查是否在大运开始年份的前后一个月内
      if (cycle.yearRange[0] === year) {
        // 简化处理：认为大运开始年份的交运月前后各半月为交接期
        // 实际精确计算需要具体交运日期
        return true;
      }
    }

    return false;
  }
}

export default DaYunAnalyzer;
