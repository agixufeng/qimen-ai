import { shenqiReading } from './shenqi.js';
export { CLASSICAL_CASES, type ClassicalStudyExample } from './classical-cases.js';
export { KNOWLEDGE_VERSION } from './shenqi.js';
export { CLASSICS, CLASSICS_VERSION, getClassic } from './classics.js';
export type { ClassicBook, ClassicEntry } from './classics.js';

/** Original editorial notes: CC BY 4.0. Code: MIT. No modern book text is bundled. */
export interface Source {
  id: string;
  title: string;
  author?: string;
  url: string;
  locator: string;
  rights: string;
  note: string;
}

export interface CombinationReading {
  sourceId: string;
  name: string;
  nameKind?: 'named' | 'editorial';
  summary: string;
  conditions: string[];
  status: 'verified' | 'pending';
  locator: string;
  note?: string;
}

export interface Combination {
  id: string;
  heaven: string;
  earth: string;
  name: string;
  summary: string;
  conditions: string[];
  sourceIds: string[];
  primarySourceId: string;
  readings: CombinationReading[];
  /** verified = checked against the linked transcription, not a facsimile or outcome validation. */
  status: 'verified' | 'pending';
  note?: string;
}

const yudingUrl = 'https://book.taiyi.me/卜/御定奇门宝鉴';
export const SOURCES: Source[] = [
  {
    id: 'dunjia-yanyi-wikisource',
    title: '《遁甲演义》维基文库转录',
    url: 'https://zh.wikisource.org/wiki/遁甲演義',
    locator: '本次可定位卷一·时家奇门、卷二·天遁；正文还见卷三标题',
    rights:
      '只登记书目、位置和外链；不镜像原文、现代注释或站点整理。古籍原作与现代转录许可分别核验。',
    note: '2026-10-29重读公开页面。前言称四卷，本次正文可见卷一至三，卷四未核，不能称全文。天遁的假如例属于教学构造，不当成实际占验或当前拆补规则的正确答案。',
  },
  {
    id: 'qimen-tongzong-wikisource',
    title: '《奇门遁甲统宗》维基文库转录',
    url: 'https://zh.wikisource.org/wiki/奇門遁甲統宗',
    locator: '卷之一·遁甲起例、论超接之法；页面明列卷四至九略',
    rights: '仅来源位置、外链与项目原创导读；不复制转录全文、注释或版式，站点许可不由本项目代授。',
    note: '2026-10-29重读公开页面，核到两个卷一正文入口及卷四至九略的缺文说明。正文并列超接置闰与接闰，不把整本书当作当前单一拆补profile的算法依据。',
  },
  {
    id: 'qimen-tongzong-scan',
    title: '《奇门遁甲统宗》国图本影印检索入口',
    url: 'https://commons.wikimedia.org/wiki/File:NLC416-12jh003951-48665_奇門遁甲統宗.pdf',
    locator: 'Wikimedia Commons文件页；用于查询影印与文件权利说明，未建立章段与页码映射',
    rights: '本项目不保存或分发扫描；文件页权利标识须结合具体使用另核，不因外链而转授许可。',
    note: '保留独立影印检索入口，尚未逐页核对，也未证明其与维基文库转录为同一底本。不能把外链存在写成全文已收录或纸本校勘已完成。',
  },
  {
    id: 'annotation-profile',
    title: 'v0.2 项目辅助参数约定',
    url: '#/sources',
    locator: 'docs/annotations.md；packages/core 辅助规则配置与 analyzeChart',
    rights: '项目原创规则说明 CC BY 4.0；实现代码 MIT。',
    note: '用户批准的版本化实现约定。标准/专业层仅改变显示；时间与基础布盘沿用原 profile。入墓采用阳顺阴逆长生表的墓态，不等同古籍所有三奇入墓条文，也不声称为从真内部算法。',
  },
  {
    id: 'xunkong-yima',
    title: '四柱旬空、驿马与宫支对照表（项目固定规则）',
    url: '#/sources',
    locator: 'docs/annotations.md：六旬空表、四组驿马、宫支；用户批准的 v0.2 规则表',
    rights: '传统历法对应关系及项目原创说明；不复制商业软件断法。',
    note: '每柱分别依其干支查旬空、依其地支查驿马。这里登记的是明确执行表，不冒称某本古籍的已校勘原文；不判断真空假空、冲空解空或力量百分比。',
  },
  {
    id: 'growth-table',
    title: '十干十二长生：阳顺阴逆、土随火（项目选用表）',
    url: 'https://www.wuxizhouyi.com/nd.jsp?fromColId=2&id=467',
    locator: '参考链接；实际执行表见 docs/annotations.md 的起长生支与十二状态顺序',
    rights: '仅登记参考链接和自行编写的计算规则，不镜像网页图表或正文。',
    note: '2026-10-28 本次原站读取超时，备用读取报证书域名不匹配；该链接原文待复核。实现依据为用户批准的明确规则表，乙墓戌、丁己墓丑，不将此说与乙入坤等古法合并。',
  },
  {
    id: 'star-season',
    title: '《烟波钓叟赋》九星旺衰、六仪击刑与门迫',
    url: 'https://m.guwendao.net/shiwenv_ec9e951faedc.aspx',
    locator: '九星旺衰段“与我同行即为相”；六仪击刑段；末段门宫相制说明',
    rights: '古籍规则信息与项目原创归纳；不复制网页注释或长篇原文。',
    note: '2026-10-28 实读公开网页转录，未核原刻影印。星生月为旺、同相、月生星为废、星克月为休、月克星为囚；八门及宫位另用项目固定正五行月令规则。本篇三奇入墓说与本版长生表不完全相同。',
  },
  {
    id: 'congzhen-reference',
    title: '从真奇门官方应用商店功能说明与更新记录',
    url: 'https://play.google.com/store/apps/details?hl=zh_TW&id=cn.congzhen.CongZhenQiMenAndroidGooglePlay',
    locator:
      '官方说明与展示图；App Store 更新 2.2.7、2.3.1、2.3.7、2.5.3，另见 docs/congzhen-reference.md',
    rights: '商业产品；仅引用链接和原创功能归纳，不复制截图、图标、文案或断法库。',
    note: '2026-10-28 核对官方公开介绍与更新记录，作为盘面参数覆盖的参考；未运行客户端、未比对同盘输出、未取得内部算法。资料不能证明两产品规则完全相同。',
  },
  {
    id: 'shenqi-setup',
    title: '《神奇之门》中篇第三章·时家奇门的起局方法',
    author: '张志春',
    url: 'https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1164',
    locator: '第三章：掌上快速起局法、纸上起局方法；对照值符随时干、值使随时宫等步骤',
    rights: '现代著作；仅登记书目和链接，不收录其正文或图表。',
    note: '2026-10-28 核对网页转录。网页未给出可核印次和纸本页码；转录不等同作者授权数字版。项目的时间边界与寄宫选择另见 project-profile。',
  },
  {
    id: 'shenqi-patterns',
    title: '《神奇之门》中篇第五章·奇门预测的判断依据',
    author: '张志春',
    url: 'https://www.zhaosir.online/Books/BookChapterDetail.aspx?did=1166',
    locator: '第一节十干克应；本章伏吟、反吟及门迫相关条目',
    rights:
      '现代著作；仅保留传统短格名、规则事实、来源定位和项目原创简释，不复制现代断语整表或图表。',
    note: '2026-10-28 逐项核对第一节81组合的公开网页转录。印次、页码未明，非已确认作者授权数字版；人/入疑字逐项标待校。丙辛、丁壬采用条目摘要标签，并明示非独立专名。默认使用本来源，御定另列，不拼接断语。',
  },
  {
    id: 'yuding',
    title: '《御定奇门宝鉴》·歌赋条文',
    url: yudingUrl,
    locator: '烟波钓叟歌及其注、汉阴居士歌、神机赋、指迷赋摘',
    rights: '古籍原文属于公版材料；网页标点、整理成果未视为已获开放许可，本项目不镜像网页。',
    note: '2026-10-28 核对太乙书局转录；未核原刻影印版本。《汉阴居士歌》涉及置闰等与首版不同的方法，不作为首版整套排盘约定。',
  },
  {
    id: 'yuding-hunhe',
    title: '《御定奇门宝鉴》·混合百神',
    url: yudingUrl,
    locator: '混合百神：从六甲加甲至六癸加癸；本包各条 note 指明对应起句',
    rights:
      '古籍格名与规则信息；简释由项目自行编写，按 CC BY 4.0 许可。未复制古籍长篇断语或网页整理正文。',
    note: '2026-10-28 核对公开转录，未核原刻影印。本章末说明将甲寄戊，本表仅在此章的九干查表语境中把甲行列映射为戊；不得推广为所有六甲恒等于戊。辛加辛条的转录存在疑字。',
  },
  {
    id: 'project-profile',
    title: '项目排盘约定 shijia-zhuanpan-chaibu-v1',
    url: '#/sources',
    locator: 'docs/rules.md；packages/core 中的版本化规则配置；docs/terminology.md',
    rights: '本项目原创约定与文档；代码 MIT，原创知识说明 CC BY 4.0。',
    note: '现代工程实现选择；不声称某本古籍明确规定 UTC+8、JSON 版本或全部边界。固定规则用于复现，争议规则需新版本。',
  },
];

export const STEMS = ['乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;

// Each row follows STEMS order. Names follow 混合百神, not a mixed modern table.
const NAMES: Record<string, string[]> = {
  乙: [
    '日奇伏刑',
    '奇仪顺格',
    '朱雀入墓',
    '阴中返阳',
    '日奇入雾',
    '日奇自刑',
    '青龙逃走',
    '青龙得云',
    '日入天网',
  ],
  丙: [
    '月奇浮云',
    '月奇勃格',
    '奇入朱雀',
    '飞鸟跌穴',
    '火孛入刑',
    '荧入太白',
    '月精合佑',
    '孛乱来临',
    '华盖孛师',
  ],
  丁: [
    '格为人遁',
    '加中复奇',
    '奇入太阴',
    '青龙得光',
    '火入勾神',
    '织女寻牛',
    '朱雀入狱',
    '五人相和',
    '朱雀沉江',
  ],
  戊: [
    '青龙入云',
    '青龙返首',
    '青龙耀明',
    '青龙出地',
    '青龙合灵',
    '青龙符格',
    '青龙失惊',
    '青龙网罗',
    '青龙华盖',
  ],
  己: [
    '墓入不明',
    '格名孛师',
    '奇入墓名',
    '伏格青龙',
    '地户逢鬼',
    '刑格之名',
    '魂神入墓',
    '刑网高张',
    '地刑元武',
  ],
  庚: [
    '日合六格',
    '太白入荧',
    '名曰亭亭',
    '刑青龙格',
    '刑格凶否',
    '太白之名',
    '干格白虎',
    '蛇格之名',
    '大刑之格',
  ],
  辛: [
    '白虎猖狂',
    '干合荧惑',
    '狱神入奇',
    '龙困遭伤',
    '刑狱之格',
    '白虎伤格',
    '狱入自刑（待校）',
    '蛇入狱刑',
    '直格华盖',
  ],
  壬: [
    '格名小蛇',
    '蛇入冶炉',
    '干合蛇刑',
    '蛇化为龙',
    '蛇凶入狱',
    '太白骑蛇',
    '螣蛇格干',
    '罗网自缠',
    '螣蛇飞空',
  ],
  癸: [
    '华盖逢星',
    '盖遇孛师',
    '螣蛇夭矫',
    '罗网青龙',
    '华盖地户',
    '大格飞名',
    '狱入天牢',
    '复见螣蛇',
    '天网高张',
  ],
};

// Original, non-deterministic learning prompts. They are not predictions or quotations.
const SUMMARIES: Record<string, string[]> = {
  乙: [
    '同干重叠可用于观察重复与停留；本章关注名位的维持。',
    '原条把推进与分离放在不同条件下讨论；先明确所问对象。',
    '此版本关注材料被搁置以及恢复流转的条件。',
    '可作为检查内外行动方式与资源损耗的提示。',
    '以混杂、不明为阅读线索，核对事情是否尚欠澄清。',
    '关注利益归属与争执；不要仅凭组合推断伴侣行为。',
    '用退避、离开或流失的象意提出核对问题。',
    '本章的解释依对象而异，单独组合不足以给出统一趋势。',
    '把消息期待与约束并看；实际进展仍需外部资料核实。',
  ],
  丙: [
    '关注材料提交和表达渠道，结合宫内其他信息读其顺阻。',
    '两重文书的象意可提醒检查重复手续与冲突要求。',
    '围绕文书和权限阅读；不同身份的传统解释并不相同。',
    '取归宿和获得承接的象意，不能据此保证目标实现。',
    '关注材料延迟与限制条件，并保留星门带来的修正。',
    '传统侧重冲突和耗损，实际分析先检查相关阻力。',
    '取协同与援助的象意，是否存在帮助须另行核实。',
    '以秩序受扰为线索，核对争论及行动上的不稳定。',
    '原条含过程与结果的不同方向，不宜简化为单一标签。',
  ],
  丁: [
    '本章使用人遁之名，关注推荐与帮助；与复合人遁格须区分。',
    '同样的组合可有不同角色解释，留意沟通争执与身份条件。',
    '关注信息到达与重复表达；不要由局部同干推断全盘伏吟。',
    '取获得支持和能见度增加的象意，仍需结合其他盘层。',
    '关注隐情或未公开条件，避免把象意当作他人事实。',
    '此版本围绕关系牵连与争议阅读，现代常见异名另有侧重。',
    '关注限制及其可能变化，须先明确主体与实际处境。',
    '取协商、会合的象意；干合不等于事情一定成功。',
    '提示核对信息与沟通是否沉滞，不预言诉讼结果。',
  ],
  戊: [
    '把表面名声与实际条件对照，检查支持是否真正到位。',
    '取回转、照应的象意；星门条件仍参与判断。',
    '关注支持与表达机会，并检查是否存在相反限制。',
    '围绕消息、资源与可用程度阅读，不把期待当作到账。',
    '把协调与实际配合并看，避免只依格名判断进展。',
    '关注突发阻力与推进节奏，实际风险另行确认。',
    '原条的结果随星门条件改变，应保留条件性。',
    '用牵制和难以协调的象意梳理当前问题。',
    '同一组合可因门星不同而有不同解释，先核对条件。',
  ],
  己: [
    '关注信息不明与行动受限，查看是否具备协调条件。',
    '原条按角色区分解释，不能把历史性别断语套用到个人。',
    '涉及文书与争议的阶段变化，适合核对程序先后关系。',
    '资源机会与行动受阻同时存在于条件式解释中。',
    '以消息可信度作为核对方向；格名不证明鬼神存在。',
    '关注行动顺序和主客角色，避免孤立判定进退。',
    '带有旧时鬼神语言；本项目只保留格名供文献检索。',
    '原条使用强烈冲突意象；不据此推断伤亡或犯罪。',
    '原条含疾患象意；不用于身体诊断或治疗决策。',
  ],
  庚: [
    '会合与受限并存于原条，核对沟通及实际约束。',
    '这是庚临丙的方向，传统兵事取象不能与丙临庚互换。',
    '关注文书争议与未公开条件，结合现实资料判断。',
    '本章保留星门配合的例外条件，不宜只凭格名作判断。',
    '取申诉受阻的象意；不作为现实法律结果的预测。',
    '同干并见可提示冲突重复，应核对实际问题与阶段。',
    '原条偏向道路与同行关系，实际出行应依现实安全信息。',
    '围绕消息、路径与联系中断阅读，先检查具体障碍。',
    '关注远行计划与资源牵制，不照搬古代灾病断语。',
  ],
  辛: [
    '辛临乙侧重侵扰与冲突；与乙临辛的退避象意分别记录。',
    '关注协议表述、资源争议与条件是否一致。',
    '机会与延迟并见，避免把传统倍利措辞当作收益承诺。',
    '取压制或受困的象意，同时保留星门修正条件。',
    '关注权责与规则约束，不将旧时主仆语言套入现代关系。',
    '此版本强调关系争执；不据格名推定私生活事实。',
    '公开转录的干字存在疑误，暂不提供事件解释。',
    '关注争议反复与谁先行动，不能由此认定责任归属。',
    '把可获得支持与星门配合一并检查。',
  ],
  壬: [
    '原条有并列且方向不同的断语，需保留语境。',
    '以争端与投入落空为核对线索，不直接预测成败。',
    '关注文书、资源的协调，结合主体身份与实际条件。',
    '原条区分不同主体，并提醒留意事情能否持续。',
    '利益与关系不和同见于原条，避免选择性只读一面。',
    '关注辨别和规则执行，实际纠纷须依证据处理。',
    '取内部不一致的象意；象意本身不能证明欺骗。',
    '关注自我牵制与循环，检查可否通过现实步骤解除。',
    '关系波动与消息往来并列，须结合星门读条件。',
  ],
  癸: [
    '传统解释随身份不同而变化，不宜做无条件吉凶结论。',
    '可关注依托、文书与表达途径，现实支持仍须核实。',
    '围绕惊疑、反复与文书变化阅读，不把象意当作事件。',
    '机会与约束并存，关注协作条件是否成熟。',
    '侧重到达、居处与等待，结果仍取决于门星条件。',
    '把权限、程序延迟及资源分歧分别核对。',
    '关注制度约束及解除条件，不预测刑罚或羁押。',
    '原条含家庭生育旧断，本项目不据此判断个人生育能力。',
    '取受约束与远近联系的象意，注意配合条件的变化。',
  ],
};

const VARIANTS: Record<string, string> = {
  '乙-丁':
    '异名对照：《神奇之门》十干克应作“奇仪相佐”；本章作“朱雀入墓”。两条语义不同，不能合并成一个确定解释。',
  '丁-庚': '异名对照：《神奇之门》作“文书阻隔”；本表保留《混合百神》的“织女寻牛”。',
  '辛-辛': '本章网页写“六辛加卒”，疑为“六辛加辛”；未见原刻影印校勘，组合位置推定与格名保留待核。',
  '丁-乙': '“格为人遁”是本章用语；复合人遁格还涉及门、神等条件，本条不触发复合格检测。',
};

export const COMBINATIONS: Combination[] = STEMS.flatMap((heaven) =>
  STEMS.map((earth, column) => {
    const id = `${heaven}-${earth}`;
    const names = NAMES[heaven]!;
    const summaries = SUMMARIES[heaven]!;
    const classicalHeaven = heaven === '戊' ? '甲' : heaven;
    const classicalEarth = earth === '戊' ? '甲' : earth;
    const rowLocator =
      id === '辛-辛'
        ? '六辛加卒（疑字）'
        : `六${classicalHeaven}${heaven === '丁' && ['辛', '壬', '癸'].includes(earth) ? '交' : '加'}${classicalEarth}`;
    const note = [
      `采用《御定奇门宝鉴·混合百神》“${rowLocator}”条。verified 仅表示公开转录已核，未作原刻影印校勘。`,
      heaven === '戊' || earth === '戊'
        ? '本章甲行列按章末寄戊说明映射；不是所有旬首的甲都用戊代替。'
        : '',
      VARIANTS[id] ?? '',
    ]
      .filter(Boolean)
      .join(' ');
    const yuding: CombinationReading = {
      sourceId: 'yuding-hunhe',
      locator: `混合百神·${rowLocator}条`,
      name: names[column]!,
      summary: summaries[column]!,
      conditions: [
        '必须是同一宫的天盘干加地盘干，前后顺序不可颠倒。',
        '本表固定采用《混合百神》的格名；结合所问主题及门、星、宫关系阅读。',
        ...(id === '丁-乙' ? ['本条名称不等于复合人遁格已经成立。'] : []),
        ...(heaven === earth ? ['同干组合不单独证明全盘星伏吟或门伏吟。'] : []),
      ],
      status: id === '辛-辛' ? ('pending' as const) : ('verified' as const),
      note,
    };
    const primary = shenqiReading(heaven, earth, column);
    return {
      id,
      heaven,
      earth,
      primarySourceId: primary.sourceId,
      sourceIds: [primary.sourceId, yuding.sourceId],
      readings: [primary, yuding],
      name: primary.name,
      summary: primary.summary,
      conditions: primary.conditions,
      status: primary.status,
      note: primary.note,
    };
  }),
);

export function getCombination(heaven: string, earth: string): Combination | undefined {
  return COMBINATIONS.find((entry) => entry.heaven === heaven && entry.earth === earth);
}

export function getSource(id: string): Source | undefined {
  return SOURCES.find((source) => source.id === id);
}
