import { generateInvitationCode } from '../class.service';

describe('Class Service - Simple Tests', () => {
  it('should generate invitation code', () => {
    const code = generateInvitationCode();
    expect(code).toBeDefined();
    expect(typeof code).toBe('string');
    expect(code.length).toBe(8); // 4 bytes = 8 hex characters
  });
});
