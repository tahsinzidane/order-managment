import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@/types';
import { formatBDT, piecePriceFromDozen } from '@/utils/currency';
import { colors, radius } from '@/theme';
import { Card } from '@/components/ui';

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onPress,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPress?: () => void;
}) {
  const piece = product.unit === 'dozen' ? piecePriceFromDozen(product.price) : null;
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Pressable onPress={onPress} style={styles.content} disabled={!onPress}>
          {product.imageUri ? (
            <Image source={{ uri: product.imageUri }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={styles.thumbPlaceholderText}>◫</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>
              {formatBDT(product.price)} / {product.unit}
            </Text>
            {piece !== null ? (
              <Text style={styles.sub}>{formatBDT(piece)} / piece</Text>
            ) : null}
            {product.quantity !== null && product.quantity !== undefined ? (
              <Text style={styles.sub}>
                Stock: {product.quantity} {product.unit}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() =>
            Alert.alert(product.title, 'Choose an action', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Edit', onPress: onEdit },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ])
          }
          style={styles.dots}
        >
          <Text style={styles.dotsText}>⋮</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.muted },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: { fontSize: 24, color: colors.secondary },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  price: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 13, color: colors.secondary, marginTop: 2 },
  dots: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsText: { fontSize: 22, color: colors.secondary, marginTop: -4 },
});
