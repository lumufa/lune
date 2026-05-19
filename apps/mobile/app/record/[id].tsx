import { Redirect, useLocalSearchParams } from "expo-router";

export default function EditRecordRedirect() {
  const params = useLocalSearchParams<{ id?: string }>();
  const recordId = typeof params.id === "string" ? params.id : undefined;

  return <Redirect href={recordId ? { pathname: "/log-entry", params: { recordId } } : "/log-entry"} />;
}
