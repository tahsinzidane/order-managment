import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen } from '@/components/ui';
import { ProductForm } from '@/components/ProductForm';
import { getProduct, updateProduct } from '@/db/products';
import type { Product } from '@/types';
import { colors, spacing } from '@/theme';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) getProduct(db, String(id)).then(setProduct).catch(console.warn);
    }, [db, id])
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Product</Text>
        {!product ? (
          <View>
            <Text>Loading...</Text>
          </View>
        ) : (
          <ProductForm
            initial={{
              title: product.title,
              price: product.price,
              unit: product.unit,
              quantity: product.quantity,
              imageUri: product.imageUri ?? null,
            }}
            submitTitle="Save Changes"
            onSubmit={async (input) => {
              await updateProduct(db, product.id, input);
              router.back();
            }}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
});
