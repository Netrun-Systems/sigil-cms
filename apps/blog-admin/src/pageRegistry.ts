/**
 * Blog Admin — Page registry mapping plugin routes to React page components.
 *
 * Routes correspond to the admin nav items registered by the blog plugin:
 *   - Posts list and editor
 *   - Categories tree editor
 *   - Tags manager
 *   - Authors list and editor
 *   - Comments moderation queue
 */

import type { ComponentType } from 'react';
import DashboardPage from './pages/DashboardPage';
import PostsListPage from './pages/PostsListPage';
import PostEditorPage from './pages/PostEditorPage';
import CategoriesPage from './pages/CategoriesPage';
import TagsPage from './pages/TagsPage';
import AuthorsPage from './pages/AuthorsPage';
import CommentsPage from './pages/CommentsPage';

export const pageRegistry: Record<string, ComponentType> = {
  '/': DashboardPage,
  '/posts': PostsListPage,
  '/posts/new': PostEditorPage,
  '/posts/:id': PostEditorPage,
  '/categories': CategoriesPage,
  '/tags': TagsPage,
  '/authors': AuthorsPage,
  '/comments': CommentsPage,
};
