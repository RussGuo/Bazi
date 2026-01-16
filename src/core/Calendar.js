/**
 * 儒略日与公历转换
 * @module core/Calendar
 */

/**
 * 日历工具类
 * 处理儒略日与公历（格里历/儒略历）之间的转换
 */
export class Calendar {
  /**
   * 将公历日期时间转换为儒略日数
   * @param {number} yy - 年份（-1000至3000）
   * @param {number} mm - 月份（1-12）
   * @param {number} dd - 日期（1-31）
   * @param {number} [hh=12] - 小时（0-23）
   * @param {number} [mt=0] - 分钟（0-59）
   * @param {number} [ss=0] - 秒数（0-59）
   * @returns {number|false} 儒略日数，无效日期返回false
   */
  static toJulianDay(yy, mm, dd, hh = 12, mt = 0, ss = 0) {
    yy = Number(yy) || 0;
    mm = Number(mm) || 0;
    dd = Number(dd) || 0;
    hh = Number(hh) || 0;
    mt = Number(mt) || 0;
    ss = Number(ss) || 0;

    const yp = yy + Math.floor((mm - 3) / 10);

    let init, jdy;

    // 1582年10月15日及之后使用格里历
    if ((yy > 1582) || (yy === 1582 && mm > 10) || (yy === 1582 && mm === 10 && dd >= 15)) {
      init = 1721119.5;
      jdy = Math.floor(yp * 365.25) - Math.floor(yp / 100) + Math.floor(yp / 400);
    } else if ((yy < 1582) || (yy === 1582 && mm < 10) || (yy === 1582 && mm === 10 && dd <= 4)) {
      // 1582年10月4日及之前使用儒略历
      init = 1721117.5;
      jdy = Math.floor(yp * 365.25);
    } else {
      // 1582年10月5日至14日不存在
      return false;
    }

    const mp = Math.floor(mm + 9) % 12;
    const jdm = mp * 30 + Math.floor((mp + 1) * 34 / 57);
    const jdd = dd - 1;
    const hours = hh + ((ss / 60) + mt) / 60;
    const jdh = hours / 24;

    return jdy + jdm + jdd + jdh + init;
  }

  /**
   * 将儒略日数转换为公历日期时间
   * @param {number} jd - 儒略日数
   * @returns {number[]} [年, 月, 日, 时, 分, 秒]
   */
  static fromJulianDay(jd) {
    jd = Number(jd) || 0;

    let y4h, init;

    // 以1582年10月15日0时（JD值2299160.5）为分界点
    if (jd >= 2299160.5) {
      y4h = 146097; // 格里历
      init = 1721119.5;
    } else {
      y4h = 146100; // 儒略历
      init = 1721117.5;
    }

    const jdr = Math.floor(jd - init);
    const yh = y4h / 4;
    const cen = Math.floor((jdr + 0.75) / yh);
    let d = Math.floor(jdr + 0.75 - cen * yh);
    const ywl = 1461 / 4;
    const jy = Math.floor((d + 0.75) / ywl);
    d = Math.floor(d + 0.75 - ywl * jy + 1);
    const ml = 153 / 5;
    const mp = Math.floor((d - 0.5) / ml);
    d = Math.floor((d - 0.5) - 30.6 * mp + 1);
    let y = (100 * cen) + jy;
    let m = (mp + 2) % 12 + 1;

    if (m < 3) {
      y = y + 1;
    }

    const sd = Math.floor((jd + 0.5 - Math.floor(jd + 0.5)) * 24 * 60 * 60 + 0.00005);
    let mt = Math.floor(sd / 60);
    const ss = sd % 60;
    const hh = Math.floor(mt / 60);
    mt = mt % 60;

    return [
      Math.floor(y),
      Math.floor(m),
      Math.floor(d),
      hh,
      mt,
      ss
    ];
  }

  /**
   * 验证公历日期是否有效
   * @param {number} yy - 年份（-1000至3000）
   * @param {number} mm - 月份（1-12）
   * @param {number} dd - 日期（1-31）
   * @returns {boolean} 是否有效
   */
  static isValidDate(yy, mm, dd) {
    yy = Math.floor(Number(yy) || 0);
    mm = Math.floor(Number(mm) || 0);
    dd = Math.floor(Number(dd) || 0);

    // 月份检查
    if (mm <= 0 || mm > 12) {
      return false;
    }

    // 计算该月天数
    const ndf1 = -(yy % 4 === 0 ? 1 : 0); // 可被4整除
    const ndf2 = ((yy % 400 === 0 ? 1 : 0) - (yy % 100 === 0 ? 1 : 0)) && (yy > 1582) ? 1 : 0;
    const ndf = ndf1 + ndf2;
    const dom = 30 + ((Math.abs(mm - 7.5) + 0.5) % 2) - (mm === 2 ? 1 : 0) * (2 + ndf);

    // 日期检查
    if (dd <= 0 || dd > dom) {
      return false;
    }

    // 1582年10月5日至14日不存在
    if (yy === 1582 && mm === 10 && dd >= 5 && dd < 15) {
      return false;
    }

    return true;
  }

  /**
   * 获取指定日期是星期几
   * @param {number} yy - 年份
   * @param {number} mm - 月份（1-12）
   * @param {number} dd - 日期（1-31）
   * @returns {number|false} 0=周日，1-6=周一至周六，无效返回false
   */
  static getDayOfWeek(yy, mm, dd) {
    yy = Math.floor(Number(yy) || 0);
    mm = Math.floor(Number(mm) || 0);
    dd = Math.floor(Number(dd) || 0);

    const jd = Calendar.toJulianDay(yy, mm, dd, 12, 0, 0);
    if (jd === false) {
      return false;
    }

    // 模数为0代表星期日（西元前4713年1月1日12时为星期一）
    return (((Math.floor(jd + 1) % 7)) + 7) % 7;
  }

  /**
   * 获取公历某月的天数
   * @param {number} yy - 年份
   * @param {number} mm - 月份（1-12）
   * @returns {number} 该月天数，无效返回0
   */
  static getSolarMonthDays(yy, mm) {
    yy = Math.floor(Number(yy) || 0);
    mm = Math.floor(Number(mm) || 0);

    if (mm < 1 || mm > 12) {
      return 0;
    }

    // 1582年10月只有21天（5-14日不存在）
    if (yy === 1582 && mm === 10) {
      return 21;
    }

    const ndf1 = -(yy % 4 === 0 ? 1 : 0);
    const ndf2 = ((yy % 400 === 0 ? 1 : 0) - (yy % 100 === 0 ? 1 : 0)) && (yy > 1582) ? 1 : 0;
    const ndf = ndf1 + ndf2;

    return 30 + ((Math.abs(mm - 7.5) + 0.5) % 2) - (mm === 2 ? 1 : 0) * (2 + ndf);
  }

  /**
   * 判断是否为闰年
   * @param {number} yy - 年份
   * @returns {boolean} 是否为闰年
   */
  static isLeapYear(yy) {
    yy = Math.floor(Number(yy) || 0);

    if (yy > 1582) {
      // 格里历：能被4整除但不能被100整除，或能被400整除
      return (yy % 4 === 0 && yy % 100 !== 0) || (yy % 400 === 0);
    } else {
      // 儒略历：能被4整除
      return yy % 4 === 0;
    }
  }

  /**
   * 计算两个儒略日之间的天数差
   * @param {number} jd1 - 第一个儒略日
   * @param {number} jd2 - 第二个儒略日
   * @returns {number} 天数差（jd2 - jd1）
   */
  static daysBetween(jd1, jd2) {
    return jd2 - jd1;
  }

  /**
   * 在儒略日上加减天数
   * @param {number} jd - 起始儒略日
   * @param {number} days - 要加减的天数（可为负数）
   * @returns {number} 新的儒略日
   */
  static addDays(jd, days) {
    return jd + days;
  }
}

export default Calendar;
