import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen, AppButton, Card, EmptyState, SectionTitle } from '@/components/ui';
import { OrderCard } from '@/components/OrderCard';
import { getActiveValue, getProductSummary, listOrdersWithTotals } from '@/db/orders';
import type { OrderListRow, ProductSummaryRow } from '@/types';
import { formatBDT } from '@/utils/currency';
import { formatQty } from '@/utils/units';
import { greeting } from '@/utils/dates';
import { colors, spacing } from '@/theme';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [value, setValue] = useState(0);
  const [summary, setSummary] = useState<ProductSummaryRow[]>([]);
  const [orders, setOrders] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [v, s, o] = await Promise.all([
        getActiveValue(db),
        getProductSummary(db),
        listOrdersWithTotals(db, 'active'),
      ]);
      setValue(v);
      setSummary(s);
      setOrders(o);
    } catch (e) {
      console.warn('home load failed', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const summaryTotal = summary.reduce((a, r) => a + r.totalValue, 0);

  return (
    <Screen>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        onRefresh={load}
        refreshing={loading}
        ListHeaderComponent={
          <View>
            <Text style={styles.greet}>{greeting()}</Text>
            <Card style={styles.hero}>
              <Text style={styles.heroLabel}>Active Order Value</Text>
              <Text style={styles.heroValue}>{formatBDT(value)}</Text>
            </Card>

            <SectionTitle>Order Summary</SectionTitle>
            <Card style={{ marginBottom: spacing.md }}>
              {summary.length === 0 ? (
                <Text style={styles.muted}>No active products.</Text>
              ) : (
                <>
                  {summary.map((r) => (
                    <View key={`${r.productTitle}-${r.unit}-${r.unitPrice}`} style={styles.sumRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sumTitle}>{r.productTitle}</Text>
                        <Text style={styles.muted}>{formatQty(r.totalQty, r.unit)}</Text>
                      </View>
                      <Text style={styles.sumValue}>{formatBDT(r.totalValue)}</Text>
                    </View>
                  ))}
                  <View style={styles.sumTotalRow}>
                    <Text style={styles.sumTotalLabel}>Total</Text>
                    <Text style={styles.sumTotalValue}>{formatBDT(summaryTotal)}</Text>
                  </View>
                </>
              )}
            </Card>

            <View style={styles.rowHeader}>
              <SectionTitle>Active Orders</SectionTitle>
              <Link href="/order/new" asChild>
                <Pressable style={styles.placeBtn}>
                  <Text style={styles.placeBtnText}>+ Place Order</Text>
                </Pressable>
              </Link>
            </View>
            {orders.length === 0 && !loading ? (
              <EmptyState
                title="No active orders"
                message="Create an order when you receive one."
                actionTitle="+ Place Order"
                onAction={() => router.push('/order/new')}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => router.push(`/order/${item.id}`)} />
        )}
        ListFooterComponent={
          <View style={{ marginTop: 8 }}>
            <AppButton title="+ Place Order" onPress={() => router.push('/order/new')} />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: 32 },
  greet: { fontSize: 15, color: colors.secondary, marginBottom: 10 },
  hero: { marginBottom: spacing.md },
  heroLabel: { fontSize: 13, color: colors.secondary, marginBottom: 4 },
  heroValue: { fontSize: 34, fontWeight: '800', color: colors.text },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  placeBtn: {
    backgroundColor: colors.button,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  placeBtnText: { color: colors.buttonText, fontWeight: '700', fontSize: 13 },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sumTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sumValue: { fontSize: 15, fontWeight: '700', color: colors.text },
  sumTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  sumTotalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  sumTotalValue: { fontSize: 16, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.secondary },
});
