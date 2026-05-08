// =============================================
// Jaddidha - Storage Service (Image Upload)
// =============================================
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseClient } from '@/template';
import { Platform } from 'react-native';

const supabase = getSupabaseClient();

const BUCKET = 'product-images';

export async function pickAndUploadImage(): Promise<string | null> {
  // Request permissions
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;
  }

  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];

  // Generate unique filename
  const ext = asset.uri.split('.').pop() || 'jpg';
  const fileName = `product_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    // Use base64 for mobile (file:// can't be fetched)
    if (asset.base64) {
      const base64Data = asset.base64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, byteArray, {
          contentType: asset.mimeType || 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      return urlData.publicUrl;
    }
    return null;
  } catch (e) {
    console.error('Upload error:', e);
    return null;
  }
}

export async function takeAndUploadPhoto(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    base64: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop() || 'jpg';
  const fileName = `product_cam_${Date.now()}.${ext}`;

  try {
    if (asset.base64) {
      const byteCharacters = atob(asset.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, byteArray, {
          contentType: asset.mimeType || 'image/jpeg',
          upsert: false,
        });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      return urlData.publicUrl;
    }
    return null;
  } catch (e) {
    console.error('Camera upload error:', e);
    return null;
  }
}
