import type { CycleRecordInput, FlowLevel, MoodTag, PainLevel, SymptomTag } from "@women-period/shared";
import { api, isApiNetworkError } from "../../services/api";
import {
  combineDateAndTime,
  currentTimeHHmm,
  splitRecordDateTime,
  todayIso
} from "../../utils/date";
import {
  getFlowLabel,
  getMoodLabel,
  getPainLevelDescription,
  getPainLevelLabel,
  getStoredDisplayLanguage,
  getSymptomLabel,
  type DisplayLanguage
} from "../../utils/i18n";

const flowValues: FlowLevel[] = ["light", "medium", "heavy"];
const moodValues: MoodTag[] = ["steady", "low", "irritable", "tired", "energetic"];
const symptomValues: SymptomTag[] = ["cramps", "bloating", "headache", "fatigue", "back_pain", "acne"];
const painValues: PainLevel[] = [0, 1, 2, 3];

interface PainItem {
  value: PainLevel;
  label: string;
  hint: string;
}

interface PageCopy {
  titleCreate: string;
  titleEdit: string;
  dateLabel: string;
  bodyLabel: string;
  flowLabel: string;
  painLabel: string;
  feelingLabel: string;
  symptomsLabel: string;
  moodLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  saveLabel: string;
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
    titleCreate: language === "en" ? "New Record" : "新记录",
    titleEdit: language === "en" ? "Edit Record" : "编辑记录",
    dateLabel: language === "en" ? "Date" : "日期",
    bodyLabel: language === "en" ? "Body" : "身体状况",
    flowLabel: language === "en" ? "Flow" : "流量",
    painLabel: language === "en" ? "Pain" : "疼痛",
    feelingLabel: language === "en" ? "Feeling" : "主观感受",
    symptomsLabel: language === "en" ? "Symptoms" : "感受",
    moodLabel: language === "en" ? "Mood" : "情绪",
    noteLabel: language === "en" ? "Notes" : "备注",
    notePlaceholder: language === "en" ? "Only write down what you want to keep" : "只记录你真正想留下的内容",
    saveLabel: language === "en" ? "Save" : "保存",
    saveCreateSuccess: language === "en" ? "Saved" : "记录成功",
    saveEditSuccess: language === "en" ? "Updated" : "修改成功",
    saveFailed: language === "en" ? "Save failed" : "保存失败",
    deleteLabel: language === "en" ? "Delete this record" : "删除这条记录",
    deleteConfirmTitle: language === "en" ? "Delete record" : "删除记录",
    deleteConfirmContent:
      language === "en"
        ? "This record will be permanently removed."
        : "删除后将永久移除，确定继续吗？",
    deleteSuccess: language === "en" ? "Deleted" : "已删除",
    deleteFailed: language === "en" ? "Delete failed" : "删除失败",
    loadRecordFailed: language === "en" ? "Failed to load" : "加载失败",
    networkUnavailable: language === "en" ? "API offline" : "接口未连接"
  };
}

function buildPainHints(language: DisplayLanguage): string[] {
  if (language === "en") return ["None", "Mild", "Moderate", "Severe"];
  return ["无感", "轻微", "明显", "严重"];
}

function buildLocalizedOptions(language: DisplayLanguage) {
  const painHints = buildPainHints(language);
  return {
    flowItems: flowValues.map((value) => ({ value, label: getFlowLabel(value, language) })),
    moodItems: moodValues.map((value) => ({ value, label: getMoodLabel(value, language) })),
    symptomItems: symptomValues.map((value) => ({ value, label: getSymptomLabel(value, language) })),
    painItems: painValues.map((value) => ({
      value,
      label: String(value),
      hint: painHints[value]
    })) as PainItem[],
    copy: buildCopy(language)
  };
}

function withSymptomSelection(
  items: {value: SymptomTag; label: string}[],
  selected: SymptomTag[]
) {
  return items.map(item => ({
    ...item,
    selected: selected.indexOf(item.value) !== -1
  }));
}

const DEFAULT_LANGUAGE = getStoredDisplayLanguage();

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
    painDescription: getPainLevelDescription(1, DEFAULT_LANGUAGE),
    selectedSymptoms: ["cramps"] as SymptomTag[],
    mood: "steady" as MoodTag,
    note: "",
    isEditMode: false,
    editingRecordId: "",
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
      editingRecordId: recordId ?? "",
      symptomItems: withSymptomSelection(this.data.symptomItems, this.data.selectedSymptoms)
    });

    if (recordId) {
      void this.loadRecordForEdit(recordId);
    }
  },

  async loadRecordForEdit(recordId: string) {
    try {
      const dashboard = await api.getDashboard();
      const target = dashboard.records.find((item) => item.id === recordId);

      if (!target) {
        wx.showToast({ title: this.data.copy.loadRecordFailed, icon: "none" });
        return;
      }

      const start = splitRecordDateTime(target.startDate);
      const end = splitRecordDateTime(target.endDate);
      const language = this.data.language as DisplayLanguage;
      const symptoms = target.symptoms ?? [];

      this.setData({
        startDatePart: start.date,
        startTimePart: start.time,
        endDatePart: end.date,
        endTimePart: end.time,
        flowLevel: target.flowLevel,
        painLevel: target.painLevel,
        painDescription: getPainLevelDescription(target.painLevel, language),
        selectedSymptoms: symptoms,
        symptomItems: withSymptomSelection(this.data.symptomItems, symptoms),
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

  changeEndDatePart(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ endDatePart: event.detail.value });
  },

  selectFlow(event: WechatMiniprogram.BaseEvent) {
    this.setData({ flowLevel: event.currentTarget.dataset.value as FlowLevel });
  },

  selectPain(event: WechatMiniprogram.BaseEvent) {
    const painLevel = Number(event.currentTarget.dataset.value) as PainLevel;
    this.setData({
      painLevel,
      painDescription: getPainLevelDescription(painLevel, this.data.language as DisplayLanguage)
    });
  },

  selectMood(event: WechatMiniprogram.BaseEvent) {
    this.setData({ mood: event.currentTarget.dataset.value as MoodTag });
  },

  toggleSymptom(event: WechatMiniprogram.BaseEvent) {
    const symptom = event.currentTarget.dataset.value as SymptomTag;
    const selectedSymptoms = [...this.data.selectedSymptoms] as SymptomTag[];
    const idx = selectedSymptoms.indexOf(symptom);
    if (idx > -1) { selectedSymptoms.splice(idx, 1); } else { selectedSymptoms.push(symptom); }
    this.setData({
      selectedSymptoms,
      symptomItems: withSymptomSelection(this.data.symptomItems, selectedSymptoms)
    });
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
        wx.showToast({ title: this.data.copy.saveEditSuccess, icon: "success" });
      } else {
        await api.createRecord(payload);
        void api.trackEvent("first_record", { symptomCount: this.data.selectedSymptoms.length }).catch(() => undefined);
        wx.showToast({ title: this.data.copy.saveCreateSuccess, icon: "success" });
      }
      wx.navigateBack();
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
    if (!this.data.isEditMode || !this.data.editingRecordId || this.data.isSubmitting) return;

    const confirmed = await new Promise<boolean>((resolve) => {
      wx.showModal({
        title: this.data.copy.deleteConfirmTitle,
        content: this.data.copy.deleteConfirmContent,
        confirmColor: "#E53E3E",
        success: (result) => resolve(Boolean(result.confirm)),
        fail: () => resolve(false)
      });
    });

    if (!confirmed) return;
    this.setData({ isSubmitting: true });

    try {
      await api.deleteRecord(this.data.editingRecordId);
      wx.showToast({ title: this.data.copy.deleteSuccess, icon: "success" });
      wx.navigateBack();
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
