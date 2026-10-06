import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { OrderListRow } from '@/types';
import { formatBDT } from '@/utils/currency';
import { formatDate } from '@/utils/dates';
import { colors } from '@/theme';
import { Card } from '@/components/ui';

export function OrderCard({
  order,
  onPress,
  showDate,
}: {
  order: OrderListRow;
  onPress: () => void;
  showDate?: boolean;
}) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <Text style={styles.shop}>{order.shopName}</Text>
        <Text style={styles.loc}>{order.location}</Text>
        <View style={styles.footer}>
          <Text style={styles.meta}>
            {order.productCount} product{order.productCount === 1 ? '' : 's'}
            {showDate ? ` · ${formatDate(order.updatedAt)}` : ''}
          </Text>
          <Text style={styles.total}>{formatBDT(order.total)}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  shop: { fontSize: 16, fontWeight: '700', color: colors.text },
  loc: { fontSize: 13, color: colors.secondary, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  meta: { fontSize: 13, color: colors.secondary },
  total: { fontSize: 16, fontWeight: '700', color: colors.text },
});
