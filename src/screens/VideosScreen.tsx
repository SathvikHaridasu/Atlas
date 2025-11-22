import { StyleSheet, Text, View } from "react-native";

export default function VideosScreen() {
  return (
    <View style={styles.container}>
      <Text>Videos</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" }
});