/**
 * 八字排盘库 - 主入口
 * @module BaZi
 *
 * 设计原则：
 * - 只计算确定的、客观的数据
 * - 不进行主观解读
 * - 性别参数：1=男, 0=女
 */

// 核心模块
import { Calendar } from './core/Calendar.js';
import { Astronomy } from './core/Astronomy.js';
import * as Constants from './core/Constants.js';

// 转换器
import { DateConverter } from './converter/DateConverter.js';
import { SexagenaryConverter } from './converter/SexagenaryConverter.js';

// 计算器
import { BaZiCalculator } from './calculator/BaZiCalculator.js';
import { WuXingCalculator } from './calculator/WuXingCalculator.js';
import { ShiShenCalculator } from './calculator/ShiShenCalculator.js';

// 分析器
import { RelationshipAnalyzer } from './analysis/RelationshipAnalyzer.js';
import { DaYunAnalyzer } from './analysis/DaYunAnalyzer.js';

/**
 * 八字排盘主类
 */
export class BaZi {
  /**
   * 创建八字实例
   * @param {Object} [options={}] - 配置选项
   * @param {boolean} [options.useTrueSolarTime=false] - 是否使用真太阳时
   * @param {number} [options.longitude=120] - 经度
   * @param {number} [options.latitude=35] - 纬度
   * @param {boolean} [options.useEarlyZi=true] - 是否区分早晚子时
   * @param {boolean} [options.preciseDaYun=true] - 是否精确计算大运
   */
  constructor(options = {}) {
    this.options = {
      useTrueSolarTime: false,
      longitude: Constants.DEFAULT_LONGITUDE,
      latitude: Constants.DEFAULT_LATITUDE,
      useEarlyZi: true,
      preciseDaYun: true,
      ...options
    };
  }

  /**
   * 计算完整八字盘
   * @param {Object} params - 计算参数
   * @param {number} params.gender - 性别（1=男, 0=女）
   * @param {number} params.year - 公历年
   * @param {number} params.month - 公历月（1-12）
   * @param {number} params.day - 公历日（1-31）
   * @param {number} params.hour - 小时（0-23）
   * @param {number} [params.minute=0] - 分钟
   * @param {number} [params.second=0] - 秒
   * @returns {Object|false} 完整八字分析结果
   */
  calculate(params) {
    const {
      gender,
      year, month, day, hour,
      minute = 0, second = 0
    } = params;

    // 验证性别
    const genderValue = gender === 1 ? 1 : 0;

    // 计算四柱
    const baziResult = BaZiCalculator.calculate(
      year, month, day, hour, minute, second,
      {
        useEarlyZi: this.options.useEarlyZi,
        useTrueSolarTime: this.options.useTrueSolarTime,
        longitude: this.options.longitude,
        latitude: this.options.latitude
      }
    );

    if (!baziResult) {
      return false;
    }

    const { ganIndices, zhiIndices, bazi, pillars, meta } = baziResult;

    // 计算十神
    const shiShen = ShiShenCalculator.calculate(ganIndices, zhiIndices);

    // 计算五行
    const wuXing = WuXingCalculator.calculate(ganIndices, zhiIndices);

    // 计算阴阳
    const yinYang = WuXingCalculator.calculateYinYang(ganIndices, zhiIndices);

    // 分析刑冲合害关系
    const relations = RelationshipAnalyzer.analyzeSimple(ganIndices, zhiIndices);

    // 分析格局（三会三合六合等）
    const formations = RelationshipAnalyzer.extractFormations(zhiIndices);

    // 计算大运
    const daYun = DaYunAnalyzer.calculate({
      gender: genderValue,
      year, month, day, hour, minute, second,
      ganIndices,
      zhiIndices,
      jqYear: meta.jqYear,
      solarTerms: meta.solarTerms
    }, {
      preciseDaYun: this.options.preciseDaYun
    });

    // 计算农历
    const lunar = DateConverter.solarToLunar(year, month, day);

    // 获取生肖和星座
    const shengXiao = SexagenaryConverter.getShengXiao(zhiIndices[0]);
    const xingZuo = Astronomy.getZodiacSign(year, month, day, hour, minute, second);

    // 构建结果
    return {
      // 输入信息
      input: {
        gender: genderValue,
        datetime: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
        location: this.options.useTrueSolarTime
          ? { longitude: this.options.longitude, latitude: this.options.latitude }
          : null
      },

      // 时间信息
      time: {
        standard: [year, month, day, hour, minute, second],
        trueSolar: meta.trueSolarTime
      },

      // 四柱八字
      bazi: bazi,
      pillars: pillars,

      // 藏干
      cangGan: {
        year: this._getCangGanChars(zhiIndices[0]),
        month: this._getCangGanChars(zhiIndices[1]),
        day: this._getCangGanChars(zhiIndices[2]),
        hour: this._getCangGanChars(zhiIndices[3])
      },

      // 十神
      shiShen: {
        year: {
          gan: shiShen.year.gan.shiShen,
          zhi: shiShen.year.zhi.shiShen,
          cangGan: shiShen.year.zhi.cangGan.map(c => ({
            gan: c.gan,
            shiShen: c.shiShen.name
          }))
        },
        month: {
          gan: shiShen.month.gan.shiShen,
          zhi: shiShen.month.zhi.shiShen,
          cangGan: shiShen.month.zhi.cangGan.map(c => ({
            gan: c.gan,
            shiShen: c.shiShen.name
          }))
        },
        day: {
          gan: shiShen.day.gan.shiShen,
          zhi: shiShen.day.zhi.shiShen,
          cangGan: shiShen.day.zhi.cangGan.map(c => ({
            gan: c.gan,
            shiShen: c.shiShen.name
          }))
        },
        hour: {
          gan: shiShen.hour.gan.shiShen,
          zhi: shiShen.hour.zhi.shiShen,
          cangGan: shiShen.hour.zhi.cangGan.map(c => ({
            gan: c.gan,
            shiShen: c.shiShen.name
          }))
        }
      },

      // 五行
      wuXing: {
        count: wuXing.count,
        score: wuXing.score,
        percent: wuXing.percent
      },

      // 阴阳
      yinYang: yinYang,

      // 刑冲合害
      relations: relations,

      // 格局
      formations: {
        sanHui: formations.sanHui,
        sanHe: formations.sanHe,
        liuHe: formations.liuHe,
        banHe: formations.banHe,
        gongHe: formations.gongHe,
        gongHui: formations.gongHui
      },

      // 大运
      daYun: {
        direction: daYun.direction,
        startAge: daYun.startAge,
        startYear: daYun.startYear,
        startDesc: daYun.startDesc,
        jiaoyunDesc: daYun.jiaoyunDesc,
        cycles: daYun.cycles
      },

      // 农历
      lunar: lunar ? {
        year: lunar.year,
        month: lunar.month,
        day: lunar.day,
        isLeap: lunar.isLeap,
        monthName: lunar.monthName,
        dayName: lunar.dayName,
        yearGanZhi: SexagenaryConverter.getLunarYearGanZhi(lunar.year)
      } : null,

      // 生肖与星座
      shengXiao: shengXiao,
      xingZuo: xingZuo,

      // 原始数据（供高级用户使用）
      _raw: {
        ganIndices,
        zhiIndices,
        meta
      }
    };
  }

  /**
   * 获取地支藏干字符
   * @private
   */
  _getCangGanChars(zhiIndex) {
    const cangGan = Constants.CANG_GAN[zhiIndex];
    const chars = [];
    for (let i = 0; i < 3; i++) {
      if (cangGan[i] >= 0) {
        chars.push(Constants.TIAN_GAN[cangGan[i]]);
      }
    }
    return chars;
  }

  /**
   * 快速计算（仅返回核心数据）
   * @param {Object} params - 同 calculate 参数
   * @returns {Object|false}
   */
  calculateSimple(params) {
    const result = this.calculate(params);
    if (!result) return false;

    return {
      bazi: result.bazi,
      pillars: result.pillars,
      wuXing: result.wuXing,
      shiShen: {
        year: { gan: result.shiShen.year.gan, zhi: result.shiShen.year.zhi },
        month: { gan: result.shiShen.month.gan, zhi: result.shiShen.month.zhi },
        day: { gan: result.shiShen.day.gan, zhi: result.shiShen.day.zhi },
        hour: { gan: result.shiShen.hour.gan, zhi: result.shiShen.hour.zhi }
      },
      daYun: {
        direction: result.daYun.direction,
        startAge: result.daYun.startAge,
        cycles: result.daYun.cycles.map(c => ({
          ganZhi: c.ganZhi,
          ageRange: c.ageRange
        }))
      }
    };
  }

  /**
   * 获取指定年龄的运势
   * @param {Object} result - calculate() 的返回结果
   * @param {number} age - 虚岁年龄
   * @returns {Object|null}
   */
  getFortuneAtAge(result, age) {
    if (!result || !result.daYun) return null;

    return DaYunAnalyzer.getAtAge(result.daYun, age);
  }

  /**
   * 获取指定年份的运势
   * @param {Object} result - calculate() 的返回结果
   * @param {number} year - 公历年
   * @returns {Object|null}
   */
  getFortuneAtYear(result, year) {
    if (!result || !result.daYun) return null;

    return DaYunAnalyzer.getAtYear(result.daYun, year);
  }

  // ========== 静态方法（工具函数） ==========

  /**
   * 公历转农历
   * @param {number} year - 公历年
   * @param {number} month - 公历月
   * @param {number} day - 公历日
   * @returns {Object|false}
   */
  static solarToLunar(year, month, day) {
    return DateConverter.solarToLunar(year, month, day);
  }

  /**
   * 农历转公历
   * @param {number} year - 农历年
   * @param {number} month - 农历月
   * @param {number} day - 农历日
   * @param {boolean} [isLeap=false] - 是否闰月
   * @returns {Object|false}
   */
  static lunarToSolar(year, month, day, isLeap = false) {
    return DateConverter.lunarToSolar(year, month, day, isLeap);
  }

  /**
   * 计算真太阳时
   * @param {number} year - 公历年
   * @param {number} month - 公历月
   * @param {number} day - 公历日
   * @param {number} hour - 小时
   * @param {number} minute - 分钟
   * @param {number} second - 秒
   * @param {number} longitude - 经度
   * @param {number} [latitude=35] - 纬度
   * @returns {number[]} [年, 月, 日, 时, 分, 秒]
   */
  static toTrueSolarTime(year, month, day, hour, minute, second, longitude, latitude = 35) {
    return Astronomy.dateToTrueSolarTime(year, month, day, hour, minute, second, longitude, latitude);
  }

  /**
   * 获取指定年份的立春时刻
   * @param {number} year - 公历年份
   * @returns {number[]} [年, 月, 日, 时, 分, 秒]
   */
  static getLiChunTime(year) {
    return BaZiCalculator.getLiChunTime(year);
  }

  /**
   * 获取指定年份的24节气
   * @param {number} year - 公历年份
   * @returns {Object[]} 节气数组
   */
  static getSolarTerms(year) {
    return Astronomy.getSolarTermsTable(year);
  }

  /**
   * 解析八字字符串
   * @param {string} baziStr - 八字字符串（8个字）
   * @returns {Object|false}
   */
  static parseBaZi(baziStr) {
    return SexagenaryConverter.parseBaZi(baziStr);
  }
}

// 导出所有子模块
export {
  Calendar,
  Astronomy,
  DateConverter,
  SexagenaryConverter,
  BaZiCalculator,
  WuXingCalculator,
  ShiShenCalculator,
  RelationshipAnalyzer,
  DaYunAnalyzer,
  Constants
};

export default BaZi;
