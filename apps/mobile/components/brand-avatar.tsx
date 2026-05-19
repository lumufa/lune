import { Image, StyleSheet, View } from "react-native";

const brandIcon = require("../assets/images/haven-icon.png");

export function BrandAvatar({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image source={brandIcon} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: "#FFFFFF"
  }
});
