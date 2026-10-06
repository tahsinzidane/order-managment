import { useCallback, useMemo, useState } from 'react';
import { FlatList, SectionList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppInput, EmptyState, Screen, Segmented } from '@/components/ui';
import { OrderCard } from '@/components/OrderCard';
import { listOrdersWithTotals } from '@/db/orders';
import type { OrderListRow, OrderStatus } from '@/types';
import { dayKey, formatDate } from '@/utils/dates';
import { colors, spacing } from '@/theme';

export default function OrdersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [tab, setTab] = useState<OrderStatus>('active');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<OrderListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (status: OrderStatus, search: string) => {
      try {
        setItems(await listOrdersWithTotals(db, status, search));
      } catch (e) {
        console.warn('orders load failed', e);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      load(tab, q);
    }, [load, tab, q])
  );

  // Previous orders grouped by calendar date (createdAt), newest date first.
  // Rows arrive newest-first from the query; grouping preserves that order.
  const previousSections = useMemo(() => {
    if (tab !== 'previous') return [];
    const map = new Map<string, { title: string; data: OrderListRow[] }>();
    for (const o of items) {
      const key = dayKey(o.createdAt);
      const group = map.get(key);
      if (group) {
        group.data.push(o);
      } else {
        map.set(key, { title: formatDate(o.createdAt), data: [o] });
      }
    }
    return [...map.values()];
  }, [tab, items]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.title}>Orders</Text>
        <Segmented
          options={[
            { value: 'active', label: 'Active Orders' },
            { value: 'previous', label: 'Previous Orders' },
          ]}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setLoading(true);
            load(v, q);
          }}
        />
        <View style={{ marginTop: 10 }}>
          <AppInput
            value={q}
            onChangeText={(t) => {
              setQ(t);
              load(tab, t);
            }}
            placeholder="Search shops..."
          />
        </View>
      </View>
      {tab === 'previous' ? (
        <SectionList
          sections={previousSections}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() => load(tab, q)}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="No previous orders"
                message="Archived orders will appear here."
              />
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.dateHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              showDate
              onPress={() => router.push(`/order/${item.id}`)}
            />
          )}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={() => load(tab, q)}
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                title="No active orders"
                message="Create an order when you receive one."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => router.push(`/order/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
  list: { padding: spacing.md, paddingBottom: 32 },
  dateHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    paddingTop: 6,
    paddingBottom: 8,
  },
});
