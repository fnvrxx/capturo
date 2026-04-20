export function getConfidenceLevel(score) {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export function getConfidenceColor(level) {
  if (level === 'high') return 'green';
  if (level === 'medium') return 'amber';
  return 'red';
}

export function getConfidenceBadgeClass(level) {
  if (level === 'high') return 'bg-green-100 text-green-700';
  if (level === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export function getConfidenceBarClass(level) {
  if (level === 'high') return 'bg-green-500';
  if (level === 'medium') return 'bg-amber-500';
  return 'bg-red-500';
}

export function formatConfidence(score) {
  return `${Math.round(score * 100)}%`;
}

export function generateSimulatedOcrData(fields) {
  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  const generateValue = (field) => {
    switch (field.type) {
      case 'number':
        return String(Math.floor(Math.random() * 100) + 1);
      case 'date': {
        const d = new Date();
        return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      case 'currency': {
        const amounts = [1250000, 2750000, 4500000, 7850000, 12000000, 3450000];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        return `Rp ${amount.toLocaleString('id-ID')}`;
      }
      case 'email':
        return 'vendor@example.com';
      default:
        return `Sample ${field.name} Value`;
    }
  };

  const totalFields = fields.length;
  const shuffled = [...fields].sort(() => Math.random() - 0.5);

  const lowCount = Math.min(1, totalFields);
  const mediumCount = Math.min(2, totalFields - lowCount);

  const confidences = {};
  shuffled.forEach((field, i) => {
    if (i < lowCount) {
      confidences[field.name] = randomBetween(0.2, 0.45);
    } else if (i < lowCount + mediumCount) {
      confidences[field.name] = randomBetween(0.5, 0.78);
    } else {
      confidences[field.name] = randomBetween(0.8, 0.99);
    }
  });

  const rawFields = {};
  fields.forEach((field) => {
    const level = getConfidenceLevel(confidences[field.name]);
    rawFields[field.name] = generateValue(field) + (level === 'low' ? ' ?' : '');
  });

  return { rawFields, confidences };
}
