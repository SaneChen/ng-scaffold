/**
 * Check that route discovery enumerates leaves and refuses unsupported or circular sources.
 * How this file was built: Node test runner with synthetic Angular route source strings.
 * Why: silent route omissions would make a full accessibility claim misleading.
 */
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { routePaths } from './e2e-routes.mjs';

test('enumerates nested lazy leaves, identifier children and literal route maps', () => {
  const files = {
    'root.ts': `const routes = [{path:'auth',component:Layout,children:[{path:'login',component:Login}]},{path:'demo',loadChildren:()=>import('./nested')},{path:'',redirectTo:'demo'},{path:'**',component:ErrorPage}] satisfies Routes;`,
    'nested.ts': `const CHILDREN=[{path:'overview',component:Overview}]; export default [{path:'profile',children:CHILDREN},...['first','second'].map(name=>({path:name+'-tab',component:Tab}))] satisfies Routes;`,
  };
  assert.equal(
    JSON.stringify(routePaths(file => files[file], 'root.ts')),
    JSON.stringify(['auth/login', 'demo/first-tab', 'demo/profile/overview', 'demo/second-tab'])
  );
});

test('refuses circular lazy imports and unsupported children or spread expressions', () => {
  assert.throws(
    () =>
      routePaths(
        () => `const routes=[{path:'again',loadChildren:()=>import('./root')}];`,
        'root.ts'
      ),
    /Circular/
  );
  assert.throws(
    () => routePaths(() => `const routes=[{path:'parent',children:unknownRoutes}];`, 'root.ts'),
    /Unsupported route children/
  );
  assert.throws(
    () => routePaths(() => `const routes=[...unknownRoutes];`, 'root.ts'),
    /Unsupported route expression/
  );
  assert.throws(
    () => routePaths(() => `const routes=[{path:dynamicPath,component:Page}];`, 'root.ts'),
    /statically enumerable/
  );
});

test('includes the actual demo and starter leaves without layout parent URLs', () => {
  const routes = routePaths(file => readFileSync(file, 'utf8'));
  assert.ok(routes.length >= 65);
  for (const route of [
    'auth/login',
    'auth/signup',
    'dashboard',
    'forms/select',
    'tables/kitchen-sink',
    'material/tab/sunny-tab',
  ])
    assert.ok(routes.includes(route), route);
  assert.ok(!routes.includes('auth'));
  assert.ok(!routes.includes('profile'));
});
