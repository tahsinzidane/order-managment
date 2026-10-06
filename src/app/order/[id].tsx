import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppButton, Card, Screen } from '@/components/ui';
import { OrderEditor } from '@/components/OrderEditor';
import {
  archiveOrder,
  deleteOrder,
  getOrderWithItems,
  updateOrder,
} from '@/db/orders';
import { listProducts } from '@/db/products';
import type { DraftItem, OrderWithItems, Product } from '@/types';
import { formatBDT } from '@/utils/currency';
import { dozenEquivalent, formatQty } from '@/utils/units';
import { formatDate } from '@/utils/dates';
import { newId } from '@/utils/ids';
import { colors, spacing } from '@/theme';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [o, c] = await Promise.all([
      getOrderWithItems(db, String(id)),
      listProducts(db),
    ]);
    setOrder(o);
    setCatalog(c);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load().catch(console.warn);
    }, [load])
  );

  if (!order) {
    return (
      <Screen>
        <View style={styles.body}>
          <Text style={styles.muted}>Loading order...</Text>
        </View>
      </Screen>
    );
  }

  function toDraft(): DraftItem[] {
    return order!.items.map((i) => ({
      key: newId(),
      productId: i.productId,
      productTitle: i.productTitle,
      quantity: i.quantity,
      unit: i.unit,
      price: i.price,
      catalogUnit: i.catalogUnit ?? null,
    }));
  }

  function confirmDelete() {
    if (!order) return;
    const orderId: string = order.id;
    Alert.alert('Delete this order?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteOrder(db, orderId);
          router.back();
        },
      },
    ]);
  }

  function confirmArchive() {
    if (!order) return;
    const orderId: string = order.id;
    Alert.alert('Archive order?', 'It will move to Previous Orders.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          await archiveOrder(db, orderId);
          load();
          router.back();
        },
      },
    ]);
  }

  if (editing) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Edit Order</Text>
          <OrderEditor
            initialShop={order.shopName}
            initialLocation={order.location}
            initialPhone={order.phone ?? ''}
            initialNote={order.note ?? ''}
            initialItems={toDraft()}
            catalog={catalog}
            saveTitle="Save Changes"
            onSave={async (data) => {
              await updateOrder(db, order.id, {
                shopName: data.shopName,
                location: data.location,
                phone: data.phone || null,
                note: data.note || null,
                items: data.items,
              });
              setEditing(false);
              load();
            }}
          />
          <View style={{ marginTop: 10 }}>
            <AppButton title="Cancel" variant="secondary" onPress={() => setEditing(false)} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>{order.shopName}</Text>
        <Text style={styles.muted}>{order.location}</Text>
        {order.phone ? <Text style={styles.muted}>{order.phone}</Text> : null}
        {order.note ? (
          <Card style={styles.noteCard}>
            <Text style={styles.noteLabel}>Note</Text>
            <Text style={styles.noteText}>{order.note}</Text>
          </Card>
        ) : null}
        <Text style={styles.muted}>
          {order.status === 'previous' ? `Archived · ${formatDate(order.updatedAt)}` : 'Active order'}
        </Text>

        <Text style={styles.section}>Products</Text>
        <Card>
          {order.items.map((it) => (
            <View key={it.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{it.productTitle}</Text>
                <Text style={styles.muted}>
                  {formatQty(it.quantity, it.unit)} × {formatBDT(it.price)}
                  {it.catalogUnit === 'dozen' && dozenEquivalent(it.quantity) !== null
                    ? ` = ${dozenEquivalent(it.quantity)} dozen`
                    : ''}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatBDT(it.quantity * it.price)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatBDT(order.total)}</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <AppButton title="Edit" variant="secondary" onPress={() => setEditing(true)} />
        </View>
        {order.status === 'active' ? (
          <View style={styles.actions}>
            <AppButton title="Archive Order" onPress={confirmArchive} />
          </View>
        ) : null}
        <View style={styles.actions}>
          <AppButton title="Delete" variant="danger" onPress={confirmDelete} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.secondary, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemTotal: { fontSize: 15, fontWeight: '700', color: colors.text },
  noteCard: { marginTop: 12 },
  noteLabel: { fontSize: 13, fontWeight: '700', color: colors.secondary, marginBottom: 4 },
  noteText: { fontSize: 15, color: colors.text },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.text },
  actions: { marginTop: 12 },
});
