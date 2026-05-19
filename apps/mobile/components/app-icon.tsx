import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { luneColors } from "@/constants/tokens";

export type AppIconName =
  | "home"
  | "today"
  | "insights"
  | "messages"
  | "settings"
  | "partner"
  | "bookmark"
  | "bell"
  | "close"
  | "info"
  | "gift"
  | "hidden"
  | "lock"
  | "report"
  | "leaf"
  | "book"
  | "umbrella"
  | "meal"
  | "scale"
  | "droplet"
  | "sad"
  | "smile"
  | "wind"
  | "coffee"
  | "alert"
  | "calendar"
  | "shield"
  | "sparkles"
  | "plus"
  | "arrowRight"
  | "back"
  | "person"
  | "favorite"
  | "download"
  | "trash";

type IconEntry = SymbolViewProps["name"];

const ICONS: Record<AppIconName, IconEntry> = {
  home: { ios: "house", android: "home", web: "home" },
  today: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  insights: { ios: "square.grid.2x2", android: "apps", web: "apps" },
  messages: { ios: "message", android: "chat_bubble_outline", web: "chat_bubble_outline" },
  settings: { ios: "gearshape", android: "settings", web: "settings" },
  partner: { ios: "person.2", android: "group", web: "group" },
  bookmark: { ios: "bookmark", android: "bookmark_border", web: "bookmark_border" },
  bell: { ios: "bell", android: "notifications_none", web: "notifications_none" },
  close: { ios: "xmark", android: "close", web: "close" },
  info: { ios: "info.circle", android: "info", web: "info" },
  gift: { ios: "gift", android: "redeem", web: "redeem" },
  hidden: { ios: "eye.slash", android: "visibility_off", web: "visibility_off" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  report: { ios: "doc.text", android: "description", web: "description" },
  leaf: { ios: "leaf", android: "eco", web: "eco" },
  book: { ios: "book", android: "menu_book", web: "menu_book" },
  umbrella: { ios: "umbrella", android: "umbrella", web: "umbrella" },
  meal: { ios: "fork.knife", android: "restaurant", web: "restaurant" },
  scale: { ios: "scalemass", android: "monitor_weight", web: "monitor_weight" },
  droplet: { ios: "drop", android: "water_drop", web: "water_drop" },
  sad: { ios: "face.dashed", android: "sentiment_sad", web: "sentiment_sad" },
  smile: { ios: "face.smiling", android: "mood", web: "mood" },
  wind: { ios: "wind", android: "air", web: "air" },
  coffee: { ios: "cup.and.saucer", android: "coffee", web: "coffee" },
  alert: { ios: "exclamationmark.circle", android: "warning_amber", web: "warning_amber" },
  calendar: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  shield: { ios: "shield", android: "shield", web: "shield" },
  sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  plus: { ios: "plus", android: "add", web: "add" },
  arrowRight: { ios: "arrow.right", android: "arrow_right_alt", web: "arrow_right_alt" },
  back: { ios: "chevron.left", android: "arrow_back", web: "arrow_back" },
  person: { ios: "person.crop.circle", android: "person_outline", web: "person_outline" },
  favorite: { ios: "heart", android: "favorite_border", web: "favorite_border" },
  download: { ios: "arrow.down.circle", android: "download", web: "download" },
  trash: { ios: "trash", android: "delete", web: "delete" }
} as const;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 24, color = luneColors.ink }: AppIconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
