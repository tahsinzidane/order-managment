import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Screen } from '@/components/ui';
import { getProduct } from '@/db/products';
import type { Product } from '@/types';
import { formatBDT, piecePriceFromDozen } from '@/utils/currency';
import { unitLabel } from '@/utils/units';
import { colors, radius, spacing } from '@/theme';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [product, setProduct] = useState<Product | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) getProduct(db, String(id)).then(setProduct).catch(console.warn);
    }, [db, id])
  );

  if (!product) {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={styles.muted}>Loading product...</Text>
        </View>
      </Screen>
    );
  }

  const piece = product.unit === 'dozen' ? piecePriceFromDozen(product.price) : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        {product.imageUri ? (
          <Image source={{ uri: product.imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>◫</Text>
          </View>
        )}
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>
          {formatBDT(product.price)} / {product.unit}
        </Text>
        {piece !== null ? (
          <Text style={styles.muted}>{formatBDT(piece)} / piece</Text>
        ) : null}

        <Card style={styles.meta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Unit</Text>
            <Text style={styles.metaValue}>{unitLabel(product.unit)}</Text>
          </View>
          {product.quantity !== null && product.quantity !== undefined ? (
            <View style={[styles.metaRow, styles.metaRowLast]}>
              <Text style={styles.metaLabel}>Stock</Text>
              <Text style={styles.metaValue}>
                {product.quantity} {product.unit}
              </Text>
            </View>
          ) : null}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: 40 },
  image: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.muted },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { fontSize: 56, color: colors.secondary },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 14 },
  price: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 6 },
  muted: { fontSize: 14, color: colors.secondary, marginTop: 2 },
  meta: { marginTop: 16 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metaRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  metaLabel: { fontSize: 14, color: colors.secondary },
  metaValue: { fontSize: 15, fontWeight: '600', color: colors.text },
});
