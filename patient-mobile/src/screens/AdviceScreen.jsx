import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { advice } from "../services/api";

export default function AdviceScreen() {
  const [adviceList, setAdviceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdvice();
  }, []);

  const loadAdvice = async () => {
    try {
      const response = await advice.getMyAdvice();
      setAdviceList(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load advice");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Medical Advice</Text>

      {adviceList.length === 0 ? (
        <Text style={styles.emptyText}>
          No advice yet. Please consult your doctor.
        </Text>
      ) : (
        <FlatList
          data={adviceList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.adviceCard}>
              {item.tips && item.tips.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tips</Text>
                  {item.tips.map((tip, idx) => (
                    <Text key={idx} style={styles.tipText}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}

              {item.products_to_avoid && item.products_to_avoid.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Avoid</Text>
                  {item.products_to_avoid.map((product, idx) => (
                    <Text key={idx} style={styles.avoidText}>
                      • {product}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
          scrollEnabled
        />
      )}
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
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 32,
  },
  adviceCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 8,
  },
  tipText: {
    color: "#4b5563",
    marginBottom: 6,
  },
  avoidText: {
    color: "#dc2626",
    marginBottom: 6,
  },
});
