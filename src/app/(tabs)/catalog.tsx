import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppInput, EmptyState, Screen } from '@/components/ui';
import { ProductCard } from '@/components/ProductCard';
import { deleteProduct, listProducts } from '@/db/products';
import type { Product } from '@/types';
import { colors, spacing } from '@/theme';

export default function CatalogScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (search?: string) => {
      try {
        setItems(await listProducts(db, search ?? q));
      } catch (e) {
        console.warn('catalog load failed', e);
      } finally {
        setLoading(false);
      }
    },
    [db, q]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(p: Product) {
    Alert.alert('Delete product?', `${p.title} will be removed from the catalog. Old orders keep it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(db, p.id);
          load();
        },
      },
    ]);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Catalog</Text>
        <Text style={styles.add} onPress={() => router.push('/product/new')}>
          + Add
        </Text>
      </View>
      <View style={{ paddingHorizontal: spacing.md }}>
        <AppInput
          value={q}
          onChangeText={(t) => {
            setQ(t);
            load(t);
          }}
          placeholder="Search products..."
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => load()}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No products yet"
              message="Add your first product to start building your catalog."
              actionTitle="+ Add Product"
              onAction={() => router.push('/product/new')}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={() => router.push(`/product/${item.id}`)}
            onDelete={() => confirmDelete(item)}
            onPress={() => router.push(`/product/details/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  add: { fontSize: 16, fontWeight: '700', color: colors.text },
  list: { padding: spacing.md, paddingBottom: 32 },
});
