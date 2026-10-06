import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ProductInput, Unit } from '@/types';
import { UNITS } from '@/utils/units';
import { colors } from '@/theme';
import { AppButton, AppInput, FieldLabel } from '@/components/ui';

export function ProductForm({
  initial,
  submitTitle,
  onSubmit,
}: {
  initial: ProductInput;
  submitTitle: string;
  onSubmit: (input: ProductInput) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [price, setPrice] = useState(initial.price ? String(initial.price) : '');
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const [quantity, setQuantity] = useState(
    initial.quantity !== undefined && initial.quantity !== null ? String(initial.quantity) : ''
  );
  const [imageUri, setImageUri] = useState<string | null>(initial.imageUri ?? null);
  const [error, setError] = useState<string | null>(null);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow gallery access to add a product image. You can still save the product without one.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  function handleSubmit() {
    const priceNum = Number(price);
    const qtyTrim = quantity.trim();
    const qtyNum = qtyTrim === '' ? null : Number(qtyTrim);
    if (!title.trim()) return setError('Product title is required.');
    if (price.trim() === '' || !Number.isFinite(priceNum)) return setError('Price is required.');
    if (priceNum < 0) return setError('Price must be 0 or greater.');
    if (qtyTrim !== '' && (!Number.isFinite(qtyNum!) || qtyNum! < 0))
      return setError('Quantity must be 0 or greater.');
    setError(null);
    onSubmit({ title: title.trim(), price: priceNum, unit, quantity: qtyNum, imageUri });
  }

  return (
    <View>
      <FieldLabel>Product Image (optional)</FieldLabel>
      {imageUri ? (
        <View>
          <Image source={{ uri: imageUri }} style={styles.preview} />
          <View style={styles.imageActions}>
            <Pressable onPress={pickImage} style={styles.imageBtn}>
              <Text style={styles.imageBtnText}>Replace</Text>
            </Pressable>
            <Pressable onPress={() => setImageUri(null)} style={styles.imageBtn}>
              <Text style={[styles.imageBtnText, styles.removeText]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable onPress={pickImage} style={styles.imageBox}>
          <Text style={styles.imageBoxTitle}>Add Image</Text>
          <Text style={styles.imageBoxSub}>Choose from Gallery</Text>
        </Pressable>
      )}
      <FieldLabel>Product Title</FieldLabel>
      <AppInput value={title} onChangeText={setTitle} placeholder="N124" autoCapitalize="characters" />
      <FieldLabel>Price</FieldLabel>
      <AppInput
        value={price}
        onChangeText={setPrice}
        placeholder="480"
        keyboardType="decimal-pad"
      />
      <FieldLabel>Unit</FieldLabel>
      <View style={styles.units}>
        {UNITS.map((u) => (
          <Pressable
            key={u.value}
            onPress={() => setUnit(u.value)}
            style={[styles.unitBtn, unit === u.value && styles.unitBtnActive]}
          >
            <Text style={[styles.unitText, unit === u.value && styles.unitTextActive]}>
              {u.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FieldLabel>Quantity (optional)</FieldLabel>
      <AppInput
        value={quantity}
        onChangeText={setQuantity}
        placeholder="100"
        keyboardType="decimal-pad"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ marginTop: 18 }}>
        <AppButton title={submitTitle} onPress={handleSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  units: { flexDirection: 'row', gap: 8 },
  unitBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: { backgroundColor: colors.button, borderColor: colors.button },
  unitText: { fontSize: 15, fontWeight: '600', color: colors.text },
  unitTextActive: { color: colors.buttonText },
  imageBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: colors.card,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageBoxTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  imageBoxSub: { fontSize: 13, color: colors.secondary },
  preview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: colors.muted },
  imageActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  imageBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBtnText: { fontSize: 14, fontWeight: '600', color: colors.text },
  removeText: { color: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: 10 },
});
