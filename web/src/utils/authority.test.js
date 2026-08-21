import { extractAuthorityFromResponse, getAuthority } from './authority';

describe('getAuthority should be strong', () => {
  it('empty', () => {
    expect(getAuthority(null)).toEqual([]);
  });
  it('string', () => {
    expect(getAuthority('admin')).toEqual(['admin']);
  });
  it('array with double quotes', () => {
    expect(getAuthority('"admin"')).toEqual(['admin']);
  });
  it('array with single item', () => {
    expect(getAuthority('["admin"]')).toEqual(['admin']);
  });
  it('array with multiple items', () => {
    expect(getAuthority('["admin", "guest"]')).toEqual(['admin', 'guest']);
  });
});

describe('extractAuthorityFromResponse', () => {
  it('prefers privilege from login response', () => {
    expect(
      extractAuthorityFromResponse({
        privilege: ['workbench:all', 'cluster.overview:all'],
      })
    ).toEqual(['workbench:all', 'cluster.overview:all']);
  });

  it('falls back to permissions from current user profile', () => {
    expect(
      extractAuthorityFromResponse({
        _source: {
          permissions: ['system.security:all'],
        },
      })
    ).toEqual(['system.security:all']);
  });
});
