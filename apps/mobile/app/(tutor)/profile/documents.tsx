import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { ApiClient } from '@/utils/api';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import type { TutorProfileResponse } from '@/types/api';

interface Document {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<string[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string>('pending');

  useEffect(() => {
    if (user?.role !== 'tutor') {
      Alert.alert('Error', 'Only tutors can upload verification documents');
      router.back();
      return;
    }
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const profile = await ApiClient.get<TutorProfileResponse>(`/tutors/profile/${user?.id}`);
      setUploadedDocuments(profile.verificationDocuments || []);
      setVerificationStatus(profile.isVerified ? 'verified' : 'pending');
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const doc = result.assets[0];
        setDocuments([
          ...documents,
          {
            uri: doc.uri,
            name: doc.name,
            type: doc.mimeType || 'application/pdf',
            size: doc.size,
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newDocs = result.assets.map((asset: ImagePicker.ImagePickerAsset) => ({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: asset.fileSize,
      }));
      setDocuments([...documents, ...newDocs]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDocuments([
        ...documents,
        {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: asset.fileSize,
        },
      ]);
    }
  };

  const removeDocument = (index: number) => {
    Alert.alert('Remove Document', 'Are you sure you want to remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newDocs = documents.filter((_, i) => i !== index);
          setDocuments(newDocs);
        },
      },
    ]);
  };

  const uploadDocuments = async () => {
    if (documents.length === 0) {
      Alert.alert('No Documents', 'Please add at least one document to upload');
      return;
    }

    try {
      setIsUploading(true);

      // TODO: Implement actual file upload to S3
      // For now, we'll simulate the upload and use the URIs
      const documentUrls = documents.map((doc) => doc.uri);

      await ApiClient.post(`/tutors/${user?.id}/documents`, {
        documentUrls,
      });

      Alert.alert(
        'Success',
        'Documents uploaded successfully. Your profile will be reviewed by our team.',
        [
          {
            text: 'OK',
            onPress: () => {
              setDocuments([]);
              loadDocuments();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to upload documents:', error);
      Alert.alert('Error', error.message || 'Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  const showUploadOptions = () => {
    Alert.alert('Add Document', 'Choose how to add your document', [
      {
        text: 'Take Photo',
        onPress: takePhoto,
      },
      {
        text: 'Choose from Library',
        onPress: pickImage,
      },
      {
        text: 'Browse Files',
        onPress: pickDocument,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View
            style={[
              styles.statusCard,
              verificationStatus === 'verified' && styles.statusCardVerified,
            ]}
          >
            <Text style={styles.statusIcon}>
              {verificationStatus === 'verified' ? '✓' : '⏱'}
            </Text>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {verificationStatus === 'verified' ? 'Verified' : 'Pending Verification'}
              </Text>
              <Text style={styles.statusDescription}>
                {verificationStatus === 'verified'
                  ? 'Your profile has been verified by our team'
                  : 'Upload your diplomas and certificates for verification'}
              </Text>
            </View>
          </View>
        </View>

        {/* Uploaded Documents */}
        {uploadedDocuments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
            <Text style={styles.sectionSubtitle}>
              {uploadedDocuments.length} document{uploadedDocuments.length > 1 ? 's' : ''} submitted
            </Text>
            {uploadedDocuments.map((url, index) => (
              <View key={index} style={styles.uploadedDocCard}>
                <View style={styles.docIcon}>
                  <Text style={styles.docIconText}>📄</Text>
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docName}>Document {index + 1}</Text>
                  <Text style={styles.docStatus}>Submitted for review</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Requirements</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>📋 What to Upload</Text>
            <Text style={styles.instructionText}>
              • University diplomas or degrees{'\n'}
              • Teaching certificates{'\n'}
              • Professional qualifications{'\n'}
              • Identity verification (ID or passport)
            </Text>
          </View>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>✅ File Requirements</Text>
            <Text style={styles.instructionText}>
              • Clear, readable images or PDFs{'\n'}
              • Maximum 10 MB per file{'\n'}
              • Supported formats: PDF, JPG, PNG{'\n'}
              • All text must be legible
            </Text>
          </View>
        </View>

        {/* New Documents to Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Documents</Text>
          
          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>📁</Text>
              <Text style={styles.emptyStateText}>No documents added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your verification documents to get started
              </Text>
            </View>
          ) : (
            documents.map((doc, index) => (
              <View key={index} style={styles.docCard}>
                {doc.type.startsWith('image/') ? (
                  <Image source={{ uri: doc.uri }} style={styles.docPreview} />
                ) : (
                  <View style={styles.docIcon}>
                    <Text style={styles.docIconText}>📄</Text>
                  </View>
                )}
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.docSize}>{formatFileSize(doc.size)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeDocument(index)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity style={styles.addButton} onPress={showUploadOptions}>
            <Text style={styles.addButtonText}>+ Add Document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {documents.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setDocuments([])}
          >
            <Text style={styles.secondaryButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, isUploading && styles.buttonDisabled]}
            onPress={uploadDocuments}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Upload {documents.length} Document{documents.length > 1 ? 's' : ''}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statusCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  statusCardVerified: {
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  instructionCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  uploadedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 12,
  },
  docPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  docIcon: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  docIconText: {
    fontSize: 32,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  docSize: {
    fontSize: 12,
    color: '#666',
  },
  docStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
