import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@/types';
import { formatBDT, piecePriceFromDozen } from '@/utils/currency';
import { colors, radius } from '@/theme';
import { AppInput } from '@/components/ui';

export function ProductPicker({
  visible,
  products,
  onClose,
  onSelect,
}: {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSelect: (p: Product) => void;
}) {
  const [q, setQ] = useState('');
  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(q.trim().toLowerCase())
  );
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Product</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>
        <AppInput value={q} onChangeText={setQ} placeholder="Search products..." />
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelect(item)} style={styles.row}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.price}>
                {formatBDT(item.price)} / {item.unit}
                {item.unit === 'dozen'
                  ? ` · ${formatBDT(piecePriceFromDozen(item.price))} / piece`
                  : ''}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No products found.</Text>}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  close: { fontSize: 16, fontWeight: '600', color: colors.text },
  row: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 8,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  price: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.secondary, marginTop: 30 },
});
