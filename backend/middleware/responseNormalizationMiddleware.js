const isPlainObject = (value) => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const toStatusCodeName = (statusCode) => {
  if (statusCode >= 500) return 'SERVER_ERROR';
  if (statusCode === 429) return 'RATE_LIMITED';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode >= 400) return 'BAD_REQUEST';
  return 'ERROR';
};

const normalizeErrorPayload = (payload, req, statusCode) => {
  if (!isPlainObject(payload) || payload.success !== false) {
    return payload;
  }

  const normalized = { ...payload };

  if (!normalized.message) {
    if (typeof normalized.error === 'string' && normalized.error.trim()) {
      normalized.message = normalized.error.trim();
    } else if (isPlainObject(normalized.error) && typeof normalized.error.message === 'string') {
      normalized.message = normalized.error.message;
    } else {
      normalized.message = 'Internal Server Error';
    }
  }

  if (!normalized.code) {
    normalized.code = toStatusCodeName(statusCode);
  }

  if (!normalized.timestamp) {
    normalized.timestamp = new Date().toISOString();
  }

  if (req?.id && !normalized.requestId) {
    normalized.requestId = req.id;
  }

  return normalized;
};

const normalizeErrorResponses = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    const normalizedPayload = normalizeErrorPayload(payload, req, res.statusCode);
    return originalJson(normalizedPayload);
  };

  next();
};

export default normalizeErrorResponses;
