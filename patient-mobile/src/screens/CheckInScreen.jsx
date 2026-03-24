import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { checkins } from "../services/api";

export default function CheckInScreen() {
  const [skinScore, setSkinScore] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    if (!skinScore) {
      Alert.alert("Error", "Please rate your skin condition");
      return;
    }

    const score = parseInt(skinScore);
    if (score < 1 || score > 10) {
      Alert.alert("Error", "Score must be between 1 and 10");
      return;
    }

    setLoading(true);
    try {
      await checkins.create(score, notes);
      Alert.alert("Success", "Check-in saved");
      setSkinScore("");
      setNotes("");
    } catch (error) {
      Alert.alert("Error", "Failed to save check-in");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        // TODO: Upload image
        Alert.alert("Image selected", "Upload functionality coming soon");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Check-in</Text>

      <View style={styles.form}>
        <Text style={styles.label}>How is your skin today? (1-10)</Text>
        <TextInput
          style={styles.input}
          placeholder="7"
          value={skinScore}
          onChangeText={setSkinScore}
          keyboardType="number-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any observations..."
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.imageButton}
          onPress={pickImage}
          disabled={loading}
        >
          <Text style={styles.imageButtonText}>📷 Add Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCheckIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Check-in</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1f2937",
  },
  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imageButton: {
    borderWidth: 2,
    borderColor: "#2563eb",
    borderStyle: "dashed",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  imageButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
