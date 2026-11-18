import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/materials.tsx'),
  route('materials/:id', 'routes/material.tsx'),
] satisfies RouteConfig;
