import { StyleSheet, Text, View } from "react-native";

export default function RunTrackingScreen() {
  return (
    <View style={styles.container}>
      <Text>Run Tracking</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" }
});