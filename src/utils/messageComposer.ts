import { NEEDS, ENERGY_STATUSES, SYMPTOMS } from './communicationData';

export const composeMessage = (
  selectedNeeds: string[],
  energyStatus: string | null,
  selectedSymptoms: string[]
): string => {
  let message = 'Hi, thanks for being here.\n\n';

  if (energyStatus) {
    const status = ENERGY_STATUSES.find(s => s.id === energyStatus);
    if (status) {
      message += `${status.label} - ${status.description}\n\n`;
    }
  }

  if (selectedNeeds.length > 0) {
    message += 'I need:\n';
    selectedNeeds.forEach(needId => {
      const need = NEEDS.find(n => n.id === needId);
      if (need) {
        message += `• ${need.speech}\n`;
      }
    });
    message += '\n';
  }

  if (selectedSymptoms.length > 0) {
    message += 'Current Symptoms: ';
    const symptomTexts = selectedSymptoms.map(symptomId => {
      const symptom = SYMPTOMS.find(s => s.id === symptomId);
      return symptom ? symptom.label : '';
    }).filter(Boolean);
    message += symptomTexts.join(', ') + '\n\n';
  }

  message += 'Thank you, I appreciate you.\nSent with Spoonfull.app';

  return message;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
};

const isAndroid = (): boolean => {
  return /android/i.test(navigator.userAgent);
};

export const openSMS = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const separator = isAndroid() ? '?' : '&';
  window.location.href = `sms:${separator}body=${encodedMessage}`;
};
