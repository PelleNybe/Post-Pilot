import {
  minifyPostsList,
  expandPostsList,
  minifyPosts,
  expandPosts,
} from './posts.list.minify';

describe('posts.list.minify', () => {
  const samplePost = {
    id: 'post-1',
    content: 'Hello world',
    publishDate: '2023-01-01T00:00:00Z',
    releaseURL: 'https://example.com/post-1',
    releaseId: 'rel-1',
    state: 'published',
    group: 'group-1',
    integration: {
      id: 'int-1',
      providerIdentifier: 'twitter',
      name: 'Twitter Account',
      picture: 'https://example.com/pic.png',
    },
    tags: [
      {
        tag: {
          id: 'tag-1',
          name: 'news',
          color: 'blue',
          orgId: 'org-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          deletedAt: null,
        },
      },
    ],
    intervalInDays: 0,
    actualDate: '2023-01-01T00:00:00Z',
    unknownField: 'this should stay same',
  };

  const samplePostsListData = {
    posts: [samplePost],
    total: 1,
    page: 1,
    limit: 10,
    hasMore: false,
  };

  describe('minifyPostsList & expandPostsList', () => {
    it('should minify posts list correctly', () => {
      const minified = minifyPostsList(samplePostsListData);

      // Verify top level keys
      expect(minified).toHaveProperty('p'); // posts
      expect(minified).toHaveProperty('t', 1); // total
      expect(minified).toHaveProperty('pg', 1); // page
      expect(minified).toHaveProperty('l', 10); // limit
      expect(minified).toHaveProperty('hm', false); // hasMore

      // Verify post item keys
      const minifiedPost = minified.p[0];
      expect(minifiedPost).toHaveProperty('i', 'post-1'); // id
      expect(minifiedPost).toHaveProperty('c', 'Hello world'); // content
      expect(minifiedPost).toHaveProperty('n'); // integration
      expect(minifiedPost.n).toHaveProperty('pi', 'twitter'); // providerIdentifier
      expect(minifiedPost).toHaveProperty('tg'); // tags
      expect(minifiedPost.tg[0].t).toHaveProperty('n', 'news'); // tag name
      expect(minifiedPost).toHaveProperty('unknownField', 'this should stay same');
    });

    it('should round-trip posts list correctly', () => {
      const minified = minifyPostsList(samplePostsListData);
      const expanded = expandPostsList(minified);

      expect(expanded).toEqual(samplePostsListData);
    });

    it('should handle empty posts list', () => {
      const emptyData = {
        posts: [],
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false,
      };
      const minified = minifyPostsList(emptyData);
      const expanded = expandPostsList(minified);

      expect(expanded).toEqual(emptyData);
    });

    it('should handle posts without integration or tags', () => {
      const minimalPost = {
        id: 'post-2',
        content: 'Minimal',
      };
      const data = {
        posts: [minimalPost],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      };

      const minified = minifyPostsList(data);
      const expanded = expandPostsList(minified);

      expect(expanded).toEqual(data);
    });
  });

  describe('minifyPosts & expandPosts (Calendar View)', () => {
    it('should minify calendar posts correctly', () => {
      const data = { posts: [samplePost] };
      const minified = minifyPosts(data);

      expect(minified).toHaveProperty('p');
      expect(minified.p[0]).toHaveProperty('i', 'post-1');
    });

    it('should round-trip calendar posts correctly', () => {
      const data = { posts: [samplePost] };
      const minified = minifyPosts(data);
      const expanded = expandPosts(minified);

      expect(expanded).toEqual(data);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values in optional fields', () => {
      const data = {
        posts: [{
          id: 'post-3',
          integration: null,
          tags: null,
        }],
        total: 1,
        page: 1,
        limit: 10,
        hasMore: false,
      };

      const minified = minifyPostsList(data);
      const expanded = expandPostsList(minified);

      expect(expanded).toEqual(data);
    });

    it('should handle missing fields in expansion gracefully', () => {
        // If expansion receives an object with missing keys, it should handle it
        const minified = { p: [] }; // missing t, pg, l, hm
        const expanded = expandPostsList(minified);

        expect(expanded).toHaveProperty('posts', []);
        // Other fields will be undefined as they are not in the mapping or the input
        expect(expanded.total).toBeUndefined();
    });
  });
});
