import { useState } from 'react';
import { ModalType } from '@/components/ui/StyledModal';

interface ModalState {
  visible: boolean;
  type: ModalType;
  title: string;
  message?: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const showModal = (
    type: ModalType,
    title: string,
    message?: string,
    primaryButton?: { text: string; onPress: () => void },
    secondaryButton?: { text: string; onPress: () => void }
  ) => {
    setModalState({
      visible: true,
      type,
      title,
      message,
      primaryButton,
      secondaryButton,
    });
  };

  const hideModal = () => {
    setModalState((prev) => ({ ...prev, visible: false }));
  };

  const showSuccess = (title: string, message?: string, onClose?: () => void) => {
    showModal('success', title, message, {
      text: 'OK',
      onPress: () => {
        hideModal();
        onClose?.();
      },
    });
  };

  const showError = (title: string, message?: string, onClose?: () => void) => {
    showModal('error', title, message, {
      text: 'OK',
      onPress: () => {
        hideModal();
        onClose?.();
      },
    });
  };

  const showWarning = (title: string, message?: string, onClose?: () => void) => {
    showModal('warning', title, message, {
      text: 'OK',
      onPress: () => {
        hideModal();
        onClose?.();
      },
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal(
      'warning',
      title,
      message,
      {
        text: 'Confirmer',
        onPress: () => {
          hideModal();
          onConfirm();
        },
      },
      {
        text: 'Annuler',
        onPress: () => {
          hideModal();
          onCancel?.();
        },
      }
    );
  };

  return {
    modalState,
    showModal,
    hideModal,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
  };
}
