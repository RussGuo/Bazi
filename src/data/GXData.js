/**
 * 刑冲合害关系数据
 * @module data/GXData
 */

import { WU_XING } from '../core/Constants.js';

/**
 * 关系类型定义
 */
export const RELATION_TYPES = {
  // 天干关系
  GAN_CHONG: 0,     // 天干冲
  GAN_HE: 1,        // 天干合

  // 地支关系
  ZHI_CHONG: 2,     // 地支冲
  SAN_XING: 3,      // 三刑
  XIANG_XING: 4,    // 相刑
  ZI_XING: 5,       // 自刑
  LIU_HE: 6,        // 六合
  SAN_HE: 7,        // 三合
  BAN_HE: 8,        // 半合
  GONG_HE: 9,       // 拱合
  SAN_HUI: 10,      // 三会
  GONG_HUI: 11,     // 拱会
  AN_HE: 12,        // 暗合
  HAI: 13           // 害
};

/**
 * 关系类型名称
 */
export const RELATION_TYPE_NAMES = {
  [RELATION_TYPES.GAN_CHONG]: '冲',
  [RELATION_TYPES.GAN_HE]: '合',
  [RELATION_TYPES.ZHI_CHONG]: '冲',
  [RELATION_TYPES.SAN_XING]: '三刑',
  [RELATION_TYPES.XIANG_XING]: '相刑',
  [RELATION_TYPES.ZI_XING]: '自刑',
  [RELATION_TYPES.LIU_HE]: '六合',
  [RELATION_TYPES.SAN_HE]: '三合',
  [RELATION_TYPES.BAN_HE]: '半合',
  [RELATION_TYPES.GONG_HE]: '拱合',
  [RELATION_TYPES.SAN_HUI]: '三会',
  [RELATION_TYPES.GONG_HUI]: '拱会',
  [RELATION_TYPES.AN_HE]: '暗合',
  [RELATION_TYPES.HAI]: '害'
};

/**
 * 关系数据格式: [目标类型(0天干/1地支), 关系类型, [参与者索引], 化合结果(-1无), 描述]
 */
export const RELATION_DATA = [
  // 天干冲 (4组)
  [0, RELATION_TYPES.GAN_CHONG, [0, 6], -1, '甲庚冲'],
  [0, RELATION_TYPES.GAN_CHONG, [1, 7], -1, '乙辛冲'],
  [0, RELATION_TYPES.GAN_CHONG, [2, 8], -1, '丙壬冲'],
  [0, RELATION_TYPES.GAN_CHONG, [3, 9], -1, '丁癸冲'],

  // 天干合 (5组)
  [0, RELATION_TYPES.GAN_HE, [0, 5], 4, '甲己合化土'],
  [0, RELATION_TYPES.GAN_HE, [1, 6], 0, '乙庚合化金'],
  [0, RELATION_TYPES.GAN_HE, [2, 7], 1, '丙辛合化水'],
  [0, RELATION_TYPES.GAN_HE, [3, 8], 2, '丁壬合化木'],
  [0, RELATION_TYPES.GAN_HE, [4, 9], 3, '戊癸合化火'],

  // 地支冲 (6组)
  [1, RELATION_TYPES.ZHI_CHONG, [0, 6], -1, '子午冲'],
  [1, RELATION_TYPES.ZHI_CHONG, [1, 7], -1, '丑未冲'],
  [1, RELATION_TYPES.ZHI_CHONG, [2, 8], -1, '寅申冲'],
  [1, RELATION_TYPES.ZHI_CHONG, [3, 9], -1, '卯酉冲'],
  [1, RELATION_TYPES.ZHI_CHONG, [4, 10], -1, '辰戌冲'],
  [1, RELATION_TYPES.ZHI_CHONG, [5, 11], -1, '巳亥冲'],

  // 三刑 (2组)
  [1, RELATION_TYPES.SAN_XING, [2, 5, 8], -1, '寅巳申三刑'],
  [1, RELATION_TYPES.SAN_XING, [1, 10, 7], -1, '丑戌未三刑'],

  // 相刑 (5组)
  [1, RELATION_TYPES.XIANG_XING, [2, 5], -1, '寅巳相刑'],
  [1, RELATION_TYPES.XIANG_XING, [5, 8], -1, '巳申相刑'],
  [1, RELATION_TYPES.XIANG_XING, [1, 10], -1, '丑戌相刑'],
  [1, RELATION_TYPES.XIANG_XING, [10, 7], -1, '戌未相刑'],
  [1, RELATION_TYPES.XIANG_XING, [0, 3], -1, '子卯相刑'],

  // 自刑 (4组)
  [1, RELATION_TYPES.ZI_XING, [9, 9], -1, '酉酉自刑'],
  [1, RELATION_TYPES.ZI_XING, [11, 11], -1, '亥亥自刑'],
  [1, RELATION_TYPES.ZI_XING, [6, 6], -1, '午午自刑'],
  [1, RELATION_TYPES.ZI_XING, [4, 4], -1, '辰辰自刑'],

  // 六合 (6组)
  [1, RELATION_TYPES.LIU_HE, [0, 1], 4, '子丑合化土'],
  [1, RELATION_TYPES.LIU_HE, [2, 11], 2, '寅亥合化木'],
  [1, RELATION_TYPES.LIU_HE, [3, 10], 3, '卯戌合化火'],
  [1, RELATION_TYPES.LIU_HE, [4, 9], 0, '辰酉合化金'],
  [1, RELATION_TYPES.LIU_HE, [5, 8], 1, '巳申合化水'],
  [1, RELATION_TYPES.LIU_HE, [6, 7], 3, '午未合化火'],

  // 三合 (4组)
  [1, RELATION_TYPES.SAN_HE, [2, 6, 10], 3, '寅午戌三合火'],
  [1, RELATION_TYPES.SAN_HE, [8, 0, 4], 1, '申子辰三合水'],
  [1, RELATION_TYPES.SAN_HE, [5, 9, 1], 0, '巳酉丑三合金'],
  [1, RELATION_TYPES.SAN_HE, [11, 3, 7], 2, '亥卯未三合木'],

  // 半合 (8组)
  [1, RELATION_TYPES.BAN_HE, [8, 0], 1, '申子半合水'],
  [1, RELATION_TYPES.BAN_HE, [0, 4], 1, '子辰半合水'],
  [1, RELATION_TYPES.BAN_HE, [11, 3], 2, '亥卯半合木'],
  [1, RELATION_TYPES.BAN_HE, [3, 7], 2, '卯未半合木'],
  [1, RELATION_TYPES.BAN_HE, [2, 6], 3, '寅午半合火'],
  [1, RELATION_TYPES.BAN_HE, [6, 10], 3, '午戌半合火'],
  [1, RELATION_TYPES.BAN_HE, [5, 9], 0, '巳酉半合金'],
  [1, RELATION_TYPES.BAN_HE, [9, 1], 0, '酉丑半合金'],

  // 拱合 (4组)
  [1, RELATION_TYPES.GONG_HE, [8, 4], 0, '申辰拱合子'],
  [1, RELATION_TYPES.GONG_HE, [11, 7], 3, '亥未拱合卯'],
  [1, RELATION_TYPES.GONG_HE, [2, 10], 6, '寅戌拱合午'],
  [1, RELATION_TYPES.GONG_HE, [5, 1], 9, '巳丑拱合酉'],

  // 三会 (4组)
  [1, RELATION_TYPES.SAN_HUI, [2, 3, 4], 2, '寅卯辰会木'],
  [1, RELATION_TYPES.SAN_HUI, [5, 6, 7], 3, '巳午未会火'],
  [1, RELATION_TYPES.SAN_HUI, [8, 9, 10], 0, '申酉戌会金'],
  [1, RELATION_TYPES.SAN_HUI, [11, 0, 1], 1, '亥子丑会水'],

  // 拱会 (4组)
  [1, RELATION_TYPES.GONG_HUI, [2, 4], 3, '寅辰拱会卯'],
  [1, RELATION_TYPES.GONG_HUI, [5, 7], 6, '巳未拱会午'],
  [1, RELATION_TYPES.GONG_HUI, [8, 10], 9, '申戌拱会酉'],
  [1, RELATION_TYPES.GONG_HUI, [11, 1], 0, '亥丑拱会子'],

  // 暗合 (7组)
  [1, RELATION_TYPES.AN_HE, [3, 8], -1, '卯申暗合'],
  [1, RELATION_TYPES.AN_HE, [6, 11], -1, '午亥暗合'],
  [1, RELATION_TYPES.AN_HE, [1, 2], -1, '丑寅暗合'],
  [1, RELATION_TYPES.AN_HE, [2, 7], -1, '寅未暗合'],
  [1, RELATION_TYPES.AN_HE, [0, 10], -1, '子戌暗合'],
  [1, RELATION_TYPES.AN_HE, [0, 4], -1, '子辰暗合'],
  [1, RELATION_TYPES.AN_HE, [5, 9], -1, '巳酉暗合'],

  // 害 (6组)
  [1, RELATION_TYPES.HAI, [0, 7], -1, '子未害'],
  [1, RELATION_TYPES.HAI, [1, 6], -1, '丑午害'],
  [1, RELATION_TYPES.HAI, [2, 5], -1, '寅巳害'],
  [1, RELATION_TYPES.HAI, [3, 4], -1, '卯辰害'],
  [1, RELATION_TYPES.HAI, [8, 11], -1, '申亥害'],
  [1, RELATION_TYPES.HAI, [9, 10], -1, '酉戌害']
];

/**
 * 关系排除规则：存在前者时，排除后者
 * 例如：存在三合时，排除半合和拱合
 */
export const RELATION_EXCLUDES = {
  [RELATION_TYPES.XIANG_XING]: RELATION_TYPES.SAN_XING,  // 相刑排除三刑
  [RELATION_TYPES.BAN_HE]: RELATION_TYPES.SAN_HE,        // 半合排除三合
  [RELATION_TYPES.GONG_HE]: RELATION_TYPES.SAN_HE,       // 拱合排除三合
  [RELATION_TYPES.GONG_HUI]: RELATION_TYPES.SAN_HUI      // 拱会排除三会
};

/**
 * 获取化合结果的五行
 * @param {number} resultIndex - 化合结果索引
 * @returns {string|null} 五行名称，无化合返回null
 */
export function getTransformElement(resultIndex) {
  if (resultIndex < 0 || resultIndex > 4) return null;
  return WU_XING[resultIndex];
}

export default {
  RELATION_TYPES,
  RELATION_TYPE_NAMES,
  RELATION_DATA,
  RELATION_EXCLUDES,
  getTransformElement
};
