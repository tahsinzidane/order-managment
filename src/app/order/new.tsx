import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '@/components/ui';
import { OrderEditor } from '@/components/OrderEditor';
import { createOrder } from '@/db/orders';
import { listProducts } from '@/db/products';
import type { Product } from '@/types';
import { colors, spacing } from '@/theme';

export default function NewOrderScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      listProducts(db).then(setCatalog).catch(console.warn);
    }, [db])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Order</Text>
        {catalog.length === 0 ? (
          <Text style={styles.hint}>
            Catalog is empty. Add products in Catalog first, or save shop info and add items later
            via Edit.
          </Text>
        ) : null}
        <OrderEditor
          key={formKey}
          initialShop=""
          initialLocation=""
          initialPhone=""
          initialNote=""
          initialItems={[]}
          catalog={catalog}
          saveTitle="Save Order"
          onSave={async (data) => {
            const id = await createOrder(db, {
              shopName: data.shopName,
              location: data.location,
              phone: data.phone || null,
              note: data.note || null,
              items: data.items,
            });
            setFormKey((k) => k + 1);
            router.replace(`/order/${id}`);
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { fontSize: 13, color: colors.secondary, marginTop: 6 },
});
