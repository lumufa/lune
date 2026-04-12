import type { CycleRecordInput, FlowLevel, MoodTag, PainLevel, SymptomTag } from "@women-period/shared";
import { api, isApiNetworkError } from "../../services/api";
import {
  combineDateAndTime,
  currentTimeHHmm,
  splitRecordDateTime,
  todayIso
} from "../../utils/date";
import {
  buildPainGuide,
  getDisplayLanguageToggleLabel,
  getFlowLabel,
  getMoodLabel,
  getNextDisplayLanguage,
  getPainLevelDescription,
  getPainLevelLabel,
  getStoredDisplayLanguage,
  getSymptomLabel,
  setStoredDisplayLanguage,
  type DisplayLanguage
} from "../../utils/i18n";

const flowValues: FlowLevel[] = ["light", "medium", "heavy"];
const moodValues: MoodTag[] = ["steady", "low", "irritable", "tired", "energetic"];
const symptomValues: SymptomTag[] = ["cramps", "bloating", "headache", "fatigue", "back_pain", "acne"];
const DEFAULT_LANGUAGE = getStoredDisplayLanguage();

interface PageCopy {
  languageButtonLabel: string;
  heroEyebrowCreate: string;
  heroEyebrowEdit: string;
  heroTitleCreate: string;
  heroTitleEdit: string;
  heroSubtitleCreate: string;
  heroSubtitleEdit: string;
  startAtLabel: string;
  startLabel: string;
  endLabel: string;
  selectedUnit: string;
  flowLabel: string;
  painLabel: string;
  painGuideButtonLabel: string;
  painGuideModalTitle: string;
  painGuideCloseLabel: string;
  symptomsLabel: string;
  moodLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  saveCreateLabel: string;
  saveEditLabel: string;
  saveCreateSuccess: string;
  saveEditSuccess: string;
  saveFailed: string;
  deleteLabel: string;
  deleteConfirmTitle: string;
  deleteConfirmContent: string;
  deleteSuccess: string;
  deleteFailed: string;
  loadRecordFailed: string;
  networkUnavailable: string;
}

function buildCopy(language: DisplayLanguage): PageCopy {
  return {
    languageButtonLabel: getDisplayLanguageToggleLabel(language),
    heroEyebrowCreate: language === "en" ? "Cycle Log" : "本次记录",
    heroEyebrowEdit: language === "en" ? "Edit Record" : "编辑记录",
    heroTitleCreate: language === "en" ? "Log once, keep it calm." : "记录一次，保持轻量。",
    heroTitleEdit: language === "en" ? "Review and refine your entry." : "查看并编辑这条记录。",
    heroSubtitleCreate:
      language === "en"
        ? "Date and time are both minute-level so your trend stays accurate."
        : "日期与时间都精确到分钟，趋势计算会更稳定。",
    heroSubtitleEdit:
      language === "en"
        ? "You can adjust any field and save back to calendar."
        : "你可以调整任意字段，保存后会同步到日历。",
    startAtLabel: language === "en" ? "Date range" : "日期",
    startLabel: language === "en" ? "Start" : "开始",
    endLabel: language === "en" ? "End" : "结束",
    selectedUnit: language === "en" ? "selected" : "项",
    flowLabel: language === "en" ? "Flow" : "流量",
    painLabel: language === "en" ? "Pain level" : "疼痛程度",
    painGuideButtonLabel: language === "en" ? "Pain guide" : "分级说明",
    painGuideModalTitle: language === "en" ? "Pain guide" : "疼痛分级说明",
    painGuideCloseLabel: language === "en" ? "Close" : "知道了",
    symptomsLabel: language === "en" ? "Symptoms" : "感受标签",
    moodLabel: language === "en" ? "Mood" : "情绪状态",
    noteLabel: language === "en" ? "Notes" : "备注",
    notePlaceholder: language === "en" ? "Only write down what you want to keep" : "只记录你真正想留下的内容",
    saveCreateLabel: language === "en" ? "Save entry" : "保存记录",
    saveEditLabel: language === "en" ? "Save changes" : "保存修改",
    saveCreateSuccess: language === "en" ? "Saved successfully" : "记录成功",
    saveEditSuccess: language === "en" ? "Updated successfully" : "修改成功",
    saveFailed: language === "en" ? "Save failed. Please try again." : "保存失败，请稍后重试",
    deleteLabel: language === "en" ? "Delete this record" : "删除这条记录",
    deleteConfirmTitle: language === "en" ? "Delete record" : "删除记录",
    deleteConfirmContent:
      language === "en"
        ? "This record will be removed from your calendar. Continue?"
        : "删除后将从日历中移除，确定继续吗？",
    deleteSuccess: language === "en" ? "Record deleted" : "记录已删除",
    deleteFailed: language === "en" ? "Delete failed. Please try again." : "删除失败，请稍后重试",
    loadRecordFailed: language === "en" ? "Failed to load this record" : "记录加载失败",
    networkUnavailable:
      language === "en"
        ? "API offline. Run npm.cmd run start:api."
        : "接口未连接，请先执行 npm.cmd run start:api"
  };
}

const painValues: PainLevel[] = [0, 1, 2, 3];

function buildLocalizedOptions(language: DisplayLanguage) {
  return {
    flowItems: flowValues.map((value) => ({ value, label: getFlowLabel(value, language) })),
    moodItems: moodValues.map((value) => ({ value, label: getMoodLabel(value, language) })),
    symptomItems: symptomValues.map((value) => ({ value, label: getSymptomLabel(value, language) })),
    painItems: painValues.map((value) => ({ value, label: String(value) })),
    copy: buildCopy(language)
  };
}

Page({
  data: {
    language: DEFAULT_LANGUAGE as DisplayLanguage,
    ...buildLocalizedOptions(DEFAULT_LANGUAGE),
    startDatePart: "",
    startTimePart: "",
    endDatePart: "",
    endTimePart: "",
    flowLevel: "medium" as FlowLevel,
    painLevel: 1 as PainLevel,
    painSummary: getPainLevelLabel(1, DEFAULT_LANGUAGE),
    painDescription: getPainLevelDescription(1, DEFAULT_LANGUAGE),
    selectedSymptoms: ["cramps"] as SymptomTag[],
    mood: "steady" as MoodTag,
    note: "",
    isEditMode: false,
    editingRecordId: "",
    loadedRecordId: "",
    selectedSymptomCount: 1,
    isSubmitting: false
  },

  onLoad(options: Record<string, string | undefined>) {
    const today = todayIso();
    const now = currentTimeHHmm();
    const recordId = options.id ? decodeURIComponent(options.id) : undefined;

    this.setData({
      startDatePart: today,
      startTimePart: now,
      endDatePart: today,
      endTimePart: now,
      isEditMode: Boolean(recordId),
      editingRecordId: recordId ?? ""
    });
  },

  onShow() {
    const language = getStoredDisplayLanguage();

    if (language !== this.data.language) {
      this.applyLanguage(language);
    }

    // Handle edit context from tab switch (globalData)
    const app = getApp<IAppOption>();
    if (app.editRecordId) {
      const recordId = app.editRecordId;
      app.editRecordId = undefined;
      this.setData({ isEditMode: true, editingRecordId: recordId });
      void this.loadRecordForEdit(recordId);
      return;
    }

    // Returning to tab without edit context → reset to create mode
    this.resetToCreateMode();
  },

  resetToCreateMode() {
    const today = todayIso();
    const now = currentTimeHHmm();
    const language = this.data.language as DisplayLanguage;
    this.setData({
      isEditMode: false,
      editingRecordId: "",
      loadedRecordId: "",
      startDatePart: today,
      startTimePart: now,
      endDatePart: today,
      endTimePart: now,
      flowLevel: "medium" as FlowLevel,
      painLevel: 1 as PainLevel,
      painSummary: getPainLevelLabel(1, language),
      painDescription: getPainLevelDescription(1, language),
      selectedSymptoms: ["cramps"] as SymptomTag[],
      selectedSymptomCount: 1,
      mood: "steady" as MoodTag,
      note: ""
    });
  },

  applyLanguage(language: DisplayLanguage) {
    const localizedOptions = buildLocalizedOptions(language);
    this.setData({
      language,
      ...localizedOptions,
      painSummary: getPainLevelLabel(this.data.painLevel, language),
      painDescription: getPainLevelDescription(this.data.painLevel, language)
    });
  },

  toggleLanguage() {
    const nextLanguage = getNextDisplayLanguage(this.data.language as DisplayLanguage);
    setStoredDisplayLanguage(nextLanguage);
    this.applyLanguage(nextLanguage);
  },

  async loadRecordForEdit(recordId: string) {
    try {
      const dashboard = await api.getDashboard();
      const target = dashboard.records.find((item) => item.id === recordId);

      if (!target) {
        wx.showToast({
          title: this.data.copy.loadRecordFailed,
          icon: "none"
        });
        return;
      }

      const start = splitRecordDateTime(target.startDate);
      const end = splitRecordDateTime(target.endDate);
      const language = this.data.language as DisplayLanguage;

      const symptoms = target.symptoms ?? [];
      this.setData({
        loadedRecordId: recordId,
        startDatePart: start.date,
        startTimePart: start.time,
        endDatePart: end.date,
        endTimePart: end.time,
        flowLevel: target.flowLevel,
        painLevel: target.painLevel,
        painSummary: getPainLevelLabel(target.painLevel, language),
        painDescription: getPainLevelDescription(target.painLevel, language),
        selectedSymptoms: symptoms,
        selectedSymptomCount: symptoms.filter((s: string) => s !== "none").length,
        mood: target.mood,
        note: target.note ?? ""
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.loadRecordFailed,
        icon: "none"
      });
    }
  },

  changeStartDatePart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ startDatePart: event.detail.value });
  },

  changeStartTimePart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ startTimePart: event.detail.value });
  },

  changeEndDatePart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ endDatePart: event.detail.value });
  },

  changeEndTimePart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ endTimePart: event.detail.value });
  },

  selectFlow(event: WechatMiniprogram.BaseEvent) {
    const flowLevel = event.currentTarget.dataset.value as FlowLevel;
    this.setData({ flowLevel });
  },

  selectPain(event: WechatMiniprogram.BaseEvent) {
    const painLevel = Number(event.currentTarget.dataset.value) as PainLevel;
    this.setData({
      painLevel,
      painSummary: getPainLevelLabel(painLevel, this.data.language as DisplayLanguage),
      painDescription: getPainLevelDescription(painLevel, this.data.language as DisplayLanguage)
    });
  },

  changePain(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
    const painLevel = Number(event.detail.value) as PainLevel;
    this.setData({
      painLevel,
      painSummary: getPainLevelLabel(painLevel, this.data.language as DisplayLanguage),
      painDescription: getPainLevelDescription(painLevel, this.data.language as DisplayLanguage)
    });
  },

  openPainGuide() {
    const guideLines = buildPainGuide(this.data.language as DisplayLanguage)
      .map((item) => `${item.levelLabel}\n${item.description}`)
      .join("\n\n");

    wx.showModal({
      title: this.data.copy.painGuideModalTitle,
      content: guideLines,
      showCancel: false,
      confirmText: this.data.copy.painGuideCloseLabel
    });
  },

  selectMood(event: WechatMiniprogram.BaseEvent) {
    const mood = event.currentTarget.dataset.value as MoodTag;
    this.setData({ mood });
  },

  toggleSymptom(event: WechatMiniprogram.BaseEvent) {
    const symptom = event.currentTarget.dataset.value as SymptomTag;
    const selectedSymptoms = [...this.data.selectedSymptoms] as SymptomTag[];
    const currentIndex = selectedSymptoms.indexOf(symptom);

    if (currentIndex > -1) {
      selectedSymptoms.splice(currentIndex, 1);
    } else {
      selectedSymptoms.push(symptom);
    }

    const filtered = selectedSymptoms.filter((s) => s !== "none");
    this.setData({ selectedSymptoms, selectedSymptomCount: filtered.length });
  },

  changeNote(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ note: event.detail.value });
  },

  async submitRecord() {
    const payload: CycleRecordInput = {
      startDate: combineDateAndTime(this.data.startDatePart, this.data.startTimePart),
      endDate: combineDateAndTime(this.data.endDatePart, this.data.endTimePart),
      flowLevel: this.data.flowLevel,
      painLevel: this.data.painLevel,
      symptoms: this.data.selectedSymptoms,
      mood: this.data.mood,
      note: this.data.note.trim()
    };

    this.setData({ isSubmitting: true });

    try {
      if (this.data.isEditMode && this.data.editingRecordId) {
        await api.updateRecord(this.data.editingRecordId, payload);
        wx.showToast({
          title: this.data.copy.saveEditSuccess,
          icon: "success"
        });
      } else {
        await api.createRecord(payload);
        void api
          .trackEvent("first_record", {
            symptomCount: this.data.selectedSymptoms.length
          })
          .catch(() => undefined);
        wx.showToast({
          title: this.data.copy.saveCreateSuccess,
          icon: "success"
        });
      }

      wx.switchTab({
        url: "/pages/home/index"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.saveFailed,
        icon: "none"
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  async deleteCurrentRecord() {
    if (!this.data.isEditMode || !this.data.editingRecordId || this.data.isSubmitting) {
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: this.data.copy.deleteConfirmTitle,
        content: this.data.copy.deleteConfirmContent,
        confirmColor: "#FF5B8D",
        success: (result) => resolve(Boolean(result.confirm)),
        fail: () => resolve(false)
      });
    });

    if (!confirmed) {
      return;
    }

    this.setData({ isSubmitting: true });

    try {
      await api.deleteRecord(this.data.editingRecordId);
      wx.showToast({
        title: this.data.copy.deleteSuccess,
        icon: "success"
      });
      wx.switchTab({
        url: "/pages/home/index"
      });
    } catch (error) {
      wx.showToast({
        title: isApiNetworkError(error) ? this.data.copy.networkUnavailable : this.data.copy.deleteFailed,
        icon: "none"
      });
    } finally {
      this.setData({ isSubmitting: false });
    }
  }
});
