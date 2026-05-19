export const LANGUAGE_KEY: string = 'app_language';
export const DEFAULT_LANGUAGE: string = 'en';

export function getLanguageToggleLabel(lang: string): string {
  return lang === 'zh' ? 'EN' : '中';
}

export function getNextLanguage(lang: string): string {
  return lang === 'zh' ? 'en' : 'zh';
}

export interface OnboardingCopy {
  heroA: string;
  heroB: string;
  heroSub: string;
  featureTitle: string;
  trustTitle: string;
  btnLearn: string;
  btnContinue: string;
  btnStart: string;
  skip: string;
  footerNote: string;
  initFailed: string;
  features: Array<string>;
  trust: Array<string>;
}

export interface PrivacyCopy {
  backTitle: string;
  heroTitle: string;
  togglesTitle: string;
  exportTitle: string;
  exportBody: string;
  exportButton: string;
  previewTitle: string;
  previewAt: string;
  previewUnit: string;
  sensitiveTitle: string;
  withdrawLabel: string;
  deleteLabel: string;
  actionsTitle: string;
  actionsEmpty: string;
  loadFailed: string;
  actionFailed: string;
  exportFailed: string;
  withdrawFailed: string;
  withdrawMissing: string;
  deleteFailed: string;
  deleted: string;
  statusGranted: string;
  statusWithdrawn: string;
  statusNone: string;
  statusPrefix: string;
  consentPrivacy: string;
  consentSensitive: string;
  consentNotifications: string;
  purposePrivacy: string;
  purposeSensitive: string;
  purposeNotifications: string;
  actionExport: string;
  actionDelete: string;
  actionLogout: string;
  actionWithdraw: string;
}

export interface HomeCopy {
  cycleDay: string;
  dayUnit: string;
  noRecordsLine: string;
  waitingTitle: string;
  waitingBody: string;
  logToday: string;
  cycleSummary: string;
  avgCycle: string;
  avgPeriod: string;
  logs: string;
  untilNext: string;
  periodLate: string;
  predictedDate: string;
  itemsUnit: string;
}

export interface CalendarCopy {
  period: string;
  predicted: string;
  symptoms: string;
  weekLabels: Array<string>;
}

export interface LogCopy {
  title: string;
  dateRange: string;
  start: string;
  end: string;
  flow: string;
  pain: string;
  symptoms: string;
  mood: string;
  note: string;
  notePlaceholder: string;
  save: string;
  saving: string;
}

export interface TrendsTabCopy {
  title: string;
  noData: string;
  startHint: string;
  dayUnit: string;
  avgCycle: string;
  avgPeriod: string;
  flowDist: string;
  recent: string;
  needMore: string;
  flowLight: string;
  flowMedium: string;
  flowHeavy: string;
}

export interface SettingsTabCopy {
  title: string;
  cycleLen: string;
  periodLen: string;
  daysUnit: string;
  remindersTitle: string;
  privacyTitle: string;
  exportBtn: string;
  deleteBtn: string;
}

export interface TabLabels {
  home: string;
  calendar: string;
  log: string;
  trends: string;
  settings: string;
}

export interface AppCopy {
  onboarding: OnboardingCopy;
  privacy: PrivacyCopy;
  home: HomeCopy;
  calendar: CalendarCopy;
  log: LogCopy;
  trends: TrendsTabCopy;
  settings: SettingsTabCopy;
  tabs: TabLabels;
}

const COPY_EN: AppCopy = {
  onboarding: {
    heroA: 'Your cycle data',
    heroB: 'stays in your hands',
    heroSub: 'Precise forecast · Smart reminders · No sign-up',
    featureTitle: 'Core features',
    trustTitle: 'Privacy promise',
    btnLearn: 'Learn more',
    btnContinue: 'Continue',
    btnStart: 'Start tracking',
    skip: 'Skip',
    footerNote: 'No sign-up · Data stays local',
    initFailed: 'Initialization failed, try again later',
    features: ['No account, open and use', 'Export your data anytime', 'Quiet reminders'],
    trust: ['End-to-end encrypted', 'Data stays on device', 'Never sell user data', 'Delete anytime']
  },
  privacy: {
    backTitle: 'Privacy & data',
    heroTitle: 'Control stays in your hands.',
    togglesTitle: 'Authorization switches',
    exportTitle: 'Data export',
    exportBody: 'Download your records, reminders, and consent log.',
    exportButton: 'Export / Access Log',
    previewTitle: 'Export preview',
    previewAt: 'Generated at:',
    previewUnit: 'records',
    sensitiveTitle: 'Sensitive actions',
    withdrawLabel: 'Withdraw sensitive',
    deleteLabel: 'Delete account',
    actionsTitle: 'Recent actions',
    actionsEmpty: 'No action records yet',
    loadFailed: 'Load failed, please retry',
    actionFailed: 'Action failed',
    exportFailed: 'Export failed',
    withdrawFailed: 'Withdraw failed',
    withdrawMissing: 'No active sensitive consent',
    deleteFailed: 'Delete failed',
    deleted: 'Account data cleared',
    statusGranted: 'Granted',
    statusWithdrawn: 'Withdrawn',
    statusNone: 'Not granted',
    statusPrefix: 'Current status',
    consentPrivacy: 'Privacy policy',
    consentSensitive: 'Sensitive health data',
    consentNotifications: 'Notifications',
    purposePrivacy: 'Accept privacy policy',
    purposeSensitive: 'Allow sensitive health data processing',
    purposeNotifications: 'Enable reminder notifications',
    actionExport: 'Export',
    actionDelete: 'Delete',
    actionLogout: 'Logout',
    actionWithdraw: 'Withdraw'
  },
  home: {
    cycleDay: 'Cycle day',
    dayUnit: 'days',
    noRecordsLine: 'No records yet.\nStart today.',
    waitingTitle: 'Waiting for your first record',
    waitingBody: 'Log a start date and the home screen will begin to estimate your cycle.',
    logToday: 'Log today',
    cycleSummary: 'Cycle summary',
    avgCycle: 'Average cycle',
    avgPeriod: 'Average period',
    logs: 'Logs',
    untilNext: 'Until next period',
    periodLate: 'Period is late',
    predictedDate: 'Predicted date',
    itemsUnit: 'items'
  },
  calendar: {
    period: 'Period',
    predicted: 'Predicted',
    symptoms: 'Symptoms',
    weekLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  },
  log: {
    title: 'Log',
    dateRange: 'Date range',
    start: 'Start',
    end: 'End',
    flow: 'Flow',
    pain: 'Pain level',
    symptoms: 'Symptoms',
    mood: 'Mood',
    note: 'Note',
    notePlaceholder: 'Optional note for today',
    save: 'Save log',
    saving: 'Saving...'
  },
  trends: {
    title: 'Trends',
    noData: 'No data yet',
    startHint: 'Start logging to see your trends here.',
    dayUnit: 'days',
    avgCycle: 'Avg cycle',
    avgPeriod: 'Avg period',
    flowDist: 'Flow distribution',
    recent: 'Recent records',
    needMore: 'more record(s) needed for trend analysis',
    flowLight: 'Light',
    flowMedium: 'Medium',
    flowHeavy: 'Heavy'
  },
  settings: {
    title: 'Settings',
    cycleLen: 'Average cycle length',
    periodLen: 'Average period length',
    daysUnit: 'days',
    remindersTitle: 'Reminders & quiet hours',
    privacyTitle: 'Privacy & data',
    exportBtn: 'Export data',
    deleteBtn: 'Delete account'
  },
  tabs: {
    home: 'Home',
    calendar: 'Calendar',
    log: 'Log',
    trends: 'Trends',
    settings: 'Settings'
  }
};

const COPY_ZH: AppCopy = {
  onboarding: {
    heroA: '你的经期数据',
    heroB: '只留在你手里',
    heroSub: '精准预测 · 智能提醒 · 无需注册',
    featureTitle: '核心功能',
    trustTitle: '隐私承诺',
    btnLearn: '了解更多',
    btnContinue: '继续',
    btnStart: '开始记录',
    skip: '跳过',
    footerNote: '无需注册 · 数据仅存本地',
    initFailed: '初始化失败，请稍后重试',
    features: ['零账号，打开就用', '数据随时带走', '安静提醒'],
    trust: ['端到端加密存储', '数据仅存设备本地', '绝不出售用户数据', '随时一键彻底删除']
  },
  privacy: {
    backTitle: '隐私与数据',
    heroTitle: '你的数据，由你控制。',
    togglesTitle: '授权开关',
    exportTitle: '数据导出',
    exportBody: '下载你的记录、提醒与授权日志。',
    exportButton: '导出 / 访问日志',
    previewTitle: '导出预览',
    previewAt: '生成时间：',
    previewUnit: '条记录',
    sensitiveTitle: '危险操作',
    withdrawLabel: '撤回敏感授权',
    deleteLabel: '删除账号',
    actionsTitle: '最近动作',
    actionsEmpty: '暂无动作记录',
    loadFailed: '加载失败，请稍后重试',
    actionFailed: '操作失败',
    exportFailed: '导出失败',
    withdrawFailed: '撤回失败',
    withdrawMissing: '当前没有可撤回的敏感授权',
    deleteFailed: '删除失败',
    deleted: '账号数据已清理',
    statusGranted: '已授权',
    statusWithdrawn: '已撤回',
    statusNone: '未授权',
    statusPrefix: '当前状态',
    consentPrivacy: '隐私政策',
    consentSensitive: '敏感健康数据',
    consentNotifications: '提醒通知',
    purposePrivacy: '确认隐私政策',
    purposeSensitive: '授权处理敏感健康数据',
    purposeNotifications: '授权提醒通知',
    actionExport: '导出',
    actionDelete: '删除',
    actionLogout: '退出',
    actionWithdraw: '撤回'
  },
  home: {
    cycleDay: '周期日',
    dayUnit: '天',
    noRecordsLine: '尚无记录。\n今天开始。',
    waitingTitle: '等待你的第一次记录',
    waitingBody: '填写开始日期后，主页会开始估算你的周期。',
    logToday: '记录今天',
    cycleSummary: '周期概要',
    avgCycle: '平均周期',
    avgPeriod: '平均经期',
    logs: '记录数',
    untilNext: '距下次经期',
    periodLate: '经期延迟',
    predictedDate: '预计日期',
    itemsUnit: '条'
  },
  calendar: {
    period: '经期',
    predicted: '预测',
    symptoms: '症状',
    weekLabels: ['日', '一', '二', '三', '四', '五', '六']
  },
  log: {
    title: '记录',
    dateRange: '日期范围',
    start: '开始',
    end: '结束',
    flow: '流量',
    pain: '疼痛级别',
    symptoms: '症状',
    mood: '心情',
    note: '备注',
    notePlaceholder: '今日备注（可选）',
    save: '保存记录',
    saving: '保存中…'
  },
  trends: {
    title: '趋势',
    noData: '暂无数据',
    startHint: '开始记录后，趋势会显示在这里。',
    dayUnit: '天',
    avgCycle: '平均周期',
    avgPeriod: '平均经期',
    flowDist: '流量分布',
    recent: '最近记录',
    needMore: '条记录后可分析趋势',
    flowLight: '轻',
    flowMedium: '中',
    flowHeavy: '重'
  },
  settings: {
    title: '设置',
    cycleLen: '平均周期长度',
    periodLen: '平均经期长度',
    daysUnit: '天',
    remindersTitle: '提醒和免打扰',
    privacyTitle: '隐私与数据',
    exportBtn: '导出数据',
    deleteBtn: '删除账号'
  },
  tabs: {
    home: '首页',
    calendar: '日历',
    log: '记录',
    trends: '趋势',
    settings: '设置'
  }
};

export function getCopy(lang: string): AppCopy {
  return lang === 'zh' ? COPY_ZH : COPY_EN;
}
