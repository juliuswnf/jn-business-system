import { describe, it, expect } from '@jest/globals';
import { createMockRequest, createMockResponse, createMockNext } from '../mocks/request.js';
import { sanitizeInput, sanitizeHTML } from '../../middleware/sanitizationMiddleware.js';
import { sanitizeMongoQuery } from '../../utils/securityHelpers.js';

describe('security sanitization', () => {
  it('sanitizes nested request payloads to reduce XSS risk', () => {
    const req = createMockRequest({
      body: {
        name: '<script>alert(1)</script>Max',
        nested: {
          notes: '<img src=x onerror="alert(1)">safe'
        },
        tags: ['<b>vip</b>', '<svg onload="alert(2)">new']
      },
      query: {
        q: '<b>query</b>'
      },
      params: {
        id: '<svg onload="x">123'
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    sanitizeInput(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.name).toBe('alert(1)Max');
    expect(req.body.nested.notes).toBe('safe');
    expect(req.body.tags).toEqual(['vip', 'new']);
    expect(req.query.q).toBe('query');
    expect(req.params.id).toBe('123');
  });

  it('removes dangerous HTML constructs in rich text fields', () => {
    const req = createMockRequest({
      body: {
        content: '<p onclick="alert(1)">Hello<script>alert(2)</script><a href="javascript:alert(3)">go</a></p>'
      }
    });
    const res = createMockResponse();
    const next = createMockNext();

    sanitizeHTML(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.content).not.toContain('<script');
    expect(req.body.content).not.toContain('onclick=');
    expect(req.body.content).not.toContain('javascript:');
  });

  it('strips mongo operators and prototype pollution keys', () => {
    const payload = {
      email: 'test@example.com',
      $or: [{ role: 'ceo' }],
      profile: {
        __proto__: 'bad',
        constructor: 'bad',
        name: 'Safe',
        nested: {
          $ne: 'x',
          keep: 1
        }
      }
    };

    const sanitized = sanitizeMongoQuery(payload);

    expect(sanitized.email).toBe('test@example.com');
    expect(sanitized.$or).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(sanitized.profile, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(sanitized.profile, 'constructor')).toBe(false);
    expect(sanitized.profile.name).toBe('Safe');
    expect(Object.prototype.hasOwnProperty.call(sanitized.profile.nested, '$ne')).toBe(false);
    expect(sanitized.profile.nested.keep).toBe(1);
  });
});
