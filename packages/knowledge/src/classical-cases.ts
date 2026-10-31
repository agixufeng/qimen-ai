/** Source givens and original notes: CC BY 4.0. No transcription paragraphs are bundled. */
export interface ClassicalStudyExample {
  id: string;
  title: string;
  sourceId: string;
  locator: string;
  suppliedConditions: string[];
  summary: string;
  rights: string;
  evidence: 'hypothetical';
  input: null;
  outcome: null;
  replayStatus: 'unsupported';
}

const RIGHTS =
  '仅整理原典明确给出的条件事实与项目原创说明，不复制网页转录段落、注释或版式。CC BY 4.0仅涵盖本项目原创表达，外链页面及其现代整理成果不由本项目另行授权。';

export const CLASSICAL_CASES: ClassicalStudyExample[] = [
  {
    id: 'classical-tiandun-yang4',
    title: '《遁甲演义》天遁教学例：阳遁四局',
    sourceId: 'dunjia-yanyi-wikisource',
    locator: '《遁甲演义》卷二·天遁·阳遁四局假如例（乙庚之日、乙酉时）',
    suppliedConditions: [
      '原例给定阳遁四局。',
      '日干组为乙、庚，原例未给出完整日柱与年月日。',
      '时柱为乙酉。',
      '原例称天心为值符。',
      '原例称开门为值使，其加临叙述提到七宫；这里只保留给定语境，不补解盘层。',
      '原例将生门、上盘丙奇与下盘丁奇的天遁组合放在一宫。',
    ],
    summary:
      '这是以给定局数和时柱讲解复合天遁的教学假设，非真实占验记录。原例未载完整年月日与九宫盘；七宫和一宫是不同叙述位置，网页句读及盘层关系未作影印校勘。不补造公历时间或现实反馈，也不将此例作为当前拆补引擎的重放答案。',
    rights: RIGHTS,
    evidence: 'hypothetical',
    input: null,
    outcome: null,
    replayStatus: 'unsupported',
  },
  {
    id: 'classical-tiandun-yin6',
    title: '《遁甲演义》天遁教学例：阴遁六局',
    sourceId: 'dunjia-yanyi-wikisource',
    locator: '《遁甲演义》卷二·天遁·阴遁六局假如例（戊癸之日、庚申时）',
    suppliedConditions: [
      '原例给定阴遁六局。',
      '日干组为戊、癸，原例未给出完整日柱与年月日。',
      '时柱为庚申。',
      '原例称天蓬为值符。',
      '原例称休门为值使，其加临叙述提到四宫；这里只保留给定语境，不补解盘层。',
      '原例将生门、上盘丙奇与下盘丁奇的天遁组合放在九宫。',
    ],
    summary:
      '这是与阳四局并列讲解天遁条件的教学假设，非真实占验记录。原例未载完整年月日与九宫盘；四宫和九宫是不同叙述位置，网页句读及盘层关系未作影印校勘。不补造公历时间或现实反馈，也不把它强行套入当前拆补法生成整盘。',
    rights: RIGHTS,
    evidence: 'hypothetical',
    input: null,
    outcome: null,
    replayStatus: 'unsupported',
  },
];
