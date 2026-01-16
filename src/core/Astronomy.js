/**
 * 天文计算模块
 * 包含节气、真太阳时、日月升降等天文计算
 * @module core/Astronomy
 */

import { Calendar } from './Calendar.js';
import { JQ_CORRECTION } from '../data/CalendarCorrections.js';

// ==================== 内部辅助函数 ====================

/** 角度转弧度的系数 */
const DEG_TO_RAD = Math.PI / 180;

/** 弧度转角度的系数 */
const RAD_TO_DEG = 180 / Math.PI;

/**
 * 计算正弦（输入为角度）
 * @param {number} deg - 角度
 * @returns {number}
 */
function sinDeg(deg) {
  return Math.sin(deg * DEG_TO_RAD);
}

/**
 * 计算余弦（输入为角度）
 * @param {number} deg - 角度
 * @returns {number}
 */
function cosDeg(deg) {
  return Math.cos(deg * DEG_TO_RAD);
}

/**
 * 取小数部分（负数特殊处理）
 * @param {number} x
 * @returns {number}
 */
function fpart(x) {
  x = x - Math.floor(x);
  if (x < 0) {
    x = x + 1;
  }
  return x;
}

/**
 * 取整数部分（保留符号）
 * @param {number} x
 * @returns {number}
 */
function ipart(x) {
  if (x === 0) {
    return 0;
  }
  return (x / Math.abs(x)) * Math.floor(Math.abs(x));
}

/**
 * 通过三点拟合抛物线，返回极值和零点
 * @param {number} ym - y(-1)
 * @param {number} y0 - y(0)
 * @param {number} yp - y(+1)
 * @returns {number[]} [xe, ye, z1, z2, nz]
 */
function quad(ym, y0, yp) {
  let nz = 0;
  const A = 0.5 * (ym + yp) - y0;
  const b = 0.5 * (yp - ym);
  const c = y0;
  const xe = -b / (2 * A);
  const ye = (A * xe + b) * xe + c;
  const dis = b * b - 4 * A * c;
  let z1 = 0, z2 = 0;

  if (dis > 0) {
    const dx = 0.5 * Math.sqrt(dis) / Math.abs(A);
    z1 = xe - dx;
    z2 = xe + dx;
    if (Math.abs(z1) <= 1) {
      nz++;
    }
    if (Math.abs(z2) <= 1) {
      nz++;
    }
    if (z1 < -1) {
      z1 = z2;
    }
  }
  return [xe, ye, z1, z2, nz];
}

// ==================== 天文计算类 ====================

/**
 * 天文计算工具类
 */
export class Astronomy {
  // ==================== 摄动参数 ====================

  /** 摄动计算系数A */
  static PERTURBATION_A = [485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8];

  /** 摄动计算系数B */
  static PERTURBATION_B = [324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02, 247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45];

  /** 摄动计算系数C */
  static PERTURBATION_C = [1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443, 65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226, 29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029, 31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074];

  /** 气直线拟合参数 */
  static QI_KB = [
    1640650.479938, 15.21842500,
    1642476.703182, 15.21874996,
    1683430.515601, 15.218750011,
    1752157.640664, 15.218749978,
    1807675.003759, 15.218620279,
    1883627.765182, 15.218612292,
    1907369.128100, 15.218449176,
    1936603.140413, 15.218425000,
    1939145.524180, 15.218466998,
    1947180.798300, 15.218524844,
    1964362.041824, 15.218533526,
    1987372.340971, 15.218513908,
    1999653.819126, 15.218530782,
    2007445.469786, 15.218535181,
    2021324.917146, 15.218526248,
    2047257.232342, 15.218519654,
    2070282.898213, 15.218425000,
    2073204.872850, 15.218515221,
    2080144.500926, 15.218530782,
    2086703.688963, 15.218523776,
    2110033.182763, 15.218425000,
    2111190.300888, 15.218425000,
    2113731.271005, 15.218515671,
    2120670.840263, 15.218425000,
    2123973.309063, 15.218425000,
    2125068.997336, 15.218477932,
    2136026.312633, 15.218472436,
    2156099.495538, 15.218425000,
    2159021.324663, 15.218425000,
    2162308.575254, 15.218461742,
    2178485.706538, 15.218425000,
    2178759.662849, 15.218445786,
    2185334.020800, 15.218425000,
    2187525.481425, 15.218425000,
    2188621.191481, 15.218437494,
    2322147.76
  ];

  // ==================== 缓存 ====================

  /** 节气缓存 */
  static _jqCache = {};

  // ==================== 春分点计算 ====================

  /**
   * 计算指定年份的春分点理论值
   * @param {number} year - 公历年份
   * @returns {number|false} 春分点的儒略日，超出范围返回false
   */
  static getVernalEquinox(year) {
    year = Math.floor(Number(year) || 0);

    if (year >= 1000 && year <= 8001) {
      const m = (year - 2000) / 1000;
      return 2451623.80984 + 365242.37404 * m + 0.05169 * m * m - 0.00411 * m * m * m - 0.00057 * m * m * m * m;
    } else if (year >= -8000 && year < 1000) {
      const m = year / 1000;
      return 1721139.29189 + 365242.1374 * m + 0.06134 * m * m + 0.00111 * m * m * m - 0.00071 * m * m * m * m;
    }
    return false;
  }

  // ==================== 摄动与Delta T ====================

  /**
   * 计算摄动偏移量
   * 地球在绕日运行时会因受到其他星球影响而产生摄动
   * @param {number} jd - 儒略日
   * @returns {number} 摄动偏移量（天）
   */
  static getPerturbation(jd) {
    jd = Number(jd) || 0;
    const t = (jd - 2451545) / 36525;
    let s = 0;

    for (let k = 0; k < 24; k++) {
      s += Astronomy.PERTURBATION_A[k] * Math.cos(
        Astronomy.PERTURBATION_B[k] * DEG_TO_RAD +
        Astronomy.PERTURBATION_C[k] * DEG_TO_RAD * t
      );
    }

    const w = 35999.373 * t - 2.47;
    const l = 1 + 0.0334 * cosDeg(w) + 0.0007 * cosDeg(2 * w);

    return 0.00001 * s / l;
  }

  /**
   * 计算Delta T值
   * @param {number} year - 公历年份
   * @param {number} month - 公历月份
   * @returns {number} Delta T值（分钟）
   */
  static getDeltaT(year, month) {
    year = Math.floor(Number(year) || 0);
    month = Math.floor(Number(month) || 1);

    const y = year + (month - 0.5) / 12;
    let dt;

    if (y <= -500) {
      const u = (y - 1820) / 100;
      dt = -20 + 32 * u * u;
    } else if (y < 500) {
      const u = y / 100;
      dt = 10583.6 - 1014.41 * u + 33.78311 * u * u - 5.952053 * Math.pow(u, 3)
         - 0.1798452 * Math.pow(u, 4) + 0.022174192 * Math.pow(u, 5) + 0.0090316521 * Math.pow(u, 6);
    } else if (y < 1600) {
      const u = (y - 1000) / 100;
      dt = 1574.2 - 556.01 * u + 71.23472 * u * u + 0.319781 * Math.pow(u, 3)
         - 0.8503463 * Math.pow(u, 4) - 0.005050998 * Math.pow(u, 5) + 0.0083572073 * Math.pow(u, 6);
    } else if (y < 1700) {
      const t = y - 1600;
      dt = 120 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129;
    } else if (y < 1800) {
      const t = y - 1700;
      dt = 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * Math.pow(t, 3) - Math.pow(t, 4) / 1174000;
    } else if (y < 1860) {
      const t = y - 1800;
      dt = 13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * Math.pow(t, 3)
         - 0.00037436 * Math.pow(t, 4) + 0.0000121272 * Math.pow(t, 5)
         - 0.0000001699 * Math.pow(t, 6) + 0.000000000875 * Math.pow(t, 7);
    } else if (y < 1900) {
      const t = y - 1860;
      dt = 7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * Math.pow(t, 3)
         - 0.0004473624 * Math.pow(t, 4) + Math.pow(t, 5) / 233174;
    } else if (y < 1920) {
      const t = y - 1900;
      dt = -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * Math.pow(t, 3) - 0.000197 * Math.pow(t, 4);
    } else if (y < 1941) {
      const t = y - 1920;
      dt = 21.2 + 0.84493 * t - 0.0761 * t * t + 0.0020936 * Math.pow(t, 3);
    } else if (y < 1961) {
      const t = y - 1950;
      dt = 29.07 + 0.407 * t - t * t / 233 + Math.pow(t, 3) / 2547;
    } else if (y < 1986) {
      const t = y - 1975;
      dt = 45.45 + 1.067 * t - t * t / 260 - Math.pow(t, 3) / 718;
    } else if (y < 2005) {
      const t = y - 2000;
      dt = 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * Math.pow(t, 3)
         + 0.000651814 * Math.pow(t, 4) + 0.00002373599 * Math.pow(t, 5);
    } else if (y < 2050) {
      const t = y - 2000;
      dt = 62.92 + 0.32217 * t + 0.005589 * t * t;
    } else if (y < 2150) {
      const u = (y - 1820) / 100;
      dt = -20 + 32 * u * u - 0.5628 * (2150 - y);
    } else {
      const u = (y - 1820) / 100;
      dt = -20 + 32 * u * u;
    }

    // 额外修正
    if (y < 1955 || y >= 2005) {
      dt = dt - 0.000012932 * (y - 1955) * (y - 1955);
    }

    return dt / 60; // 秒转分钟
  }

  // ==================== 节气计算 ====================

  /**
   * 获取指定年份的24节气理论均值
   * @param {number} year - 公历年份
   * @returns {number[]} 从春分开始的24节气儒略日数组
   */
  static getMeanSolarTerms(year) {
    year = Math.floor(Number(year) || 0);

    const jdez = [];
    const jdve = Astronomy.getVernalEquinox(year);
    if (jdve === false) {
      return [];
    }

    const ty = Astronomy.getVernalEquinox(year + 1) - jdve;
    const ath = 2 * Math.PI / 24;
    const tx = (jdve - 2451545) / 365250;

    const e = 0.0167086342 - 0.0004203654 * tx - 0.0000126734 * tx * tx
            + 0.0000001444 * Math.pow(tx, 3) - 0.0000000002 * Math.pow(tx, 4)
            + 0.0000000003 * Math.pow(tx, 5);

    const tt = year / 1000;
    const vp = 111.25586939 - 17.0119934518333 * tt - 0.044091890166673 * tt * tt
             - 4.37356166661345E-04 * Math.pow(tt, 3) + 8.16716666602386E-06 * Math.pow(tt, 4);
    const rvp = vp * DEG_TO_RAD;

    const peri = [];
    for (let i = 1; i <= 24; i++) {
      let flag = 0;
      let th = ath * (i - 1) + rvp;

      if (th > Math.PI && th <= 3 * Math.PI) {
        th = 2 * Math.PI - th;
        flag = 1;
      }
      if (th > 3 * Math.PI) {
        th = 4 * Math.PI - th;
        flag = 2;
      }

      const f1 = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(th / 2));
      const f2 = (e * Math.sqrt(1 - e * e) * Math.sin(th)) / (1 + e * Math.cos(th));
      let f = (f1 - f2) * ty / 2 / Math.PI;

      if (flag === 1) {
        f = ty - f;
      }
      if (flag === 2) {
        f = 2 * ty - f;
      }
      peri[i] = f;
    }

    for (let i = 1; i <= 24; i++) {
      jdez[i - 1] = jdve + peri[i] - peri[1];
    }

    return jdez;
  }

  /**
   * 获取调整后的24节气（考虑摄动和Delta T修正）
   * @param {number} year - 公历年份
   * @param {boolean} [useCalendar=false] - 是否使用历法修正（用于农历计算）
   * @returns {number[]} 从春分开始的24节气儒略日数组
   */
  static getAdjustedSolarTerms(year, useCalendar = false) {
    year = Math.floor(Number(year) || 0);
    const calendar = useCalendar ? 1 : 0;

    // 检查缓存
    if (!Astronomy._jqCache[year]) {
      Astronomy._jqCache[year] = {};
    }

    // 先计算基础节气（无历法修正）
    if (Astronomy._jqCache[year][0] === undefined) {
      const jdez = Astronomy.getMeanSolarTerms(year);
      const jdjq = [];

      for (let i = 0; i < 24; i++) {
        const ptb = Astronomy.getPerturbation(jdez[i]);
        const dt = Astronomy.getDeltaT(year, Math.ceil(i / 2) + 3);
        jdjq[i] = jdez[i] + ptb - dt / 60 / 24;
        jdjq[i] = jdjq[i] + 8 / 24; // 北京时间修正
      }

      Astronomy._jqCache[year][0] = jdjq;
    }

    // 如果不需要历法修正，直接返回缓存
    if (Astronomy._jqCache[year][calendar]) {
      return Astronomy._jqCache[year][calendar].slice(0);
    }

    // 需要历法修正
    let refer = true;
    const jdjq = Astronomy._jqCache[year][0].slice(0);

    if (calendar === 1) {
      const B = Astronomy.QI_KB;
      const pc = 7;
      const f1 = B[0] - pc;
      const f2 = B[B.length - 1] - pc;

      // 平气计算区间
      if ((jdjq[0] >= f1 && jdjq[0] < f2) || (jdjq[23] >= f1 && jdjq[23] < f2)) {
        refer = false;
        for (let j = 0, i = 0; j < 24; j++) {
          if (jdjq[j] < f1 || jdjq[j] >= f2) {
            continue;
          }
          if (jdjq[j] + pc >= B[i + 2]) {
            for (; i < B.length; i += 2) {
              if (jdjq[j] + pc < B[i + 2]) {
                break;
              }
            }
          }

          jdjq[j] = B[i] + B[i + 1] * Math.floor((jdjq[j] + pc - B[i]) / B[i + 1]);
          jdjq[j] = Math.floor(jdjq[j] + 0.5);

          if (jdjq[j] === 1683460) {
            jdjq[j]++;
          }
        }
      }

      // 时宪历修正
      if (JQ_CORRECTION[year]) {
        refer = false;
        for (const i in JQ_CORRECTION[year]) {
          jdjq[i] += JQ_CORRECTION[year][i];
          jdjq[i] = Math.floor(jdjq[i] + 0.5);
        }
      }
    }

    Astronomy._jqCache[year][calendar] = refer ? Astronomy._jqCache[year][0] : jdjq;

    return jdjq;
  }

  /**
   * 清除节气缓存
   */
  static clearCache() {
    Astronomy._jqCache = {};
  }

  // ==================== 太阳月球位置 ====================

  /**
   * 计算太阳的赤经赤纬
   * @param {number} t - 儒略世纪数（以J2000为基准）
   * @returns {number[]} [赤经（小时）, 赤纬（度）]
   */
  static getSunPosition(t) {
    const p2 = 2 * Math.PI;
    const COSEPS = 0.91748;
    const SINEPS = 0.39778;

    const m = p2 * fpart(0.993133 + 99.997361 * t);
    const dL = 6893 * Math.sin(m) + 72 * Math.sin(2 * m);
    const L = p2 * fpart(0.7859453 + m / p2 + (6191.2 * t + dL) / 1296000);

    const sl = Math.sin(L);
    const x = Math.cos(L);
    const y = COSEPS * sl;
    const z = SINEPS * sl;
    const rho = Math.sqrt(1 - z * z);

    const dec = (360 / p2) * Math.atan(z / rho);
    let ra = (48 / p2) * Math.atan(y / (x + rho));
    if (ra < 0) {
      ra = ra + 24;
    }

    return [ra, dec];
  }

  /**
   * 计算月球的赤经赤纬
   * @param {number} t - 儒略世纪数（以J2000为基准）
   * @returns {number[]} [赤经（小时）, 赤纬（度）]
   */
  static getMoonPosition(t) {
    const p2 = 2 * Math.PI;
    const ARC = 206264.8062;
    const COSEPS = 0.91748;
    const SINEPS = 0.39778;

    const L0 = fpart(0.606433 + 1336.855225 * t);
    const L = p2 * fpart(0.374897 + 1325.55241 * t);
    const LS = p2 * fpart(0.993133 + 99.997361 * t);
    const d = p2 * fpart(0.827361 + 1236.853086 * t);
    const F = p2 * fpart(0.259086 + 1342.227825 * t);

    let dL = 22640 * Math.sin(L) - 4586 * Math.sin(L - 2 * d);
    dL += 2370 * Math.sin(2 * d) + 769 * Math.sin(2 * L);
    dL -= 668 * Math.sin(LS) - 412 * Math.sin(2 * F);
    dL -= 212 * Math.sin(2 * L - 2 * d) - 206 * Math.sin(L + LS - 2 * d);
    dL += 192 * Math.sin(L + 2 * d) - 165 * Math.sin(LS - 2 * d);
    dL -= 125 * Math.sin(d) - 110 * Math.sin(L + LS);
    dL += 148 * Math.sin(L - LS) - 55 * Math.sin(2 * F - 2 * d);

    const S = F + (dL + 412 * Math.sin(2 * F) + 541 * Math.sin(LS)) / ARC;
    const h = F - 2 * d;

    let N = -526 * Math.sin(h) + 44 * Math.sin(L + h) - 31 * Math.sin(h - L) - 23 * Math.sin(LS + h);
    N += 11 * Math.sin(h - LS) - 25 * Math.sin(F - 2 * L) + 21 * Math.sin(F - L);

    const lmoon = p2 * fpart(L0 + dL / 1296000);
    const bmoon = (18520 * Math.sin(S) + N) / ARC;

    const CB = Math.cos(bmoon);
    const x = CB * Math.cos(lmoon);
    const V = CB * Math.sin(lmoon);
    const C = Math.sin(bmoon);
    const y = COSEPS * V - SINEPS * C;
    const z = SINEPS * V + COSEPS * C;
    const rho = Math.sqrt(1 - z * z);

    const dec = (360 / p2) * Math.atan(z / rho);
    let ra = (48 / p2) * Math.atan(y / (x + rho));
    if (ra < 0) {
      ra = ra + 24;
    }

    return [ra, dec];
  }

  /**
   * 计算天体高度角的正弦值
   * @param {number} jd - 儒略日
   * @param {number} longitude - 经度（东正西负）
   * @param {number} latitude - 纬度（北正南负）
   * @param {number} type - 类型：1=月球, 2=太阳
   * @returns {number} 高度角正弦值
   */
  static sinAltitude(jd, longitude, latitude, type) {
    const instant = jd - 2400001;
    const t = (instant - 51544.5) / 36525;

    let ra, dec;
    if (type === 1) {
      [ra, dec] = Astronomy.getMoonPosition(t);
    } else {
      [ra, dec] = Astronomy.getSunPosition(t);
    }

    const mjd0 = ipart(instant);
    const ut = (instant - mjd0) * 24;
    const t2 = (mjd0 - 51544.5) / 36525;
    let gmst = 6.697374558 + 1.0027379093 * ut;
    gmst += (8640184.812866 + (0.093104 - 0.0000062 * t2) * t2) * t2 / 3600;
    const lmst = 24 * fpart((gmst + longitude / 15) / 24);

    const tau = 15 * (lmst - ra);
    return sinDeg(latitude) * sinDeg(dec) + cosDeg(latitude) * cosDeg(dec) * cosDeg(tau);
  }

  // ==================== 日出日落 ====================

  /**
   * 计算日出日落时间
   * @param {number} jd - 儒略日
   * @param {number} longitude - 经度（东正西负）
   * @param {number} latitude - 纬度（北正南负）
   * @param {number} type - 类型：1=月球, 2=太阳, 3=航海微光
   * @param {number} [standardLongitude=120] - 标准时间经度
   * @returns {Object} {rise, set, dt, standardRise, standardSet}
   */
  static getRiseSet(jd, longitude, latitude, type, standardLongitude = 120) {
    jd = Number(jd) || 0;
    longitude = Number(longitude) || 120;
    latitude = Number(latitude) || 35;

    const noon = Math.round(jd) - standardLongitude / 360;

    const sinho = [
      0,
      sinDeg(8 / 60),      // 月球
      sinDeg(-50 / 60),    // 太阳
      sinDeg(-12)          // 航海微光
    ];

    let rise = 0, sett = 0;
    let utrise = false, utset = false;
    let hour = 1;
    let above = 0;

    let ym = Astronomy.sinAltitude(noon + (hour - 1) / 24, longitude, latitude, type) - sinho[type];
    if (ym > 0) {
      above = 1;
    }

    do {
      const y0 = Astronomy.sinAltitude(noon + hour / 24, longitude, latitude, type) - sinho[type];
      const yp = Astronomy.sinAltitude(noon + (hour + 1) / 24, longitude, latitude, type) - sinho[type];

      const [xe, ye, z1, z2, nz] = quad(ym, y0, yp);

      switch (nz) {
        case 1:
          if (ym < 0) {
            utrise = hour + z1;
            rise = 1;
          } else {
            utset = hour + z1;
            sett = 1;
          }
          break;
        case 2:
          if (ye < 0) {
            utrise = hour + z2;
            utset = hour + z1;
          } else {
            utrise = hour + z1;
            utset = hour + z2;
          }
          rise = 1;
          sett = 1;
          break;
      }

      ym = yp;
      hour += 2;
    } while (!(hour === 25 || rise * sett === 1));

    // 转换为真太阳时
    if (utset !== false) {
      utset = Math.round(jd) - 0.5 + utset / 24 - (standardLongitude - longitude) * 4 / 60 / 24;
    }
    if (utrise !== false) {
      utrise = Math.round(jd) - 0.5 + utrise / 24 - (standardLongitude - longitude) * 4 / 60 / 24;
    }

    let dt = 0;
    let tset = (type === 2) ? utset : 0;
    let trise = (type === 2) ? utrise : 0;

    if (type === 2 && rise * sett === 1) {
      while (tset < trise) {
        tset += 1;
      }
      dt = Math.round(jd) - (trise + (tset - trise) / 2);

      tset = tset - dt + (standardLongitude - longitude) * 4 / 60 / 24;
      trise = trise - dt + (standardLongitude - longitude) * 4 / 60 / 24;
    }

    return {
      rise: utrise,
      set: utset,
      dt: dt,
      standardRise: trise,
      standardSet: tset
    };
  }

  // ==================== 真太阳时 ====================

  /**
   * 将标准时间转换为真太阳时
   * @param {number} jd - 儒略日（标准时间）
   * @param {number} [longitude=120] - 当地经度
   * @param {number} [latitude=35] - 当地纬度
   * @param {number} [standardLongitude=120] - 标准时间经度
   * @returns {number} 真太阳时的儒略日
   */
  static toTrueSolarTime(jd, longitude = 120, latitude = 35, standardLongitude = 120) {
    jd = Number(jd) || 0;
    longitude = Number(longitude) || 120;
    latitude = Number(latitude) || 35;

    const { dt } = Astronomy.getRiseSet(jd, longitude, latitude, 2, standardLongitude);

    return jd - (standardLongitude - longitude) * 4 / 60 / 24 + dt;
  }

  /**
   * 将公历日期时间转换为真太阳时
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @param {number} hour - 时
   * @param {number} minute - 分
   * @param {number} second - 秒
   * @param {number} [longitude=120] - 当地经度
   * @param {number} [latitude=35] - 当地纬度
   * @returns {number[]} [年, 月, 日, 时, 分, 秒] 真太阳时
   */
  static dateToTrueSolarTime(year, month, day, hour, minute = 0, second = 0, longitude = 120, latitude = 35) {
    const jd = Calendar.toJulianDay(year, month, day, hour, minute, second);
    if (jd === false) {
      return [year, month, day, hour, minute, second];
    }

    const trueSolarJd = Astronomy.toTrueSolarTime(jd, longitude, latitude);
    return Calendar.fromJulianDay(trueSolarJd);
  }

  /**
   * 获取指定日期的真太阳时差值（分钟）
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @param {number} [longitude=120] - 当地经度
   * @param {number} [latitude=35] - 当地纬度
   * @returns {number} 时差（分钟），正值表示真太阳时比平太阳时快
   */
  static getTrueSolarTimeDiff(year, month, day, longitude = 120, latitude = 35) {
    const jd = Calendar.toJulianDay(year, month, day, 12, 0, 0);
    if (jd === false) {
      return 0;
    }

    const { dt } = Astronomy.getRiseSet(jd, longitude, latitude, 2);

    // dt为天数差，转换为分钟，同时加上经度差
    const longitudeDiff = (longitude - 120) * 4; // 经度差（分钟）
    const equationOfTime = dt * 24 * 60; // 时间差（分钟）

    return longitudeDiff + equationOfTime;
  }

  // ==================== 星座 ====================

  /**
   * 获取星座
   * @param {number} year - 年
   * @param {number} month - 月
   * @param {number} day - 日
   * @param {number} [hour=12] - 时
   * @param {number} [minute=0] - 分
   * @param {number} [second=0] - 秒
   * @returns {string} 星座名称
   */
  static getZodiacSign(year, month, day, hour = 12, minute = 0, second = 0) {
    const XING_ZUO = ['摩羯', '水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手'];

    const jd = Calendar.toJulianDay(year, month, day, hour, minute, second);
    if (jd === false) {
      // 简单按日期估算
      const boundaries = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
      let index = month - 1;
      if (day < boundaries[index]) {
        index = (index + 11) % 12;
      }
      return XING_ZUO[index];
    }

    // 获取节气数据来精确计算
    const jq = Astronomy.getAdjustedSolarTerms(year, false);
    const prevJq = Astronomy.getAdjustedSolarTerms(year - 1, false);

    // 春分(0)对应白羊座(3)，每两个节气对应一个星座
    // 节气索引: 0春分 2谷雨 4小满 ... 22惊蛰
    // 星座按春分开始: 白羊(3) 金牛(4) 双子(5) ...

    // 查找jd落在哪个节气区间
    // 使用中气作为星座分界点（春分、谷雨、小满...）
    let zodiacIndex = -1;

    // 检查是否在前一年的节气范围内
    if (jd < jq[0]) {
      // 在春分之前，检查前一年的节气
      for (let i = 22; i >= 0; i -= 2) {
        if (jd >= prevJq[i]) {
          zodiacIndex = (3 + Math.floor(i / 2)) % 12;
          break;
        }
      }
      if (zodiacIndex === -1) {
        zodiacIndex = 2; // 双鱼座
      }
    } else {
      // 在本年春分之后
      for (let i = 22; i >= 0; i -= 2) {
        if (jd >= jq[i]) {
          zodiacIndex = (3 + Math.floor(i / 2)) % 12;
          break;
        }
      }
    }

    return XING_ZUO[zodiacIndex];
  }

  /**
   * 获取指定年份的24节气表
   * @param {number} year - 公历年份
   * @returns {Object[]} 节气数组 [{name, jd, date}]
   */
  static getSolarTermsTable(year) {
    const JIE_QI = [
      '春分', '清明', '谷雨', '立夏', '小满', '芒种',
      '夏至', '小暑', '大暑', '立秋', '处暑', '白露',
      '秋分', '寒露', '霜降', '立冬', '小雪', '大雪',
      '冬至', '小寒', '大寒', '立春', '雨水', '惊蛰'
    ];

    const jq = Astronomy.getAdjustedSolarTerms(year, false);
    const prevJq = Astronomy.getAdjustedSolarTerms(year - 1, false);

    const result = [];

    // 小寒大寒在前一年的节气数组中
    result.push({
      name: '小寒',
      jd: prevJq[19],
      date: Calendar.fromJulianDay(prevJq[19])
    });
    result.push({
      name: '大寒',
      jd: prevJq[20],
      date: Calendar.fromJulianDay(prevJq[20])
    });

    // 立春到惊蛰
    for (let i = 21; i <= 23; i++) {
      result.push({
        name: JIE_QI[i],
        jd: prevJq[i],
        date: Calendar.fromJulianDay(prevJq[i])
      });
    }

    // 春分到大雪
    for (let i = 0; i <= 17; i++) {
      result.push({
        name: JIE_QI[i],
        jd: jq[i],
        date: Calendar.fromJulianDay(jq[i])
      });
    }

    // 冬至
    result.push({
      name: '冬至',
      jd: jq[18],
      date: Calendar.fromJulianDay(jq[18])
    });

    return result;
  }
}

export default Astronomy;
