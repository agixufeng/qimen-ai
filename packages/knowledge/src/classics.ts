/** Catalogue facts and original study notes: CC BY 4.0. No book transcription is bundled. */
export interface ClassicEntry {
  id: string;
  title: string;
  locator: string;
  summary: string;
  /** Related implementation identifiers for navigation, not a claim of identical historical methods. */
  ruleIds: string[];
  sourceId: string;
}

export interface ClassicBook {
  id: string;
  title: string;
  sourceIds: string[];
  coverage: string;
  rights: string;
  items: ClassicEntry[];
}

export const CLASSICS_VERSION = 'classics-index-v1';

export const CLASSICS: ClassicBook[] = [
  {
    id: 'yuding-qimen-baojian',
    title: '御定奇门宝鉴',
    sourceIds: ['yuding', 'yuding-hunhe'],
    coverage:
      '本版仅为已核网页章段的索引与原创导读，非完整古籍文本库。已定位神机赋、混合百神两处；未核原刻影印、完整卷界与网页所据版本。相关规则编号仅作检索线索，不证明古籍全部取法与当前拆补规则相同。',
    rights:
      '保留书目、章段位置、来源外链与项目原创导读；不复制网页正文、标点整理或扫描。原创导读适用CC BY 4.0，第三方文本与整理成果的权利须另核，不随本项目代码MIT许可转授。',
    items: [
      {
        id: 'yuding-shenji-fu',
        title: '神机赋：格局术语与组合条件',
        locator: '《御定奇门宝鉴》神机赋，网页独立标题段',
        summary:
          '用作查找传统格局术语的入口。阅读时区分单一干干组合、门神齐备的复合条件与后世异说；本版不据篇名自动新增格局检测。',
        ruleIds: ['PUNISHMENT-01'],
        sourceId: 'yuding',
      },
      {
        id: 'yuding-hunhe-baishen',
        title: '混合百神：九干组合的古籍对照',
        locator: '《御定奇门宝鉴》混合百神，从六甲加甲至六癸加癸',
        summary:
          '现有81组合的御定对照来源。阅读时保留天地盘顺序及该章甲寄戊的编排语境，与默认《神奇之门》分开解释；辛辛转录疑字仍待校。',
        ruleIds: [],
        sourceId: 'yuding-hunhe',
      },
    ],
  },
  {
    id: 'dunjia-yanyi',
    title: '遁甲演义',
    sourceIds: ['dunjia-yanyi-wikisource'],
    coverage:
      '本版是章段索引，非完整古籍文本库。来源前言称四卷，本次页面正文可定位卷一、卷二、卷三，卷四未核。书中并列多种时空尺度及历史取法，不将全书内容视为当前时家转盘拆补法的统一依据。相关规则编号仅作检索线索。',
    rights:
      '书目位置和项目原创导读独立保存，不镜像维基文库的转录全文、注释或版式。古籍原作、现代整理与站点许可分开核验；原创导读适用CC BY 4.0，外链内容不由本项目另行授权。',
    items: [
      {
        id: 'yanyi-shijia',
        title: '卷一·时家奇门：旬首、符使与寄宫',
        locator: '卷一·时家奇门，阳遁一局与阴遁九局的说明段',
        summary:
          '可对读六旬遁干、值符值使及中五寄坤的历史表述。网页使用示例说明排布，本项目只提供阅读入口；具体边界与寄宫处理仍以当前版本规则为准。',
        ruleIds: ['EARTH-01', 'CHIEF-01', 'DOOR-01'],
        sourceId: 'dunjia-yanyi-wikisource',
      },
      {
        id: 'yanyi-tiandun',
        title: '卷二·天遁：复合条件与教学例',
        locator: '卷二·天遁，含阳遁四局、阴遁六局的假如例',
        summary:
          '本段将门与奇仪合看，并给出假如教学例；这些不是有事后反馈的真实占验。两例不能补造公历日期强行导入当前引擎，也不因单个81格名便认定复合天遁成立。',
        ruleIds: [],
        sourceId: 'dunjia-yanyi-wikisource',
      },
    ],
  },
  {
    id: 'qimen-dunjia-tongzong',
    title: '奇门遁甲统宗',
    sourceIds: ['qimen-tongzong-wikisource', 'qimen-tongzong-scan'],
    coverage:
      '本版仅为索引与原创导读，非完整古籍文本库。维基文库页面列卷四至九略，不能当成全十二卷正文；另列影印检索入口，尚未核对页文对应。所选卷一正文含超接、置闰与接闰取法，不作为当前单一拆补法的通用依据。相关规则编号仅作检索线索。',
    rights:
      '只保存定位、外链与项目原创导读，不收录转录全文、现代注释或影印扫描。影印文件页的权利标识仅作核验入口，不据此替第三方授予许可；原创导读适用CC BY 4.0。',
    items: [
      {
        id: 'tongzong-qili',
        title: '卷之一·遁甲起例：九宫与符使',
        locator: '奇门遁甲统宗卷之一·遁甲起例',
        summary:
          '该段把九宫、阴阳顺逆和符使排布串联说明，后文又讨论接闰。可对照基本术语，但不把历史节局取法与当前拆补定局混为同一算法。',
        ruleIds: ['EARTH-01', 'CHIEF-01', 'DOOR-01'],
        sourceId: 'qimen-tongzong-wikisource',
      },
      {
        id: 'tongzong-chaojie',
        title: '卷之一·论超接之法：节气与符头先后',
        locator: '奇门遁甲统宗卷之一·论超接之法，及其后又法段',
        summary:
          '阅读节气与符头先后的历史定义，以及来源如何安排超接。这里提供异法阅读入口；相关JU-01指向现行定局约定，不表示本项目已经实现超接置闰。',
        ruleIds: ['JU-01'],
        sourceId: 'qimen-tongzong-wikisource',
      },
    ],
  },
];

export function getClassic(id: string): ClassicBook | undefined {
  return CLASSICS.find((book) => book.id === id);
}
