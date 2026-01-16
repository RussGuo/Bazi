/**
 * 刑冲合害关系分析模块
 * @module analysis/RelationshipAnalyzer
 */

import { TIAN_GAN, DI_ZHI, WU_XING } from '../core/Constants.js';
import {
  RELATION_TYPES,
  RELATION_TYPE_NAMES,
  RELATION_DATA,
  RELATION_EXCLUDES,
  getTransformElement
} from '../data/GXData.js';

/**
 * 刑冲合害关系分析器
 */
export class RelationshipAnalyzer {
  /**
   * 分析八字的所有刑冲合害关系
   * @param {number[]} ganIndices - 四柱天干索引
   * @param {number[]} zhiIndices - 四柱地支索引
   * @returns {Object} {gan: 天干关系[], zhi: 地支关系[]}
   */
  static analyze(ganIndices, zhiIndices) {
    const ganRelations = RelationshipAnalyzer._findRelations(ganIndices, 0);
    const zhiRelations = RelationshipAnalyzer._findRelations(zhiIndices, 1);

    return {
      gan: ganRelations,
      zhi: zhiRelations
    };
  }

  /**
   * 内部方法：查找关系
   * @private
   */
  static _findRelations(indices, targetType) {
    const results = [];
    const foundRelations = []; // 用于排除检查

    // 遍历所有关系数据
    for (const relation of RELATION_DATA) {
      const [type, relationType, participants, transformResult, description] = relation;

      // 只处理对应类型（天干或地支）
      if (type !== targetType) continue;

      // 查找匹配
      const matches = RelationshipAnalyzer._findMatches(indices, participants);

      if (matches.length === 0) continue;

      // 检查是否需要排除（如半合排除三合）
      for (const match of matches) {
        // 检查是否应该被排除
        const excludeType = RELATION_EXCLUDES[relationType];
        if (excludeType !== undefined) {
          const shouldExclude = foundRelations.some(fr => {
            if (fr.type !== excludeType) return false;
            // 检查参与者是否有交集
            return RelationshipAnalyzer._hasIntersection(fr.positions, match.positions);
          });

          if (shouldExclude) continue;
        }

        const result = {
          type: relationType,
          typeName: RELATION_TYPE_NAMES[relationType],
          participants: match.chars,
          positions: match.positions,
          description: description
        };

        // 添加化合结果
        if (transformResult >= 0) {
          result.transform = getTransformElement(transformResult);
        }

        results.push(result);
        foundRelations.push(result);
      }
    }

    return results;
  }

  /**
   * 查找匹配的位置
   * @private
   */
  static _findMatches(indices, participants) {
    const matches = [];

    // 计算indices中每个值出现的位置
    const positionMap = new Map();
    for (let i = 0; i < indices.length; i++) {
      const val = indices[i];
      if (!positionMap.has(val)) {
        positionMap.set(val, []);
      }
      positionMap.get(val).push(i);
    }

    // 检查参与者是否都存在
    const participantCounts = new Map();
    for (const p of participants) {
      participantCounts.set(p, (participantCounts.get(p) || 0) + 1);
    }

    // 验证每个参与者都有足够的位置
    for (const [p, count] of participantCounts) {
      const positions = positionMap.get(p);
      if (!positions || positions.length < count) {
        return []; // 不满足条件
      }
    }

    // 生成所有可能的位置组合
    const combinations = RelationshipAnalyzer._generateCombinations(
      participants,
      positionMap,
      participantCounts
    );

    // 转换为结果格式
    for (const positions of combinations) {
      const isGan = indices.length === 4 && participants.every(p => p < 10);
      const charArray = isGan ? TIAN_GAN : DI_ZHI;

      matches.push({
        positions: positions,
        chars: positions.map(pos => charArray[indices[pos]])
      });
    }

    return matches;
  }

  /**
   * 生成位置组合
   * @private
   */
  static _generateCombinations(participants, positionMap, participantCounts) {
    const uniqueParticipants = [...participantCounts.keys()];
    const results = [];

    function backtrack(index, currentPositions, usedPositions) {
      if (index === participants.length) {
        results.push([...currentPositions]);
        return;
      }

      const p = participants[index];
      const positions = positionMap.get(p);

      for (const pos of positions) {
        if (!usedPositions.has(pos)) {
          currentPositions.push(pos);
          usedPositions.add(pos);
          backtrack(index + 1, currentPositions, usedPositions);
          usedPositions.delete(pos);
          currentPositions.pop();
        }
      }
    }

    backtrack(0, [], new Set());
    return results;
  }

  /**
   * 检查两个数组是否有交集
   * @private
   */
  static _hasIntersection(arr1, arr2) {
    const set = new Set(arr1);
    return arr2.some(item => set.has(item));
  }

  /**
   * 简化分析结果（只返回关系类型和参与者）
   * @param {number[]} ganIndices - 四柱天干索引
   * @param {number[]} zhiIndices - 四柱地支索引
   * @returns {Object}
   */
  static analyzeSimple(ganIndices, zhiIndices) {
    const result = RelationshipAnalyzer.analyze(ganIndices, zhiIndices);

    return {
      gan: result.gan.map(r => ({
        type: r.typeName,
        items: r.participants,
        result: r.transform || null
      })),
      zhi: result.zhi.map(r => ({
        type: r.typeName,
        items: r.participants,
        result: r.transform || null
      }))
    };
  }

  /**
   * 按关系类型分组
   * @param {Object} analysisResult - analyze()的返回结果
   * @returns {Object} 按类型分组的结果
   */
  static groupByType(analysisResult) {
    const grouped = {
      gan: {},
      zhi: {}
    };

    for (const rel of analysisResult.gan) {
      const typeName = rel.typeName;
      if (!grouped.gan[typeName]) {
        grouped.gan[typeName] = [];
      }
      grouped.gan[typeName].push(rel);
    }

    for (const rel of analysisResult.zhi) {
      const typeName = rel.typeName;
      if (!grouped.zhi[typeName]) {
        grouped.zhi[typeName] = [];
      }
      grouped.zhi[typeName].push(rel);
    }

    return grouped;
  }

  /**
   * 检查是否存在特定类型的关系
   * @param {Object} analysisResult - analyze()的返回结果
   * @param {string} typeName - 关系类型名称（如'冲'、'合'、'刑'等）
   * @returns {boolean}
   */
  static hasRelationType(analysisResult, typeName) {
    const allRelations = [...analysisResult.gan, ...analysisResult.zhi];
    return allRelations.some(r => r.typeName === typeName || r.typeName.includes(typeName));
  }

  /**
   * 统计关系数量
   * @param {Object} analysisResult - analyze()的返回结果
   * @returns {Object} {gan: {类型: 数量}, zhi: {类型: 数量}, total: 总数}
   */
  static countRelations(analysisResult) {
    const ganCount = {};
    const zhiCount = {};

    for (const rel of analysisResult.gan) {
      ganCount[rel.typeName] = (ganCount[rel.typeName] || 0) + 1;
    }

    for (const rel of analysisResult.zhi) {
      zhiCount[rel.typeName] = (zhiCount[rel.typeName] || 0) + 1;
    }

    return {
      gan: ganCount,
      zhi: zhiCount,
      total: analysisResult.gan.length + analysisResult.zhi.length
    };
  }

  /**
   * 获取关系类型常量
   * @returns {Object}
   */
  static getRelationTypes() {
    return { ...RELATION_TYPES };
  }

  /**
   * 获取指定位置涉及的所有关系
   * @param {Object} analysisResult - analyze()的返回结果
   * @param {number} position - 位置索引（0=年, 1=月, 2=日, 3=时）
   * @returns {Object} {gan: [], zhi: []}
   */
  static getRelationsAtPosition(analysisResult, position) {
    return {
      gan: analysisResult.gan.filter(r => r.positions.includes(position)),
      zhi: analysisResult.zhi.filter(r => r.positions.includes(position))
    };
  }

  /**
   * 判断两个位置之间是否有关系
   * @param {Object} analysisResult - analyze()的返回结果
   * @param {number} pos1 - 位置1
   * @param {number} pos2 - 位置2
   * @returns {Object[]} 两个位置之间的所有关系
   */
  static getRelationsBetween(analysisResult, pos1, pos2) {
    const allRelations = [...analysisResult.gan, ...analysisResult.zhi];
    return allRelations.filter(r =>
      r.positions.includes(pos1) && r.positions.includes(pos2)
    );
  }

  // ==================== 格局提取 ====================

  /**
   * 提取格局（三会三合六合等）
   * @param {number[]} zhiIndices - 四柱地支索引
   * @returns {Object} 格局分析结果
   */
  static extractFormations(zhiIndices) {
    const dummyGan = [0, 0, 0, 0];
    const relations = RelationshipAnalyzer.analyze(dummyGan, zhiIndices);

    const extract = (type) => relations.zhi
      .filter(r => r.type === type)
      .map(r => ({
        zhi: r.participants,
        positions: r.positions,
        element: r.transform || null,
        description: r.description
      }));

    return {
      sanHui: extract(RELATION_TYPES.SAN_HUI),
      sanHe: extract(RELATION_TYPES.SAN_HE),
      liuHe: extract(RELATION_TYPES.LIU_HE),
      banHe: extract(RELATION_TYPES.BAN_HE),
      gongHe: extract(RELATION_TYPES.GONG_HE),
      gongHui: extract(RELATION_TYPES.GONG_HUI)
    };
  }
}

export default RelationshipAnalyzer;
