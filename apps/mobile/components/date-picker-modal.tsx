import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";
import { luneColors, luneRadius, luneSpacing } from "@/constants/tokens";

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 5;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDateKey(value: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

function formatKey(year: number, month: number, day: number): string {
  const mm = `${month}`.padStart(2, "0");
  const dd = `${day}`.padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

interface WheelColumnProps {
  data: number[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  formatter?: (value: number) => string;
}

function WheelColumn({ data, selectedIndex, onSelect, formatter }: WheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const paddingVertical = ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2);

  useEffect(() => {
    const safeIndex = Math.max(0, Math.min(selectedIndex, data.length - 1));
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: safeIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [data.length, selectedIndex]);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const nextIndex = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(nextIndex, data.length - 1));
    if (clamped !== selectedIndex) {
      onSelect(clamped);
    }
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={styles.columnWrap}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical }}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {data.map((item, index) => {
          const active = index === selectedIndex;
          return (
            <View key={`${item}-${index}`} style={styles.item}>
              <Text style={[styles.itemLabel, active ? styles.itemLabelActive : null]}>
                {formatter ? formatter(item) : `${item}`}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export interface DatePickerModalProps {
  visible: boolean;
  value: string;
  title?: string;
  minYear?: number;
  maxYear?: number;
  cancelLabel?: string;
  confirmLabel?: string;
  unitYear?: string;
  unitMonth?: string;
  unitDay?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

export function DatePickerModal({
  visible,
  value,
  title,
  minYear,
  maxYear,
  cancelLabel = "取消",
  confirmLabel = "确定",
  unitYear = "年",
  unitMonth = "月",
  unitDay = "日",
  onClose,
  onConfirm
}: DatePickerModalProps) {
  const currentYear = new Date().getFullYear();
  const rangeStart = minYear ?? currentYear - 5;
  const rangeEnd = maxYear ?? currentYear + 5;

  const parsed = useMemo(() => parseDateKey(value), [value]);
  const [year, setYear] = useState(parsed.year);
  const [month, setMonth] = useState(parsed.month);
  const [day, setDay] = useState(parsed.day);

  useEffect(() => {
    if (visible) {
      const fresh = parseDateKey(value);
      setYear(fresh.year);
      setMonth(fresh.month);
      setDay(fresh.day);
    }
  }, [visible, value]);

  const years = useMemo(
    () => Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i),
    [rangeStart, rangeEnd]
  );
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(() => {
    const total = daysInMonth(year, month);
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [year, month]);

  const clampedDay = Math.min(day, days.length);

  useEffect(() => {
    if (clampedDay !== day) setDay(clampedDay);
  }, [clampedDay, day]);

  const handleConfirm = () => {
    onConfirm(formatKey(year, month, clampedDay));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.cancel}>{cancelLabel}</Text>
            </Pressable>
            {title ? <Text style={styles.title}>{title}</Text> : <View />}
            <Pressable onPress={handleConfirm} hitSlop={10}>
              <Text style={styles.confirm}>{confirmLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.wheelsWrap}>
            <View pointerEvents="none" style={styles.selectionIndicator} />
            <WheelColumn
              data={years}
              selectedIndex={Math.max(0, years.indexOf(year))}
              onSelect={(index) => setYear(years[index])}
              formatter={(v) => `${v}${unitYear}`}
            />
            <WheelColumn
              data={months}
              selectedIndex={Math.max(0, months.indexOf(month))}
              onSelect={(index) => setMonth(months[index])}
              formatter={(v) => `${v}${unitMonth}`}
            />
            <WheelColumn
              data={days}
              selectedIndex={Math.max(0, days.indexOf(clampedDay))}
              onSelect={(index) => setDay(days[index])}
              formatter={(v) => `${v}${unitDay}`}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end"
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject
  },
  sheet: {
    backgroundColor: luneColors.surface,
    borderTopLeftRadius: luneRadius.lg,
    borderTopRightRadius: luneRadius.lg,
    paddingBottom: luneSpacing.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: luneSpacing.md,
    paddingVertical: luneSpacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: luneColors.divider
  },
  title: {
    color: luneColors.ink,
    fontSize: 15,
    fontWeight: "700"
  },
  cancel: {
    color: luneColors.muted,
    fontSize: 14,
    fontWeight: "600"
  },
  confirm: {
    color: luneColors.accent,
    fontSize: 14,
    fontWeight: "700"
  },
  wheelsWrap: {
    flexDirection: "row",
    paddingHorizontal: luneSpacing.md,
    paddingTop: luneSpacing.sm,
    position: "relative"
  },
  selectionIndicator: {
    position: "absolute",
    left: luneSpacing.sm,
    right: luneSpacing.sm,
    top: luneSpacing.sm + ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: luneColors.pinkBorder,
    backgroundColor: luneColors.pinkMist,
    borderRadius: 6
  },
  columnWrap: {
    flex: 1,
    height: ITEM_HEIGHT * VISIBLE_COUNT
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center"
  },
  itemLabel: {
    color: luneColors.muted,
    fontSize: 16,
    fontWeight: "500"
  },
  itemLabelActive: {
    color: luneColors.ink,
    fontSize: 18,
    fontWeight: "700"
  }
});
