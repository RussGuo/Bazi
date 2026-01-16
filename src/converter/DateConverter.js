/**
 * 公历农历转换模块
 * @module converter/DateConverter
 */

import { Calendar } from '../core/Calendar.js';
import { Astronomy } from '../core/Astronomy.js';
import { SYNODIC_MONTH, LUNAR_MONTH, LUNAR_DAY } from '../core/Constants.js';
import { SUO_KB, SM_CORRECTION } from '../data/CalendarCorrections.js';

/**
 * 日期转换工具类
 * 处理公历与农历之间的转换
 */
export class DateConverter {
  // ==================== 缓存 ====================

  /** 月代码缓存 */
  static _mcCache = {};

  /** 朔望月缓存 */
  static _smCache = {};

  // ==================== 内部辅助方法 ====================

  /**
   * 获取均值新月点的月序数
   * @param {number} jd - 儒略日
   * @returns {number} 月序数
   */
  static _getMeanNewMoonK(jd) {
    return Math.floor((jd - 2451550.09765) / SYNODIC_MONTH);
  }

  /**
   * 计算实际新月点（朔日）
   * @param {number} jd - 儒略日（大约时间）
   * @param {boolean} [useCalendar=false] - 是否使用历法修正
   * @returns {number} 朔日的儒略日
   */
  static _getTrueNewMoon(jd, useCalendar = false) {
    jd = Number(jd) || 0;

    // 古代平朔计算区间
    if (useCalendar) {
      const B = SUO_KB;
      const pc = 14;
      const f1 = B[0] - pc;
      const f2 = B[B.length - 1] - pc;

      if (jd >= f1 && jd < f2) {
        let i = 0;
        for (; i < B.length; i += 2) {
          if (jd + pc < B[i + 2]) {
            break;
          }
        }
        let jdt = B[i] + B[i + 1] * Math.floor((jd + pc - B[i]) / B[i + 1]);
        jdt = Math.floor(jdt + 0.5);
        if (jdt === 1683460) {
          jdt++;
        }
        return jdt;
      }
    }

    // 现代天文算法
    const k = DateConverter._getMeanNewMoonK(jd);
    const jdt0 = 2451550.09765 + k * SYNODIC_MONTH;
    const t = (jdt0 - 2451545) / 36525;
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;

    let pt = jdt0 + 0.0001337 * t2 - 0.00000015 * t3 + 0.00000000073 * t4;

    const m = 2.5534 + 29.10535669 * k - 0.0000218 * t2 - 0.00000011 * t3;
    const mprime = 201.5643 + 385.81693528 * k + 0.0107438 * t2 + 0.00001239 * t3 - 0.000000058 * t4;
    const f = 160.7108 + 390.67050274 * k - 0.0016341 * t2 - 0.00000227 * t3 + 0.000000011 * t4;
    const omega = 124.7746 - 1.5637558 * k + 0.0020691 * t2 + 0.00000215 * t3;
    const es = 1 - 0.002516 * t - 0.0000074 * t2;

    const toRad = Math.PI / 180;

    let apt1 = -0.4072 * Math.sin(toRad * mprime);
    apt1 += 0.17241 * es * Math.sin(toRad * m);
    apt1 += 0.01608 * Math.sin(toRad * 2 * mprime);
    apt1 += 0.01039 * Math.sin(toRad * 2 * f);
    apt1 += 0.00739 * es * Math.sin(toRad * (mprime - m));
    apt1 -= 0.00514 * es * Math.sin(toRad * (mprime + m));
    apt1 += 0.00208 * es * es * Math.sin(toRad * 2 * m);
    apt1 -= 0.00111 * Math.sin(toRad * (mprime - 2 * f));
    apt1 -= 0.00057 * Math.sin(toRad * (mprime + 2 * f));
    apt1 += 0.00056 * es * Math.sin(toRad * (2 * mprime + m));
    apt1 -= 0.00042 * Math.sin(toRad * 3 * mprime);
    apt1 += 0.00042 * es * Math.sin(toRad * (m + 2 * f));
    apt1 += 0.00038 * es * Math.sin(toRad * (m - 2 * f));
    apt1 -= 0.00024 * es * Math.sin(toRad * (2 * mprime - m));
    apt1 -= 0.00017 * Math.sin(toRad * omega);
    apt1 -= 0.00007 * Math.sin(toRad * (mprime + 2 * m));
    apt1 += 0.00004 * Math.sin(toRad * (2 * mprime - 2 * f));
    apt1 += 0.00004 * Math.sin(toRad * 3 * m);
    apt1 += 0.00003 * Math.sin(toRad * (mprime + m - 2 * f));
    apt1 += 0.00003 * Math.sin(toRad * (2 * mprime + 2 * f));
    apt1 -= 0.00003 * Math.sin(toRad * (mprime + m + 2 * f));
    apt1 += 0.00003 * Math.sin(toRad * (mprime - m + 2 * f));
    apt1 -= 0.00002 * Math.sin(toRad * (mprime - m - 2 * f));
    apt1 -= 0.00002 * Math.sin(toRad * (3 * mprime + m));
    apt1 += 0.00002 * Math.sin(toRad * 4 * mprime);

    let apt2 = 0.000325 * Math.sin(toRad * (299.77 + 0.107408 * k - 0.009173 * t2));
    apt2 += 0.000165 * Math.sin(toRad * (251.88 + 0.016321 * k));
    apt2 += 0.000164 * Math.sin(toRad * (251.83 + 26.651886 * k));
    apt2 += 0.000126 * Math.sin(toRad * (349.42 + 36.412478 * k));
    apt2 += 0.00011 * Math.sin(toRad * (84.66 + 18.206239 * k));
    apt2 += 0.000062 * Math.sin(toRad * (141.74 + 53.303771 * k));
    apt2 += 0.00006 * Math.sin(toRad * (207.14 + 2.453732 * k));
    apt2 += 0.000056 * Math.sin(toRad * (154.84 + 7.30686 * k));
    apt2 += 0.000047 * Math.sin(toRad * (34.52 + 27.261239 * k));
    apt2 += 0.000042 * Math.sin(toRad * (207.19 + 0.121824 * k));
    apt2 += 0.00004 * Math.sin(toRad * (291.34 + 1.844379 * k));
    apt2 += 0.000037 * Math.sin(toRad * (161.72 + 24.198154 * k));
    apt2 += 0.000035 * Math.sin(toRad * (239.56 + 25.513099 * k));
    apt2 += 0.000023 * Math.sin(toRad * (331.55 + 3.592518 * k));

    let jdt = pt + apt1 + apt2;
    const [yy, mm] = Calendar.fromJulianDay(jdt);
    jdt = jdt - Astronomy.getDeltaT(yy, mm) / 1440;
    jdt = jdt + 8 / 24; // 北京时间

    // 查表修正
    if (useCalendar && SM_CORRECTION[yy]) {
      const jd1 = Calendar.toJulianDay(yy, 1, 1, 0, 0, 0);
      const k2 = DateConverter._getMeanNewMoonK(jd1);
      const n = k - k2;
      if (SM_CORRECTION[yy][n]) {
        jdt += SM_CORRECTION[yy][n];
        jdt = Math.floor(jdt + 0.5);
      }
    }

    return jdt;
  }

  /**
   * 获取中气和朔日以及月代码
   * @param {number} year - 公历年份
   * @returns {Array} [月代码数组, 朔日数组]
   */
  static _getZQandSMandLunarMonthCode(year) {
    year = Math.floor(Number(year) || 0);

    if (DateConverter._mcCache[year] && DateConverter._smCache[year]) {
      return [DateConverter._mcCache[year].slice(0), DateConverter._smCache[year].slice(0)];
    }

    const mc = [];
    const sjd = [];
    const qjd = [];

    // 获取连续16个中气
    for (let i = -1, k = 0; i <= 1; i++) {
      const jq = Astronomy.getAdjustedSolarTerms(year + i, true);
      for (let j = 0; j <= 22; j += 2, k++) {
        if (k >= 9 && k <= 24) {
          qjd[k - 9] = jq[j];
        }
      }
    }

    // 计算15个朔日
    let jd = qjd[0] - 2 * SYNODIC_MONTH - 14;
    for (let i = 0; i < 15;) {
      jd = DateConverter._getTrueNewMoon(jd + SYNODIC_MONTH + 14, true);
      if (Math.floor(jd + 0.5) > Math.floor(qjd[0] + 0.5)) {
        i++;
      }
      sjd[i] = jd;
    }

    // 判断闰月
    let yz = 0;
    mc[0] = 0;

    if (Math.floor(qjd[12] + 0.5) >= Math.floor(sjd[13] + 0.5)) {
      for (let i = 1; i <= 14; i++) {
        if (Math.floor(sjd[i] + 0.5) > Math.floor(qjd[i - 1 - yz] + 0.5) &&
            Math.floor(sjd[i + 1] + 0.5) <= Math.floor(qjd[i - yz] + 0.5)) {
          mc[i] = i - 0.5;
          yz = 1;
        } else {
          mc[i] = i - yz;
        }
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        mc[i] = i;
      }
      for (let i = 13; i <= 14; i++) {
        if (Math.floor(sjd[i] + 0.5) > Math.floor(qjd[i - 1 - yz] + 0.5) &&
            Math.floor(sjd[i + 1] + 0.5) <= Math.floor(qjd[i - yz] + 0.5)) {
          mc[i] = i - 0.5;
          yz = 1;
        } else {
          mc[i] = i - yz;
        }
      }
    }

    DateConverter._mcCache[year] = mc;
    DateConverter._smCache[year] = sjd;

    return [mc, sjd];
  }

  // ==================== 公开方法 ====================

  /**
   * 公历转农历
   * @param {number} year - 公历年
   * @param {number} month - 公历月（1-12）
   * @param {number} day - 公历日（1-31）
   * @returns {Object|false} 农历信息对象，无效返回false
   */
  static solarToLunar(year, month, day) {
    year = Math.floor(Number(year) || 0);
    month = Math.floor(Number(month) || 0);
    day = Math.floor(Number(day) || 0);

    if (!Calendar.isValidDate(year, month, day)) {
      return false;
    }

    const jdx = Calendar.toJulianDay(year, month, day, 12, 0, 0);
    if (jdx === false) {
      return false;
    }

    // 古代历法特殊处理（-721年至-104年）
    if (jdx >= 1457698 && jdx <= 1683430) {
      return DateConverter._ancientSolarToLunar(year, month, day, jdx);
    }

    // 标准农历计算
    let ty = year;
    let flag = 0;

    while (true) {
      const [mc, sjd] = DateConverter._getZQandSMandLunarMonthCode(ty);
      if (Math.floor(jdx) >= Math.floor(sjd[0] + 0.5)) {
        break;
      }
      ty--;
      flag = 1;
    }

    const [mc, sjd] = DateConverter._getZQandSMandLunarMonthCode(ty);

    let mi = 0;
    for (let i = 0; i <= 14; i++) {
      if (Math.floor(jdx) >= Math.floor(sjd[i] + 0.5) && Math.floor(jdx) < Math.floor(sjd[i + 1] + 0.5)) {
        mi = i;
        break;
      }
    }

    const lunarDay = Math.floor(jdx) - Math.floor(sjd[mi] + 0.5) + 1;
    const monthDays = Math.floor(sjd[mi + 1] + 0.5) - Math.floor(sjd[mi] + 0.5);

    let lunarYear;
    if (mc[mi] < 2 || flag === 1) {
      lunarYear = year - 1;
    } else {
      lunarYear = year;
    }

    const isLeap = (mc[mi] - Math.floor(mc[mi])) !== 0;
    const lunarMonth = (Math.floor(mc[mi] + 10) % 12) + 1;

    // 处理特殊月建
    let monthName = LUNAR_MONTH[lunarMonth - 1];
    let displayYear = lunarYear;
    const Dm = jdx - lunarDay + 1;

    if (Dm >= 1724360 && Dm <= 1729794) {
      monthName = LUNAR_MONTH[lunarMonth % 12];
      if (lunarMonth === 12) displayYear++;
    } else if (Dm >= 1807724 && Dm <= 1808699) {
      monthName = LUNAR_MONTH[lunarMonth % 12];
      if (lunarMonth === 12) displayYear++;
    } else if (Dm >= 1999349 && Dm <= 1999467) {
      monthName = LUNAR_MONTH[(lunarMonth + 1) % 12];
      if (lunarMonth === 11 || lunarMonth === 12) displayYear++;
    } else if (Dm >= 1973067 && Dm <= 1977052) {
      if (lunarMonth === 11) monthName = '正';
      if (lunarMonth === 1) monthName = '一';
      if (lunarMonth === 11 || lunarMonth === 12) displayYear++;
    }

    if (Dm === 1729794 || Dm === 1808699) {
      monthName = '拾贰';
    }

    return {
      year: lunarYear,
      month: lunarMonth,
      day: lunarDay,
      isLeap: isLeap,
      monthDays: monthDays,
      monthName: monthName,
      dayName: LUNAR_DAY[lunarDay - 1],
      displayYear: displayYear
    };
  }

  /**
   * 古代历法公历转农历（-721至-104年）
   * @private
   */
  static _ancientSolarToLunar(year, month, day, jdx) {
    let yi = 0, mi = 0, dz = 0;
    let isLeap = false;
    let ii = 0;
    const ns = [];
    const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];

    for (let i = 0, step = 3; i <= step; i++) {
      let jd = 0;
      const YY = year + i - 1;

      if (YY >= -220) {
        jd = 1640641 + Math.floor(0.866 + (YY + 220) * 12.369000) * SYNODIC_MONTH;
        ns[i + 6] = '后九';
        ns[i + 11] = 10;
      } else if (YY >= -479) {
        jd = 1546083 + Math.floor(0.500 + (YY + 479) * 12.368422) * SYNODIC_MONTH;
        ns[i + 6] = '十三';
        ns[i + 11] = 13;
      } else if (YY >= -722) {
        jd = 1457698 + Math.floor(0.342 + (YY + 721) * 12.368422) * SYNODIC_MONTH;
        ns[i + 6] = '十三';
        ns[i + 11] = 13;
      }

      if (jd < 1457698) continue;

      ns[i] = DateConverter._getTrueNewMoon(jd, true);
      ns[i] = Math.floor(ns[i] + 0.5);

      if (jdx > ns[i]) continue;

      ii = (jdx === ns[i]) ? i : (i - 1);
      yi = (jdx === ns[i]) ? YY : (YY - 1);
      step = ii + 1;
    }

    const tjd = [];
    for (let j = 0; j < 14; j++) {
      const jd = (j === 0) ? ns[ii] : DateConverter._getTrueNewMoon(tjd[j - 1] + SYNODIC_MONTH + 14, true);
      const jdFloor = Math.floor(jd + 0.5);

      if (mi + dz === 0) {
        if (jdx === jdFloor) {
          mi = j + 1;
          dz = 1;
        }
        if (jdx < jdFloor) {
          mi = j;
          dz = jdx - tjd[j - 1] + 1;
        }
      }

      tjd[j] = jdFloor;
      if (jdFloor >= ns[ii + 1]) break;
    }

    let displayYear = yi;
    let monthName = LUNAR_MONTH_NAMES[(mi + ns[ii + 11] - 2) % 12];
    const monthDays = tjd[mi] - tjd[mi - 1];

    if (mi <= 12 - ns[ii + 11] + 1) {
      displayYear--;
    }

    if (tjd.length === 14 && mi === 13) {
      isLeap = true;
      monthName = ns[ii + 6];
    }

    return {
      year: yi,
      month: mi,
      day: dz,
      isLeap: isLeap,
      monthDays: monthDays,
      monthName: monthName,
      dayName: LUNAR_DAY[dz - 1],
      displayYear: displayYear
    };
  }

  /**
   * 农历转公历
   * @param {number} year - 农历年
   * @param {number} month - 农历月（1-12）
   * @param {number} day - 农历日（1-30）
   * @param {boolean} [isLeap=false] - 是否闰月
   * @returns {Object|false} 公历信息对象，无效返回false
   */
  static lunarToSolar(year, month, day, isLeap = false) {
    year = Math.floor(Number(year) || 0);
    month = Math.floor(Number(month) || 0);
    day = Math.floor(Number(day) || 0);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 30) return false;

    const [mc, sjd] = DateConverter._getZQandSMandLunarMonthCode(year);

    let runyue = 0;
    for (let j = 1; j <= 14; j++) {
      if (mc[j] - Math.floor(mc[j]) > 0) {
        runyue = Math.floor(mc[j] + 0.5);
        break;
      }
    }

    const mx = month + 2;
    const nofd = [];

    for (let i = 0; i <= 14; i++) {
      nofd[i] = Math.floor(sjd[i + 1] + 0.5) - Math.floor(sjd[i] + 0.5);
    }

    let jdx;

    if (isLeap) {
      if (runyue < 3) {
        return false; // 此年非闰年
      }
      if (runyue !== mx) {
        return false; // 此月非闰月
      }
      if (day > nofd[mx]) {
        return false; // 日期超出范围
      }
      jdx = sjd[mx] + day - 1;
    } else {
      if (runyue === 0) {
        if (day > nofd[mx - 1]) {
          return false;
        }
        jdx = sjd[mx - 1] + day - 1;
      } else {
        const idx = mx + (mx > runyue ? 1 : 0) - 1;
        if (day > nofd[idx]) {
          return false;
        }
        jdx = sjd[idx] + day - 1;
      }
    }

    const [solarYear, solarMonth, solarDay] = Calendar.fromJulianDay(jdx);

    return {
      year: solarYear,
      month: solarMonth,
      day: solarDay
    };
  }

  /**
   * 获取农历某年的闰月
   * @param {number} year - 农历年
   * @returns {number} 闰月月份（1-12），0表示无闰月
   */
  static getLeapMonth(year) {
    year = Math.floor(Number(year) || 0);

    const [mc] = DateConverter._getZQandSMandLunarMonthCode(year);

    for (let j = 1; j <= 14; j++) {
      if (mc[j] - Math.floor(mc[j]) > 0) {
        const runyue = Math.floor(mc[j] + 0.5);
        if (runyue >= 3) {
          return runyue - 2;
        }
        break;
      }
    }

    return 0;
  }

  /**
   * 获取农历某月的天数
   * @param {number} year - 农历年
   * @param {number} month - 农历月（1-12）
   * @param {boolean} [isLeap=false] - 是否闰月
   * @returns {number} 该月天数，无效返回0
   */
  static getLunarMonthDays(year, month, isLeap = false) {
    year = Math.floor(Number(year) || 0);
    month = Math.floor(Number(month) || 0);

    const result = DateConverter.lunarToSolar(year, month, 1, isLeap);
    if (!result) return 0;

    // 获取下个月初一
    let nextMonth = month + 1;
    let nextYear = year;
    let nextIsLeap = false;

    if (isLeap) {
      // 闰月后是下一个月
      nextIsLeap = false;
    } else {
      // 检查是否有闰月
      const leapMonth = DateConverter.getLeapMonth(year);
      if (leapMonth === month) {
        nextIsLeap = true;
        nextMonth = month;
      }
    }

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
      nextIsLeap = false;
    }

    const nextResult = DateConverter.lunarToSolar(nextYear, nextMonth, 1, nextIsLeap);
    if (!nextResult) return 0;

    const jd1 = Calendar.toJulianDay(result.year, result.month, result.day, 12, 0, 0);
    const jd2 = Calendar.toJulianDay(nextResult.year, nextResult.month, nextResult.day, 12, 0, 0);

    return Math.floor(jd2 - jd1);
  }

  /**
   * 获取农历某年的完整信息
   * @param {number} year - 农历年
   * @returns {Object} 农历年信息
   */
  static getLunarYearInfo(year) {
    year = Math.floor(Number(year) || 0);

    const leapMonth = DateConverter.getLeapMonth(year);
    const months = [];

    for (let m = 1; m <= 12; m++) {
      const days = DateConverter.getLunarMonthDays(year, m, false);
      months.push({
        month: m,
        name: LUNAR_MONTH[m - 1],
        days: days,
        isLeap: false
      });

      if (leapMonth === m) {
        const leapDays = DateConverter.getLunarMonthDays(year, m, true);
        months.push({
          month: m,
          name: '闰' + LUNAR_MONTH[m - 1],
          days: leapDays,
          isLeap: true
        });
      }
    }

    return {
      year: year,
      leapMonth: leapMonth,
      months: months,
      totalDays: months.reduce((sum, m) => sum + m.days, 0)
    };
  }

  /**
   * 清除缓存
   */
  static clearCache() {
    DateConverter._mcCache = {};
    DateConverter._smCache = {};
    Astronomy.clearCache();
  }
}

export default DateConverter;
